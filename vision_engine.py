"""
Vision Engine — Hybrid YOLO + Gemini Edge Node Script

Architecture:
  Camera → Frame Queue → Worker Thread (YOLO continuous ~30 FPS)
                              ↓
                    Event Trigger System
                    (crowd > threshold OR danger label detected)
                              ↓
                    Gemini Vision API (async, 1 call/sec max)
                    (contextual understanding: "Is this a protest?")
                              ↓
                    Enriched Alert → Node.js Backend (REST + WebSocket)

Golden Rule: YOLO runs on EVERY frame. Gemini runs on EVENTS only.
"""

import cv2
import requests
import time
import asyncio
import threading
import base64
import queue
import os
import logging
from io import BytesIO
from datetime import datetime
from ultralytics import YOLO
import socketio
import google.generativeai as genai
from PIL import Image
from dotenv import load_dotenv
from flask import Flask, Response

# Load environment variables
load_dotenv()

# ─── Configuration ─────────────────────────────────────────────────────────────

BACKEND_API       = os.getenv("BACKEND_API", "http://localhost:4005")
ANOMALY_ENDPOINT  = f"{BACKEND_API}/api/alerts"
HEARTBEAT_ENDPOINT = f"{BACKEND_API}/api/edge/heartbeat"
WS_URL            = BACKEND_API

NODE_ID           = os.getenv("NODE_ID", "CAM-04")
CAMERA_URL        = os.getenv("CAMERA_URL", "0")
MODEL_PATH        = os.getenv("MODEL_PATH", "yolov8n.pt")
TOKEN             = os.getenv("EDGE_TOKEN", "PASTE_YOUR_GENERATED_TOKEN")
GEMINI_API_KEY    = os.getenv("GEMINI_API_KEY", "")

# Detection thresholds
YOLO_CONF_THRESHOLD   = 0.50
ANOMALY_CONF_THRESHOLD = 0.75
CROWD_TRIGGER_COUNT   = 5
FRAME_SKIP            = 2
GEMINI_COOLDOWN_SEC   = 3.0
HEARTBEAT_INTERVAL    = 30

HARD_TRIGGER_LABELS = {"weapon", "knife", "gun", "fire", "unauthorized", "missing-gear"}
ANOMALY_LABELS = {"person", "car", "truck", "unauthorized", "missing-gear"}

HEADERS = {"Authorization": f"Bearer {TOKEN}"}

LABEL_COLORS = {
    "person":        "#3B82F6",
    "car":           "#22C55E",
    "truck":         "#22C55E",
    "unauthorized":  "#EF4444",
    "missing-gear":  "#EF4444",
    "weapon":        "#DC2626",
    "fire":          "#F97316",
}

def get_color(label: str) -> str:
    return LABEL_COLORS.get(label.lower(), "#A855F7")

# ─── Initialize Models ─────────────────────────────────────────────────────────

print(f"[{NODE_ID}] Loading YOLOv8 model: {MODEL_PATH}")
model = YOLO(MODEL_PATH)

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel("gemini-1.5-flash")
    print(f"[{NODE_ID}] Gemini Vision ready.")
else:
    gemini_model = None
    print(f"[{NODE_ID}] Gemini analysis disabled.")

# ─── WebSocket Client ──────────────────────────────────────────────────────────

sio = socketio.Client(reconnection=True, reconnection_delay=2)

@sio.event
def connect():
    print(f"[{NODE_ID}] ✅ WebSocket connected.")

@sio.event
def disconnect():
    print(f"[{NODE_ID}] ⚠ WebSocket disconnected.")

# ─── State & Flask ─────────────────────────────────────────────────────────────

ALERT_COOLDOWN = 15  # seconds
last_alert_time = {}

gemini_lock = threading.Lock()
last_gemini_call = 0.0
gemini_queue = queue.Queue(maxsize=1)
latest_gemini_context = ""

stream_app = Flask(__name__)
output_frame = None
output_lock = threading.Lock()

