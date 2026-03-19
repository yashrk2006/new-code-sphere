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

Install:
    pip install ultralytics opencv-python requests python-socketio \
                google-generativeai pillow

Usage:
    python vision_engine.py
"""

import cv2
import requests
import time
import asyncio
import threading
import base64
import queue
import os
from io import BytesIO
from datetime import datetime
from ultralytics import YOLO
import socketio
import google.generativeai as genai
from PIL import Image

# ─── Configuration ─────────────────────────────────────────────────────────────

BACKEND_API       = os.getenv("BACKEND_API", "http://localhost:4000")
ANOMALY_ENDPOINT  = f"{BACKEND_API}/api/alerts"
HEARTBEAT_ENDPOINT = f"{BACKEND_API}/api/edge/heartbeat"
WS_URL            = BACKEND_API

NODE_ID           = os.getenv("NODE_ID", "CAM-04")
CAMERA_URL        = os.getenv("CAMERA_URL", 0)       # 0 = USB webcam, or IP cam URL
MODEL_PATH        = os.getenv("MODEL_PATH", "yolov8n.pt")
TOKEN             = os.getenv("EDGE_TOKEN", "PASTE_YOUR_GENERATED_TOKEN")
GEMINI_API_KEY    = os.getenv("GEMINI_API_KEY", "")

# Detection thresholds
YOLO_CONF_THRESHOLD   = 0.50   # Min confidence to show bounding box
ANOMALY_CONF_THRESHOLD = 0.75  # Min confidence to POST an alert
CROWD_TRIGGER_COUNT   = 5      # Person count that triggers Gemini analysis
FRAME_SKIP            = 2      # Run YOLO every N frames (1 = every frame)
GEMINI_COOLDOWN_SEC   = 3.0    # Min seconds between Gemini API calls
HEARTBEAT_INTERVAL    = 30     # Seconds between heartbeats

# Labels that ALWAYS trigger Gemini immediately (danger events)
HARD_TRIGGER_LABELS = {"weapon", "knife", "gun", "fire", "unauthorized", "missing-gear"}

# Labels that count toward anomaly alerts
ANOMALY_LABELS = {"person", "car", "truck", "unauthorized", "missing-gear"}

HEADERS = {"Authorization": f"Bearer {TOKEN}"}

# ─── Color Coding Map ──────────────────────────────────────────────────────────

LABEL_COLORS = {
    "person":        "#3B82F6",   # Blue
    "car":           "#22C55E",   # Green
    "truck":         "#22C55E",   # Green
    "unauthorized":  "#EF4444",   # Red
    "missing-gear":  "#EF4444",   # Red
    "weapon":        "#DC2626",   # Bright red
    "fire":          "#F97316",   # Orange
}

def get_color(label: str) -> str:
    return LABEL_COLORS.get(label.lower(), "#A855F7")

# ─── Initialize Models ─────────────────────────────────────────────────────────

print(f"[{NODE_ID}] Loading YOLOv8 model: {MODEL_PATH}")
model = YOLO(MODEL_PATH)
print(f"[{NODE_ID}] YOLO ready. Classes sample: {list(model.names.values())[:8]}")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel("gemini-1.5-flash")
    print(f"[{NODE_ID}] Gemini Vision ready.")
else:
    gemini_model = None
    print(f"[{NODE_ID}] ⚠ GEMINI_API_KEY not set — Gemini analysis disabled.")

# ─── Socket.IO Client ──────────────────────────────────────────────────────────

sio = socketio.Client(reconnection=True, reconnection_delay=2)

@sio.event
def connect():
    print(f"[{NODE_ID}] ✅ WebSocket connected to backend.")

@sio.event
def disconnect():
    print(f"[{NODE_ID}] ⚠ WebSocket disconnected.")

# ─── Thread-Safe State ─────────────────────────────────────────────────────────

gemini_lock = threading.Lock()
last_gemini_call = 0.0          # timestamp of last Gemini API call
gemini_queue: queue.Queue = queue.Queue(maxsize=1)   # Only 1 pending Gemini job at a time
latest_gemini_context = ""      # Last Gemini insight (shown in enriched alert)

# ─── Helpers ───────────────────────────────────────────────────────────────────

def frame_to_base64(frame) -> str:
    """Convert OpenCV frame to base64 JPEG string for Gemini."""
    img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    buf = BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return base64.b64encode(buf.getvalue()).decode()


def post_anomaly(label: str, conf: float, gemini_context: str = ""):
    """POST an anomaly alert to the Node.js REST API."""
    payload = {
        "type":      label.upper().replace(" ", "_"),
        "location":  NODE_ID,
        "confidence": round(float(conf) * 100, 2),
        "timestamp": time.time(),
        "gemini_context": gemini_context,
    }
    try:
        resp = requests.post(ANOMALY_ENDPOINT, json=payload, headers=HEADERS, timeout=5)
        status = "✅" if resp.status_code == 201 else f"⚠ {resp.status_code}"
        context_note = f" | Gemini: {gemini_context[:60]}..." if gemini_context else ""
        print(f"  [ALERT {status}] {label} conf={conf:.2%}{context_note}")
    except Exception as e:
        print(f"  [ALERT ERROR] {e}")


def send_heartbeat():
    """POST a heartbeat so the dashboard shows the node as online."""
    try:
        requests.post(HEARTBEAT_ENDPOINT, json={"node": NODE_ID}, headers=HEADERS, timeout=3)
        print(f"  [♥ HEARTBEAT] {NODE_ID} OK")
    except Exception as e:
        print(f"  [HEARTBEAT ERROR] {e}")


# ─── Gemini Worker Thread ──────────────────────────────────────────────────────

def gemini_worker():
    """
    Runs in a background thread.
    Picks frames from gemini_queue and calls Gemini Vision API.
    NEVER blocks the main YOLO inference loop.
    """
    global last_gemini_call, latest_gemini_context

    while True:
        try:
            job = gemini_queue.get(timeout=1)
        except queue.Empty:
            continue

        if job is None:
            break  # Shutdown signal

        frame, trigger_label, yolo_summary = job

        now = time.time()
        with gemini_lock:
            if now - last_gemini_call < GEMINI_COOLDOWN_SEC:
                # Cooldown not expired — skip this job
                gemini_queue.task_done()
                continue
            last_gemini_call = now

        try:
            print(f"  [GEMINI] 🔍 Analyzing frame (trigger: {trigger_label})...")
            b64 = frame_to_base64(frame)
            image_part = {"mime_type": "image/jpeg", "data": b64}

            prompt = (
                f"You are an AI security analyst. YOLO detected: {yolo_summary}. "
                f"Trigger: '{trigger_label}'. "
                "In 1-2 sentences: describe what's happening in this scene, "
                "assess the threat level (Low/Medium/High), and recommend an action. "
                "Be concise and professional."
            )

            response = gemini_model.generate_content([prompt, image_part])
            insight = response.text.strip()
            latest_gemini_context = insight
            print(f"  [GEMINI] 💡 {insight}")

            # Post an enriched anomaly alert with Gemini context
            post_anomaly(trigger_label, 0.94, gemini_context=insight)

        except Exception as e:
            print(f"  [GEMINI ERROR] {e}")

        gemini_queue.task_done()


# ─── Trigger Logic ────────────────────────────────────────────────────────────

def should_trigger_gemini(detections: list[dict]) -> tuple[bool, str]:
    """
    Decide if Gemini should be called based on current YOLO detections.

    Returns (should_trigger: bool, trigger_label: str)
    """
    person_count = sum(1 for d in detections if d["label"].lower() == "person")
    hard_triggers = [d for d in detections if d["label"].lower() in HARD_TRIGGER_LABELS]

    if hard_triggers:
        return True, hard_triggers[0]["label"]
    if person_count >= CROWD_TRIGGER_COUNT:
        return True, f"CROWD ({person_count} persons)"
    return False, ""


# ─── Main Inference Loop ──────────────────────────────────────────────────────

def run_inference():
    global latest_gemini_context

    # Start Gemini background thread (only if API key is set)
    if gemini_model:
        t = threading.Thread(target=gemini_worker, daemon=True)
        t.start()

    # Connect WebSocket
    try:
        sio.connect(WS_URL)
    except Exception as e:
        print(f"[{NODE_ID}] WS connect failed: {e} — continuing without WS.")

    # Open camera
    cam_source = CAMERA_URL if isinstance(CAMERA_URL, str) and CAMERA_URL.startswith("http") else int(CAMERA_URL)
    cap = cv2.VideoCapture(cam_source)
    if not cap.isOpened():
        print(f"[{NODE_ID}] Primary camera failed, falling back to webcam 0...")
        cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print(f"[{NODE_ID}] FATAL: No camera found."); return

    print(f"[{NODE_ID}] 🎥 Camera open. Starting YOLO+Gemini inference loop...")
    send_heartbeat()

    last_heartbeat = time.time()
    last_alert_time: dict[str, float] = {}  # label → last POST time
    ALERT_COOLDOWN = 10.0  # Min seconds between same alert type
    frame_count = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            time.sleep(0.05)
            continue

        frame_count += 1

        # ── Skip frames to reduce CPU/GPU load ──
        if frame_count % FRAME_SKIP != 0:
            time.sleep(0.01)
            continue

        frame_h, frame_w = frame.shape[:2]
        now = time.time()

        # ── YOLO Inference (every processed frame) ──
        results = model.predict(frame, conf=YOLO_CONF_THRESHOLD, verbose=False)

        detections: list[dict] = []
        boxes_payload = []

        for r in results:
            for box in r.boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                conf  = float(box.conf[0])
                label = model.names[int(box.cls[0])]

                x_pct = (x1 / frame_w) * 100
                y_pct = (y1 / frame_h) * 100
                w_pct = ((x2 - x1) / frame_w) * 100
                h_pct = ((y2 - y1) / frame_h) * 100

                det = {"label": label, "conf": conf,
                       "x": x_pct, "y": y_pct, "w": w_pct, "h": h_pct}
                detections.append(det)

                boxes_payload.append({
                    "id": f"{label}-{x_pct:.0f}-{y_pct:.0f}",
                    "label": label.upper(),
                    "confidence": conf,
                    "color": get_color(label),
                    "x": x_pct, "y": y_pct,
                    "width": w_pct, "height": h_pct,
                })

                # ── Alert: only for anomaly labels above threshold ──
                if label in ANOMALY_LABELS and conf >= ANOMALY_CONF_THRESHOLD:
                    last_for_label = last_alert_time.get(label, 0)
                    if now - last_for_label >= ALERT_COOLDOWN:
                        last_alert_time[label] = now
                        # Include latest Gemini context if available
                        post_anomaly(label, conf, gemini_context=latest_gemini_context)

        # ── Emit boxes to React dashboard via WebSocket ──
        if sio.connected and boxes_payload:
            try:
                sio.emit(f"boxes_{NODE_ID}", boxes_payload)
            except Exception:
                pass

        # ── Trigger Gemini (event-driven, non-blocking) ──
        if gemini_model:
            trigger, trigger_label = should_trigger_gemini(detections)
            if trigger:
                yolo_summary = ", ".join(
                    f"{d['label']}({d['conf']:.0%})" for d in detections[:6]
                )
                try:
                    # Non-blocking put (drop if already a job queued)
                    gemini_queue.put_nowait((frame.copy(), trigger_label, yolo_summary))
                except queue.Full:
                    pass  # Worker is busy — skip this frame

        # ── Heartbeat ──
        if now - last_heartbeat >= HEARTBEAT_INTERVAL:
            send_heartbeat()
            last_heartbeat = now

    cap.release()
    if sio.connected:
        sio.disconnect()
    if gemini_model:
        gemini_queue.put(None)  # Stop worker thread
    print(f"[{NODE_ID}] Shutdown complete.")


# ─── Entry Point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 65)
    print(f"  Vision AIoT Edge Node — {NODE_ID}")
    print(f"  Backend  : {BACKEND_API}")
    print(f"  Camera   : {CAMERA_URL}")
    print(f"  Model    : {MODEL_PATH}")
    print(f"  Gemini   : {'✅ Enabled' if gemini_model else '❌ Disabled (set GEMINI_API_KEY)'}")
    print(f"  Crowd thr: {CROWD_TRIGGER_COUNT} persons → Gemini trigger")
    print("=" * 65)
    run_inference()
