(()=>{"use strict";(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/components/pose/PoseCamera.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>PoseCamera
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$pose$2f$poseDetector$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/pose/poseDetector.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
function PoseCamera() {
    _s();
    const videoRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [status, setStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("กำลังเตรียมกล้อง...");
    const [detected, setDetected] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "PoseCamera.useEffect": ()=>{
            let stream = null;
            let frameId = 0;
            let running = true;
            async function start() {
                try {
                    const detector = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$pose$2f$poseDetector$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getPoseDetector"])();
                    if (!running || !videoRef.current) return;
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
                        if (currentVideo.readyState >= 2 && now - lastDetection >= 66) {
                            lastDetection = now;
                            const result = detector.detectForVideo(currentVideo, now);
                            const landmarks = result.landmarks?.[0];
                            setDetected(Boolean(landmarks));
                            if (landmarks) {
                            // TODO: ส่ง landmarks ไป Pose Overlay
                            // TODO: ส่ง landmarks ไป Exercise Logic
                            }
                            setStatus(landmarks ? "ตรวจพบร่างกายแล้ว" : "ไม่พบร่างกาย กรุณาปรับตำแหน่งกล้อง");
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
            return ({
                "PoseCamera.useEffect": ()=>{
                    running = false;
                    cancelAnimationFrame(frameId);
                    stream?.getTracks().forEach({
                        "PoseCamera.useEffect": (track)=>track.stop()
                    }["PoseCamera.useEffect"]);
                }
            })["PoseCamera.useEffect"];
        }
    }["PoseCamera.useEffect"], []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                children: status
            }, void 0, false, {
                fileName: "[project]/src/components/pose/PoseCamera.tsx",
                lineNumber: 97,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("video", {
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
                lineNumber: 99,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                children: detected ? "Pose detected" : "Waiting..."
            }, void 0, false, {
                fileName: "[project]/src/components/pose/PoseCamera.tsx",
                lineNumber: 110,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/pose/PoseCamera.tsx",
        lineNumber: 96,
        columnNumber: 5
    }, this);
}
_s(PoseCamera, "vHqXwBjUpVHh+bodYW01/cG3egQ=");
_c = PoseCamera;
var _c;
__turbopack_context__.k.register(_c, "PoseCamera");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/pose/poseDetector.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getPoseDetector",
    ()=>getPoseDetector
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mediapipe$2f$tasks$2d$vision$2f$vision_bundle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@mediapipe/tasks-vision/vision_bundle.mjs [app-client] (ecmascript)");
;
let detector = null;
async function getPoseDetector() {
    if (detector) return detector;
    const vision = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mediapipe$2f$tasks$2d$vision$2f$vision_bundle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FilesetResolver"].forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm");
    detector = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mediapipe$2f$tasks$2d$vision$2f$vision_bundle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PoseLandmarker"].createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: "/models/pose_landmarker_lite.task"
        },
        runningMode: "VIDEO",
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5
    });
    return detector;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);})()

//# sourceMappingURL=src_1h9gdzfp3l7_y._.js.map