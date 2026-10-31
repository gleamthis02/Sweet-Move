
import {
  FilesetResolver,
  PoseLandmarker,
} from "@mediapipe/tasks-vision";

let detector: PoseLandmarker | null = null;

export async function getPoseDetector() {
  if (detector) return detector;

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
  );

  detector = await PoseLandmarker.createFromOptions(
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

  return detector;
}
