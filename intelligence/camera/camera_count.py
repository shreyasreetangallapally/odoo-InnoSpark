import cv2
from ultralytics import YOLO

model = YOLO("yolo11n.pt")


def start_camera():
    camera = cv2.VideoCapture(0)

    if not camera.isOpened():
        print("ERROR: Camera could not be opened")
        return

    print("Warehouse camera started.")
    print("Press Q to close.")

    while True:
        success, frame = camera.read()

        if not success:
            print("ERROR: Could not read camera frame")
            break

        # YOLO detection
        results = model(frame)

        # Draw bounding boxes
        annotated_frame = results[0].plot(
             colors=[(144, 238, 144)]
        )

        # Count detected classes
        object_counts = {}
        
        for box in results[0].boxes:
            class_id = int(box.cls[0])
            class_name = model.names[class_id]

            object_counts[class_name] = object_counts.get(class_name, 0) + 1

        # Separate people from other objects
        people_count = object_counts.get("person", 0)
        total_objects = len(results[0].boxes)
        other_objects = total_objects - people_count

        # Background panel
        cv2.rectangle(
            annotated_frame,
            (10, 10),
            (300, 180),
            (0, 0, 0),
            -1
        )

        # Title
        cv2.putText(
            annotated_frame,
            "WAREHOUSE INTELLIGENCE",
            (20, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.65,
            (0, 255, 0),
            2
        )

        # People count
        cv2.putText(
            annotated_frame,
            f"People: {people_count}",
            (20, 75),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 255, 255),
            2
        )

        # Object count
        cv2.putText(
            annotated_frame,
            f"Objects: {other_objects}",
            (20, 110),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 255, 255),
            2
        )

        # Status
        cv2.putText(
            annotated_frame,
            "STATUS: MONITORING",
            (20, 150),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.55,
            (0, 255, 0),
            2
        )

        cv2.imshow("Warehouse YOLO Camera", annotated_frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    camera.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    start_camera()