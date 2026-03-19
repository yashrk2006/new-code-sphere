"""
Vision Engine — YOLO-Only Smart Detection Engine
Architecture:
  Camera → Frame Queue → YOLO (~30 FPS) → Smart Scene Classifier
                              ↓
                     Anomaly Labels (weapon/crowd/vehicle/damage)
                              ↓
                     Bounding Boxes → Node.js Backend (REST + WebSocket)
"""

import cv2
import requests
import time
import threading
import base64
import queue
import os
import logging
from io import BytesIO
from datetime import datetime
from ultralytics import YOLO
import socketio
from PIL import Image
from dotenv import load_dotenv
from flask import Flask, Response

load_dotenv()

# ─── Configuration ──────────────────────────────────────────────────────────────
BACKEND_API        = os.getenv("BACKEND_API", "http://localhost:4007")
ANOMALY_ENDPOINT   = f"{BACKEND_API}/api/alerts"
HEARTBEAT_ENDPOINT = f"{BACKEND_API}/api/edge/heartbeat"
WS_URL             = BACKEND_API

NODE_ID      = os.getenv("NODE_ID", "CAM-04")
CAMERA_URL   = os.getenv("CAMERA_URL", "0")
MODEL_PATH   = os.getenv("MODEL_PATH", "yolov8n.pt")
TOKEN        = os.getenv("EDGE_TOKEN", "PASTE_YOUR_GENERATED_TOKEN")

# Detection thresholds
YOLO_CONF_THRESHOLD    = 0.55   # Raise = fewer false positives
ANOMALY_CONF_THRESHOLD = 0.50
CROWD_TRIGGER_COUNT    = 4       # 4 people → crowd alert
HEARTBEAT_INTERVAL     = 30

# --- YOLO COCO class → our security label mapping ---
# Standard COCO labels that map to security-relevant categories
WEAPON_LABELS      = {"knife", "scissors", "baseball bat"}
VEHICLE_LABELS     = {"car", "truck", "bus", "motorcycle", "bicycle"}
PERSON_LABEL       = "person"

# COCO class IDs we care about — filters out couch, TV, chair, etc.
# 0=person, 2=car, 3=motorcycle, 5=bus, 7=truck, 15=cat, 16=dog, 43=knife, 67=cell phone
ALLOWED_CLASS_IDS  = {0, 2, 3, 5, 7, 15, 16, 43, 35, 39, 41}  # person, vehicles, animals, knife, scissors, baseball bat
ANIMAL_LABELS      = {"dog", "cat", "horse", "cow", "bear"}  # aggressive animals
DAMAGE_PROXY       = {"fire hydrant", "stop sign", "traffic light", "parking meter"}  # infrastructure

# Labels that trigger immediate HIGH-SEVERITY alerts
HARD_TRIGGER_LABELS = WEAPON_LABELS | {"fire", "weapon", "gun"}

# Labels that trigger standard alerts
ANOMALY_LABELS = {PERSON_LABEL} | VEHICLE_LABELS | WEAPON_LABELS

# Alert severity per label
def get_severity(label: str, count: int = 1) -> str:
    label_lower = label.lower()
    if label_lower in WEAPON_LABELS or label_lower in {"fire", "gun", "weapon"}:
        return "Critical"
    if label_lower == PERSON_LABEL and count >= CROWD_TRIGGER_COUNT:
        return "Critical"
    if label_lower in VEHICLE_LABELS:
        return "Medium"
    return "Low"

# Color per label (for bounding boxes)
LABEL_COLORS = {
    "person":         "#3B82F6",   # blue
    "knife":          "#DC2626",   # bright red — weapon
    "scissors":       "#DC2626",   # bright red — weapon
    "baseball bat":   "#DC2626",   # bright red — weapon
    "car":            "#22C55E",   # green — vehicle
    "truck":          "#22C55E",   # green — vehicle
    "bus":            "#22C55E",   # green — vehicle
    "motorcycle":     "#F59E0B",   # amber — vehicle
    "bicycle":        "#F59E0B",   # amber — vehicle
    "fire hydrant":   "#EF4444",   # red — property
    "stop sign":      "#EF4444",   # red — property
    "traffic light":  "#A855F7",   # purple
    "dog":            "#F97316",   # orange
    "bear":           "#DC2626",   # red — dangerous
}

def get_color(label: str) -> str:
    return LABEL_COLORS.get(label.lower(), "#A855F7")