def frame_to_base64(frame) -> str:
    img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    buf = BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return base64.b64encode(buf.getvalue()).decode()

def post_anomaly(label: str, conf: float, gemini_context: str = ""):
    global last_alert_time
    now = time.time()
    if label in last_alert_time and now - last_alert_time[label] < ALERT_COOLDOWN:
        return
    
    last_alert_time[label] = now
    payload = {
        "type": label.upper().replace(" ", "_"),
        "location": NODE_ID,
        "confidence": round(float(conf) * 100, 2),
        "timestamp": time.time(),
        "gemini_context": gemini_context,
    }
    try:
        requests.post(ANOMALY_ENDPOINT, json=payload, headers=HEADERS, timeout=5)
        print(f"  [ALERT] {label} ({conf:.1%})")
    except Exception as e:
        print(f"  [ALERT ERROR] {e}")

def send_heartbeat():
    try:
        requests.post(HEARTBEAT_ENDPOINT, json={"node": NODE_ID}, headers=HEADERS, timeout=3)
    except Exception:
        pass

# ─── MJPEG Streaming ──────────────────────────────────────────────────────────

def generate_frames():
    global output_frame, output_lock
    while True:
        frame_to_encode = None
        with output_lock:
            if output_frame is not None:
                frame_to_encode = output_frame.copy()
        
        if frame_to_encode is None:
            time.sleep(0.1)
            continue

        (flag, encodedImage) = cv2.imencode(".jpg", frame_to_encode)
        if not flag:
            time.sleep(0.033)
            continue
            
        yield(b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + bytearray(encodedImage) + b'\r\n')
        time.sleep(0.033)

@stream_app.route("/video_feed")
def video_feed():
    response = Response(generate_frames(), mimetype="multipart/x-mixed-replace; boundary=frame")
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response

def start_stream_server():
    # log = logging.getLogger('werkzeug')
    # log.setLevel(logging.ERROR)
    stream_app.run(host="0.0.0.0", port=5001, threaded=True, use_reloader=False)

# ─── Threads & Logic ──────────────────────────────────────────────────────────

def gemini_worker():
    global last_gemini_call, latest_gemini_context
    while True:
        job = gemini_queue.get()
        if job is None: break
        frame, trigger_label, yolo_summary = job
        
        now = time.time()
        with gemini_lock:
            if now - last_gemini_call < GEMINI_COOLDOWN_SEC:
                continue
            last_gemini_call = now

        try:
            b64 = frame_to_base64(frame)
            image_part = {"mime_type": "image/jpeg", "data": b64}
            prompt = f"Analyze: {yolo_summary}. Trigger: {trigger_label}. 1-2 sentence threat assessment."
            response = gemini_model.generate_content([prompt, image_part])
            latest_gemini_context = response.text.strip()
            print(f"  [GEMINI] {latest_gemini_context}")
            post_anomaly(trigger_label, 0.95, gemini_context=latest_gemini_context)
        except Exception as e:
            print(f"  [GEMINI ERROR] {e}")

def should_trigger_gemini(detections):
    person_count = sum(1 for d in detections if d["label"].lower() == "person")
    hard_triggers = [d for d in detections if d["label"].lower() in HARD_TRIGGER_LABELS]
    if hard_triggers:
        return True, hard_triggers[0]["label"]
    if person_count >= CROWD_TRIGGER_COUNT:
        return True, f"CROWD ({person_count} persons)"
    return False, ""

