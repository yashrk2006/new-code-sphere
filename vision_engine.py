import cv2
import asyncio
import socketio
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO

# Initialize FastAPI & Socket.io for Real-Time UI updates
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"])
app.mount("/socket.io", socketio.ASGIApp(sio))

# Load your AI Model
# For "Missing Safety Gear", you would load a custom trained weights file (e.g., 'ppe-model.pt')
# Here we use the standard YOLOv8 nano model as an out-of-the-box example.
print("Loading YOLOv8 Model...")
model = YOLO('yolov8n.pt') 

# Your exact IP Webcam stream URL
CAMERA_URL = "http://192.168.0.4:8080/video"
CAMERA_ID = "CAM-04"

async def process_video_stream():
    """Background task to read webcam, run inference, and push bounding boxes to React."""
    cap = cv2.VideoCapture(CAMERA_URL)
    
    if not cap.isOpened():
        print(f"Error: Cannot connect to camera at {CAMERA_URL}")
        # Emit a system error log to the React Terminal
        await sio.emit('system_log', {'msg': 'Failed to connect to IP Webcam.', 'type': 'error'}, namespace='/system')
        return

    await sio.emit('system_log', {'msg': f'Connected to {CAMERA_ID}. Starting inference...', 'type': 'info'}, namespace='/system')

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            await asyncio.sleep(0.1)
            continue

        # Get original frame dimensions to calculate percentages for React
        frame_height, frame_width = frame.shape[:2]

        # Run YOLOv8 Inference
        results = model.predict(frame, conf=0.5, verbose=False)
        
        boxes_payload = []
        for r in results:
            for box in r.boxes:
                # Get exact coordinates
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                conf = float(box.conf[0])
                cls = int(box.cls[0])
                label = model.names[cls]

                # Convert to percentages (0 to 100%) so they scale perfectly on any React window size
                x_pct = (x1 / frame_width) * 100
                y_pct = (y1 / frame_height) * 100
                w_pct = ((x2 - x1) / frame_width) * 100
                h_pct = ((y2 - y1) / frame_height) * 100

                # Determine color based on class (Customizable logic)
                color = '#EF4444' if label in ['person', 'car'] else '#EAB308' # Red or Yellow

                boxes_payload.append({
                    'id': f"{cls}-{x_pct:.1f}", # Unique ID for React key rendering
                    'label': label.upper(),
                    'confidence': conf,
                    'color': color,
                    'x': x_pct,
                    'y': y_pct,
                    'width': w_pct,
                    'height': h_pct
                })

                # If it's a critical detection, push an alert to the Zustand store via REST (simulated here)
                # In production, you would insert this into PostgreSQL here.

        # Push the live bounding boxes directly to the LiveInferenceFeed component via WebSockets
        await sio.emit(f'boxes_{CAMERA_ID}', boxes_payload, namespace='/inference')
        
        # Free up the event loop (targeting ~30 FPS)
        await asyncio.sleep(0.033) 

    cap.release()

@app.on_event("startup")
async def startup_event():
    # Start the video processing loop in the background when the server starts
    asyncio.create_task(process_video_stream())

if __name__ == "__main__":
    # Start the server on port 3000 (which VITE_BACKEND_URL expects)
    uvicorn.run("vision_engine:app", host="0.0.0.0", port=3000, reload=True)