# ─── Smart Scene Classifier (replaces Gemini) ────────────────────────────────
def classify_scene(detections: list) -> str:
    """Build a human-readable scene description purely from YOLO detections."""
    if not detections:
        return "No activity detected."

    # Count by type
    persons   = [d for d in detections if d["label"].lower() == "person"]
    weapons   = [d for d in detections if d["label"].lower() in WEAPON_LABELS]
    vehicles  = [d for d in detections if d["label"].lower() in VEHICLE_LABELS]
    animals   = [d for d in detections if d["label"].lower() in ANIMAL_LABELS]
    infra     = [d for d in detections if d["label"].lower() in DAMAGE_PROXY]

    parts = []

    # Scene rating
    if weapons:
        weapon_names = ", ".join(set(d["label"] for d in weapons))
        parts.append(f"⚠️ CRITICAL: {len(weapons)} weapon(s) detected ({weapon_names})")

    if persons:
        count = len(persons)
        if count >= 8:
            parts.append(f"🚨 Large crowd: {count} persons detected — mass gathering risk")
        elif count >= CROWD_TRIGGER_COUNT:
            parts.append(f"⚠️ Crowd gathering: {count} persons detected")
        else:
            parts.append(f"{count} person(s) in view")

    if vehicles:
        veh_names = ", ".join(set(d["label"] for d in vehicles))
        parts.append(f"🚗 {len(vehicles)} vehicle(s): {veh_names}")

    if animals:
        parts.append(f"🐾 {len(animals)} animal(s) detected — potential hazard")

    if infra and len(infra) >= 2:
        parts.append(f"🔧 Infrastructure items flagged: {', '.join(set(d['label'] for d in infra))}")

    # Cross-correlate for criminal scenario
    if weapons and persons:
        parts.insert(0, "🚔 ARMED PERSON SCENARIO — Immediate response required")
    elif persons and len(persons) >= CROWD_TRIGGER_COUNT and not vehicles:
        parts.append("Pattern: Pedestrian gathering — monitor for escalation")
    elif vehicles and not persons:
        parts.append("Pattern: Vehicle present, area appears clear of people")

    return " | ".join(parts) if parts else "Normal activity."

# ─── Alert label mapping for the backend ─────────────────────────────────────
def get_alert_type(label: str, detections: list) -> str:
    """Map YOLO label to a backend alert type string."""
    label_lower = label.lower()
    if label_lower in WEAPON_LABELS:
        return "WEAPON_DETECTED"
    if label_lower == "person":
        persons = [d for d in detections if d["label"].lower() == "person"]
        if len(persons) >= CROWD_TRIGGER_COUNT:
            return "CROWD_DETECTED"
        return "SUSPICIOUS_BEHAVIOR"
    if label_lower in VEHICLE_LABELS:
        return "UNAUTHORIZED_VEHICLE"
    if label_lower in ANIMAL_LABELS:
        return "HAZARD_ANIMAL"
    if label_lower in DAMAGE_PROXY:
        return "INFRASTRUCTURE_DAMAGE"
    return label.upper().replace(" ", "_")

# ─── Initialize YOLO model ───────────────────────────────────────────────────
print(f"[{NODE_ID}] Loading YOLOv8 model: {MODEL_PATH}")
model = YOLO(MODEL_PATH)
print(f"[{NODE_ID}] Gemini disabled — using YOLO smart scene classifier.")

# ─── WebSocket Client ─────────────────────────────────────────────────────────
sio = socketio.Client(reconnection=True, reconnection_delay=2)

@sio.event
def connect():
    print(f"[{NODE_ID}] ✅ WebSocket connected.")

@sio.event
def disconnect():
    print(f"[{NODE_ID}] ⚠ WebSocket disconnected.")

# ─── State & Flask stream ─────────────────────────────────────────────────────
ALERT_COOLDOWN  = 12  # seconds between repeated alerts for same label
last_alert_time = {}

stream_app   = Flask(__name__)
output_frame = None
output_lock  = threading.Lock()
latest_scene = ""

def post_anomaly(label: str, conf: float, scene_context: str, detections: list):
    global last_alert_time
    now = time.time()
    if label in last_alert_time and now - last_alert_time[label] < ALERT_COOLDOWN:
        return

    last_alert_time[label] = now
    severity     = get_severity(label, sum(1 for d in detections if d["label"].lower() == "person"))
    alert_type   = get_alert_type(label, detections)

    payload = {
        "type":           alert_type,
        "location":       NODE_ID,
        "confidence":     round(float(conf) * 100, 2),
        "timestamp":      time.time(),
        "severity":       severity,
        "scene_context":  scene_context,
        "camera_id":      NODE_ID,
    }
    try:
        requests.post(ANOMALY_ENDPOINT, json=payload, timeout=5)
        print(f"  [ALERT🚨] {alert_type} | {severity} | conf={conf:.0%} | {scene_context[:60]}")
    except Exception as e:
        print(f"  [ALERT ERROR] {e}")

def send_heartbeat():
    try:
        requests.post(HEARTBEAT_ENDPOINT, json={"node": NODE_ID}, timeout=3)
    except Exception:
        pass

# ─── MJPEG Streaming ─────────────────────────────────────────────────────────
def generate_frames():
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

        yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + bytearray(encodedImage) + b'\r\n')
        time.sleep(0.033)

@stream_app.route("/video_feed")
def video_feed():
    response = Response(generate_frames(), mimetype="multipart/x-mixed-replace; boundary=frame")
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response