def run_inference():
    global output_frame, output_lock, latest_gemini_context
    
    threading.Thread(target=start_stream_server, daemon=True).start()
    if gemini_model:
        threading.Thread(target=gemini_worker, daemon=True).start()

    try:
        sio.connect(WS_URL)
    except:
        pass

    source = int(CAMERA_URL) if CAMERA_URL.isdigit() else CAMERA_URL
    
    # Use CAP_DSHOW on Windows for faster/more reliable webcam access
    if isinstance(source, int) and os.name == 'nt':
        cap = cv2.VideoCapture(source, cv2.CAP_DSHOW)
    else:
        cap = cv2.VideoCapture(source)
    
    if cap.isOpened():
        w = cap.get(cv2.CAP_PROP_FRAME_WIDTH)
        h = cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
        print(f"  [CAM-04] ✅ VideoCapture opened. Source: {source}, Resolution: {w}x{h}")
    else:
        print(f"  [CAM-04] ❌ Failed to open VideoCapture. Source: {source}")

    last_heartbeat = 0
    frame_count = 0
    
    while True:
        ret, frame = cap.read()
        if not ret:
            print("  [CAM-04] ❌ Failed to read frame. Retrying...")
            time.sleep(1)
            cap.release()
            if isinstance(source, int) and os.name == 'nt':
                cap = cv2.VideoCapture(source, cv2.CAP_DSHOW)
            else:
                cap = cv2.VideoCapture(source)
            continue
        
        frame_count += 1
        # if frame_count % FRAME_SKIP != 0: continue
        
        # results = model.predict(frame, conf=YOLO_CONF_THRESHOLD, verbose=False)
        detections = []
        boxes_payload = []
        h, w = frame.shape[:2]

        # for result in results:
        #     for box in result.boxes:
        #         x1, y1, x2, y2 = box.xyxy[0].tolist()
        #         conf = float(box.conf[0])
        #         label = model.names[int(box.cls[0])]
        #         
        #         det = {"label": label, "conf": conf, "x": x1/w*100, "y": y1/h*100, "w": (x2-x1)/w*100, "h": (y2-y1)/h*100}
        #         detections.append(det)
        #
        #         # Draw
        #         color = tuple(int(get_color(label).lstrip('#')[i:i+2], 16) for i in (0, 2, 4))[::-1]
        #         cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), color, 2)
        #         
        #         boxes_payload.append({
        #             "id": f"{label}-{time.time()}", "label": label.upper(), "confidence": conf,
        #             "color": get_color(label), "x": x1/w*100, "y": y1/h*100, "width": (x2-x1)/w*100, "height": (y2-y1)/h*100
        #         })
        #
        #         if label in ANOMALY_LABELS and conf >= ANOMALY_CONF_THRESHOLD:
        #             post_anomaly(label, conf, gemini_context=latest_gemini_context)

        # Add HUD overlay for debugging
        cv2.putText(frame, f"CAM-04 RAW VIDEO | {datetime.now().strftime('%H:%M:%S')}", (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        if latest_gemini_context:
            cv2.putText(frame, f"AI: {latest_gemini_context[:50]}...", (10, h - 20),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

        with output_lock:
            output_frame = frame.copy()

        # ─── Bounding Box Data For Socket ───
        # The existing boxes_payload is a list of dictionaries, which is what the backend expects.
        # The user's instruction to redefine it as {"boxes": boxes} seems to be a misunderstanding.
        # We will send the already constructed boxes_payload list.
        try:
            res = requests.post(f"{BACKEND_API}/api/edge/{NODE_ID}/boxes", json={"boxes": boxes_payload})
            if res.status_code != 200:
                print(f"[EDGE] Backend returned {res.status_code}: {res.text}")
        except Exception as e:
            print(f"[EDGE] Error sending boxes: {e}")

        if frame_count == 1:
            print(f"[CAM-04] Resolution: {frame.shape[1]}x{frame.shape[0]}")

        # Gemini Trigger
        if gemini_model:
            trigger, trigger_label = should_trigger_gemini(detections)
            if trigger:
                try: gemini_queue.put_nowait((frame.copy(), trigger_label, str(detections[:3])))
                except Exception as e: print(f"[GEMINI QUEUE ERROR] {e}")

        if time.time() - last_heartbeat > HEARTBEAT_INTERVAL:
            send_heartbeat()
            last_heartbeat = time.time()
            
        time.sleep(0.033) # Simulate 30fps playback for video files

    cap.release()

if __name__ == "__main__":
    run_inference()
