"use client";

import { useEffect, useRef, useState } from "react";
import { getPoseDetector } from "@/lib/pose/poseDetector";

export default function PoseCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [status, setStatus] = useState("กำลังเตรียมระบบ...");
  const [detected, setDetected] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let frameId = 0;
    let running = true;

    async function start() {
      // STEP 1: Load MediaPipe
      let detector: Awaited<ReturnType<typeof getPoseDetector>>;

      try {
        setStatus("กำลังโหลด MediaPipe...");
        detector = await getPoseDetector();
      } catch (error) {
        console.error("MediaPipe Initialization Error:", error);
        setStatus("โหลด MediaPipe ไม่สำเร็จ");
        return;
      }

      if (!running || !videoRef.current) return;

      // STEP 2: Open Camera
      try {
        setStatus("กำลังเปิดกล้อง...");

        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 24, max: 30 },
          },
        });

        // Component อาจถูก Unmount ระหว่างรอ Permission
        if (!running) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        const video = videoRef.current;

        if (!video) return;

        video.srcObject = stream;
        await video.play();

        if (!running) return;

        setStatus("กำลังค้นหาร่างกาย...");

        // STEP 3: Pose Detection Loop
        let lastDetection = 0;

        function detect() {
          if (!running) return;

          const currentVideo = videoRef.current;

          if (!currentVideo) return;

          const now = performance.now();

          if (currentVideo.readyState >= 2 && now - lastDetection >= 66) {
            lastDetection = now;

            try {
              const result = detector.detectForVideo(currentVideo, now);
              console.log("Detection executed successfully");

              const landmarks = result.landmarks?.[0];

              console.log("Landmarks:", landmarks?.length ?? 0);

              const hasPose = !!landmarks;

              setDetected(hasPose);

              if (landmarks) {
                // TODO: ส่ง landmarks ไป Pose Overlay
                // TODO: ส่ง landmarks ไป Exercise Logic
              }

              setStatus(
                hasPose
                  ? "ตรวจพบร่างกายแล้ว"
                  : "ไม่พบร่างกาย กรุณาปรับตำแหน่งกล้อง",
              );
            } catch (error) {
              console.error("ACTUAL DETECTION EXCEPTION:", error);

              setDetected(false);
              setStatus("เกิดข้อผิดพลาดในการตรวจจับ");
            }
          }

          frameId = requestAnimationFrame(detect);
        }

        detect();
      } catch (error) {
        console.error("Camera Initialization Error:", error);
        setStatus("ไม่สามารถเปิดกล้องได้");
      }
    }

    start();

    // STEP 4: Cleanup
    return () => {
      running = false;

      cancelAnimationFrame(frameId);

      stream?.getTracks().forEach((track) => track.stop());

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  return (
    <section>
      <p>{status}</p>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: "100%",
          transform: "scaleX(-1)",
        }}
      />

      <p>{detected ? "Pose detected" : "Waiting..."}</p>
    </section>
  );
}
