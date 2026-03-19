import cv2

def list_cameras():
    print("Scanning for cameras...")
    for i in range(5):
        cap = cv2.VideoCapture(i, cv2.CAP_DSHOW)
        if cap.isOpened():
            ret, frame = cap.read()
            if ret:
                h, w = frame.shape[:2]
                # Check if frame is all black
                is_black = (frame == 0).all()
                print(f"Index {i}: {w}x{h}, ret={ret}, is_black={is_black}")
                cap.release()
            else:
                print(f"Index {i}: Opened but failed to read frame")
                cap.release()
        else:
            print(f"Index {i}: Not available")

if __name__ == "__main__":
    list_cameras()
