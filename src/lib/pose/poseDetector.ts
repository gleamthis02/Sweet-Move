
import {
  FilesetResolver,
  PoseLandmarker,
} from "@mediapipe/tasks-vision";

let detector: PoseLandmarker | null = null;
let detectorPromise: Promise<PoseLandmarker> | null = null;

export async function getPoseDetector(): Promise<PoseLandmarker> {
  if (detector) return detector;

  // ป้องกันการสร้าง Detector ซ้ำระหว่างที่กำลังโหลด Model
  if (!detectorPromise) {
    detectorPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.0/wasm"
      );

      const instance = await PoseLandmarker.createFromOptions(
        vision,
        {
          baseOptions: {
            modelAssetPath: "/models/pose_landmarker_lite.task",
          },
          runningMode: "VIDEO",
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        }
      );

      detector = instance;
      return instance;
    })().catch((error) => {
      detectorPromise = null;
      throw error;
    });
  }

  return detectorPromise;
}
