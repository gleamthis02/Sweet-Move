
"use client";

import { useEffect, useRef, useState } from "react";
import { getPoseDetector } from "@/lib/pose/poseDetector";

export default function PoseCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState("กำลังเตรียมกล้อง...");
  const [detected, setDetected] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let frameId = 0;
    let running = true;

    async function start() {
      try {
        const detector = await getPoseDetector();

        if (!running || !videoRef.current) return;

        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 24, max: 30 },
          },
        });

        const video = videoRef.current;
        video.srcObject = stream;

        await video.play();

        setStatus("กำลังค้นหาร่างกาย...");

        let lastDetection = 0;

        function detect() {
          if (!running || !videoRef.current) return;

          const currentVideo = videoRef.current;
          const now = performance.now();

          // จำกัดการตรวจจับไว้ประมาณ 15 ครั้งต่อวินาที
          if (
            currentVideo.readyState >= 2 &&
            now - lastDetection >= 66
          ) {
            lastDetection = now;

            const result = detector.detectForVideo(
              currentVideo,
              now
            );

            const landmarks = result.landmarks?.[0];

            setDetected(Boolean(landmarks));

            if (landmarks) {
              // TODO: ส่ง landmarks ไป Pose Overlay
              // TODO: ส่ง landmarks ไป Exercise Logic
            }

            setStatus(
              landmarks
                ? "ตรวจพบร่างกายแล้ว"
                : "ไม่พบร่างกาย กรุณาปรับตำแหน่งกล้อง"
            );
          }

          frameId = requestAnimationFrame(detect);
        }

        detect();
      } catch (error) {
        console.error(error);
        setStatus("ไม่สามารถเปิดกล้องได้");
      }
    }

    start();

    return () => {
      running = false;
      cancelAnimationFrame(frameId);
      stream?.getTracks().forEach((track) => track.stop());
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