def start_stream_server():
    stream_app.run(host="0.0.0.0", port=5001, threaded=True, use_reloader=False)

# ─── Main Inference Loop ──────────────────────────────────────────────────────
def run_inference():
    global output_frame, output_lock, latest_scene

    threading.Thread(target=start_stream_server, daemon=True).start()

    try:
        sio.connect(WS_URL)
    except Exception:
        pass

    source = int(CAMERA_URL) if CAMERA_URL.isdigit() else CAMERA_URL

    if isinstance(source, int) and os.name == 'nt':
        cap = cv2.VideoCapture(source, cv2.CAP_DSHOW)
    else:
        cap = cv2.VideoCapture(source)

    if cap.isOpened():
        w = cap.get(cv2.CAP_PROP_FRAME_WIDTH)
        h = cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
        print(f"  [{NODE_ID}] ✅ VideoCapture opened. Source: {source}, Resolution: {w}x{h}")
    else:
        print(f"  [{NODE_ID}] ❌ Failed to open VideoCapture. Source: {source}")

    last_heartbeat = 0
    frame_count    = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            # Loop video for demo
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            ret, frame = cap.read()
            if not ret:
                print("  [CAM] ❌ Failed to read frame. Retrying...")
                time.sleep(1)
                continue

        frame_count += 1
        h, w = frame.shape[:2]

        # ── YOLO Inference ──────────────────────────────────────────────────
        results     = model.predict(frame, conf=YOLO_CONF_THRESHOLD, iou=0.45, verbose=False)
        detections  = []
        boxes_payload = []

        for result in results:
            for box in result.boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                conf  = float(box.conf[0])
                label = model.names[int(box.cls[0])]

                # Skip classes we don't care about
                cls_id = int(box.cls[0])
                if cls_id not in ALLOWED_CLASS_IDS:
                    continue

                det = {
                    "label": label, "conf": conf,
                    "x": x1 / w * 100, "y": y1 / h * 100,
                    "w": (x2 - x1) / w * 100, "h": (y2 - y1) / h * 100
                }
                detections.append(det)

                # Draw bounding box on frame
                color = tuple(int(get_color(label).lstrip('#')[i:i+2], 16) for i in (0, 2, 4))[::-1]
                cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), color, 2)
                cv2.putText(frame, f"{label} {conf:.0%}", (int(x1), int(y1) - 5),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)

                boxes_payload.append({
                    "id":         f"{label}-{int(time.time()*1000)}",
                    "label":      label.upper(),
                    "confidence": conf,
                    "color":      get_color(label),
                    "x":          x1 / w * 100,
                    "y":          y1 / h * 100,
                    "width":      (x2 - x1) / w * 100,
                    "height":     (y2 - y1) / h * 100,
                })

        # ── Smart Scene Classifier (Gemini replacement) ─────────────────────
        if detections:
            latest_scene = classify_scene(detections)
        else:
            latest_scene = "No activity detected."

        # ── Trigger Alerts ──────────────────────────────────────────────────
        for det in detections:
            label_l = det["label"].lower()
            if label_l in WEAPON_LABELS:
                post_anomaly(label_l, det["conf"], latest_scene, detections)
            elif label_l == PERSON_LABEL and det["conf"] >= ANOMALY_CONF_THRESHOLD:
                person_count = sum(1 for d in detections if d["label"].lower() == PERSON_LABEL)
                if person_count >= CROWD_TRIGGER_COUNT:
                    post_anomaly(PERSON_LABEL, det["conf"], latest_scene, detections)
                    break  # Only one crowd alert per frame

        # ── HUD Overlay ─────────────────────────────────────────────────────
        # Top bar
        cv2.rectangle(frame, (0, 0), (w, 36), (0, 0, 0), -1)
        cv2.putText(frame, f"[{NODE_ID}] LIVE | {datetime.now().strftime('%H:%M:%S')} | "
                           f"Detections: {len(detections)}",
                    (8, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 1)

        # Bottom bar with scene summary
        scene_short = latest_scene[:90]
        cv2.rectangle(frame, (0, h - 32), (w, h), (0, 0, 0), -1)
        cv2.putText(frame, scene_short, (8, h - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1)

        with output_lock:
            output_frame = frame.copy()

        # ── Send boxes to backend ────────────────────────────────────────────
        if boxes_payload:
            try:
                res = requests.post(
                    f"{BACKEND_API}/api/edge/{NODE_ID}/boxes",
                    json={"boxes": boxes_payload},
                    timeout=2
                )
                if res.status_code != 200:
                    print(f"[EDGE] Backend returned {res.status_code}")
            except Exception as e:
                print(f"[EDGE] Error sending boxes: {e}")

        # ── Heartbeat ─────────────────────────────────────────────────────────
        if time.time() - last_heartbeat > HEARTBEAT_INTERVAL:
            send_heartbeat()
            last_heartbeat = time.time()

        time.sleep(0.033)  # ~30 FPS

    cap.release()

if __name__ == "__main__":
    run_inference()
