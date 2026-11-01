(()=>{"use strict";module.exports = [
"[project]/src/components/pose/PoseCamera.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>PoseCamera
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$pose$2f$poseDetector$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/pose/poseDetector.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
function PoseCamera() {
    const videoRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [status, setStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("กำลังเตรียมระบบ...");
    const [detected, setDetected] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        let stream = null;
        let frameId = 0;
        let running = true;
        async function start() {
            // STEP 1: Load MediaPipe
            let detector;
            try {
                setStatus("กำลังโหลด MediaPipe...");
                detector = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$pose$2f$poseDetector$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getPoseDetector"])();
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
                        width: {
                            ideal: 640
                        },
                        height: {
                            ideal: 480
                        },
                        frameRate: {
                            ideal: 24,
                            max: 30
                        }
                    }
                });
                // Component อาจถูก Unmount ระหว่างรอ Permission
                if (!running) {
                    stream.getTracks().forEach((track)=>track.stop());
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
                            setStatus(hasPose ? "ตรวจพบร่างกายแล้ว" : "ไม่พบร่างกาย กรุณาปรับตำแหน่งกล้อง");
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
        return ()=>{
            running = false;
            cancelAnimationFrame(frameId);
            stream?.getTracks().forEach((track)=>track.stop());
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        };
    }, []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                children: status
            }, void 0, false, {
                fileName: "[project]/src/components/pose/PoseCamera.tsx",
                lineNumber: 136,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("video", {
                ref: videoRef,
                autoPlay: true,
                playsInline: true,
                muted: true,
                style: {
                    width: "100%",
                    transform: "scaleX(-1)"
                }
            }, void 0, false, {
                fileName: "[project]/src/components/pose/PoseCamera.tsx",
                lineNumber: 138,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                children: detected ? "Pose detected" : "Waiting..."
            }, void 0, false, {
                fileName: "[project]/src/components/pose/PoseCamera.tsx",
                lineNumber: 149,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/pose/PoseCamera.tsx",
        lineNumber: 135,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/lib/pose/poseDetector.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getPoseDetector",
    ()=>getPoseDetector
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mediapipe$2f$tasks$2d$vision$2f$vision_bundle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@mediapipe/tasks-vision/vision_bundle.mjs [app-ssr] (ecmascript)");
;
let detector = null;
let detectorPromise = null;
async function getPoseDetector() {
    if (detector) return detector;
    // ป้องกันการสร้าง Detector ซ้ำระหว่างที่กำลังโหลด Model
    if (!detectorPromise) {
        detectorPromise = (async ()=>{
            const vision = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mediapipe$2f$tasks$2d$vision$2f$vision_bundle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FilesetResolver"].forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.0/wasm");
            const instance = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mediapipe$2f$tasks$2d$vision$2f$vision_bundle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PoseLandmarker"].createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: "/models/pose_landmarker_lite.task"
                },
                runningMode: "VIDEO",
                numPoses: 1,
                minPoseDetectionConfidence: 0.5,
                minPosePresenceConfidence: 0.5,
                minTrackingConfidence: 0.5
            });
            detector = instance;
            return instance;
        })().catch((error)=>{
            detectorPromise = null;
            throw error;
        });
    }
    return detectorPromise;
}
}),
];})()

//# sourceMappingURL=src_0n8nu220j346i._.js.map