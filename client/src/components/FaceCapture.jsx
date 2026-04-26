import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import { useRef, useEffect, useState, useCallback } from "react";

export default function FaceCapture({ onCapture }) {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [capturedImage, setCapturedImage] = useState(null);
  const [status, setStatus] = useState("loading"); 
  // status: "loading" | "scanning" | "detected" | "captured" | "error"

  // 1. Load models on mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = "/models";
        // Check if models exist in public/models
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
        setStatus("scanning");
      } catch (err) {
        setStatus("error");
        console.error("Model load failed:", err);
      }
    };
    loadModels();
  }, []);

  // 2. Run detection loop every 300ms
  useEffect(() => {
    if (!modelsLoaded || capturedImage) return;
    const interval = setInterval(async () => {
      if (!webcamRef.current?.video) return;
      const video = webcamRef.current.video;
      if (video.readyState !== 4) return;

      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions()
        .withFaceDescriptors();

      // Draw bounding boxes on canvas overlay
      const canvas = canvasRef.current;
      if (!canvas) return;
      const displaySize = { width: video.videoWidth, height: video.videoHeight };
      faceapi.matchDimensions(canvas, displaySize);
      const resized = faceapi.resizeResults(detections, displaySize);
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (resized.length === 1) {
        const score = resized[0].detection.score;
        setConfidence(Math.round(score * 100));
        setFaceDetected(score >= 0.85);
        setStatus(score >= 0.85 ? "detected" : "scanning");

        // Draw box — green if confident, orange if partial
        const box = resized[0].detection.box;
        ctx.strokeStyle = score >= 0.85 ? "#00A86B" : "#FF6B00";
        ctx.lineWidth = 3;
        ctx.strokeRect(box.x, box.y, box.width, box.height);

        // Corner brackets (government-scan aesthetic)
        const bLen = 20;
        ctx.strokeStyle = score >= 0.85 ? "#00C880" : "#FF8C38";
        ctx.lineWidth = 4;
        // Top-left
        ctx.beginPath(); ctx.moveTo(box.x, box.y + bLen); 
        ctx.lineTo(box.x, box.y); ctx.lineTo(box.x + bLen, box.y); ctx.stroke();
        // Top-right
        ctx.beginPath(); ctx.moveTo(box.x + box.width - bLen, box.y); 
        ctx.lineTo(box.x + box.width, box.y); 
        ctx.lineTo(box.x + box.width, box.y + bLen); ctx.stroke();
        // Bottom-left
        ctx.beginPath(); ctx.moveTo(box.x, box.y + box.height - bLen); 
        ctx.lineTo(box.x, box.y + box.height); 
        ctx.lineTo(box.x + bLen, box.y + box.height); ctx.stroke();
        // Bottom-right
        ctx.beginPath(); 
        ctx.moveTo(box.x + box.width - bLen, box.y + box.height); 
        ctx.lineTo(box.x + box.width, box.y + box.height); 
        ctx.lineTo(box.x + box.width, box.y + box.height - bLen); ctx.stroke();

        // Draw face landmarks (68 points)
        faceapi.draw.drawFaceLandmarks(canvas, resized);

        // Confidence bar label
        ctx.fillStyle = score >= 0.85 ? "#00A86B" : "#FF6B00";
        ctx.font = "bold 13px monospace";
        ctx.fillText(`FACE ${Math.round(score * 100)}%`, box.x, box.y - 8);

        // Save last detection and descriptors
        if (score >= 0.85 && webcamRef.current) {
          const screenshot = webcamRef.current.getScreenshot();
          window._lastDetection = { image: screenshot, descriptor: Array.from(resized[0].descriptor) };
        }

      } else {
        setFaceDetected(false);
        setConfidence(0);
        setStatus("scanning");
        // Scanning line animation when no face
        const now = Date.now() % 2000;
        const y = (now / 2000) * canvas.height;
        ctx.strokeStyle = "rgba(255,107,0,0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }, 300);

    return () => clearInterval(interval);
  }, [modelsLoaded, capturedImage]);

  // 3. Capture photo
  const handleCapture = useCallback(() => {
    if (!faceDetected || !window._lastDetection) return;
    const { image, descriptor } = window._lastDetection;
    setCapturedImage(image);
    setStatus("captured");
    onCapture(image, descriptor); // Pass base64 and 128-float array up
  }, [faceDetected, onCapture]);

  // 4. Retake
  const handleRetake = () => {
    setCapturedImage(null);
    setStatus("scanning");
    setFaceDetected(false);
    setConfidence(0);
    window._lastDetection = null;
  };

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      {/* Status Banner */}
      <div className={`w-full text-center py-2 px-4 rounded-lg text-xs font-semibold tracking-wider font-mono
        ${status === "loading" ? "bg-ev-navy-800 text-ev-text-muted" : ""}
        ${status === "scanning" ? "bg-ev-saffron/10 text-ev-saffron border border-ev-saffron/30" : ""}
        ${status === "detected" ? "bg-ev-green/10 text-ev-green border border-ev-green/30" : ""}
        ${status === "captured" ? "bg-ev-gold/10 text-ev-gold border border-ev-gold/30" : ""}
        ${status === "error"   ? "bg-ev-red/10 text-ev-red border border-ev-red/30" : ""}
      `}>
        {status === "loading"  && "⏳ LOADING BIOMETRIC MODELS..."}
        {status === "scanning" && "🔍 SCANNING FOR FACE..."}
        {status === "detected" && `✅ FACE DETECTED (${confidence}%) - READY`}
        {status === "captured" && "📸 PHOTO SECURED"}
        {status === "error"    && "❌ MODUL LOAD ERROR"}
      </div>

      {/* Camera + Canvas overlay */}
      <div className="relative w-[320px] h-[240px] rounded-xl overflow-hidden border-2 border-ev-gold/30 shadow-[0_0_20px_rgba(212,175,55,0.1)]">
        {!capturedImage ? (
          <>
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              className="w-full h-full object-cover grayscale opacity-80"
              videoConstraints={{ width: 320, height: 240, facingMode: "user" }}
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full"
              style={{ pointerEvents: "none" }}
            />
          </>
        ) : (
          <div className="relative w-full h-full">
            <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-ev-green/20 flex items-center justify-center">
              <div className="bg-ev-green rounded-full p-4 animate-bounce">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
        )}
        
        {/* Scanner Labels */}
        <div className="absolute top-2 left-2 text-[8px] font-mono text-ev-saffron/70 uppercase">
          ECI Bio-Secure Scan
        </div>
        <div className="absolute bottom-2 right-2 text-[8px] font-mono text-ev-gold/70">
          NODE-ID: {Math.random().toString(16).substring(2, 10).toUpperCase()}
        </div>
      </div>

      {/* Confidence bar */}
      {!capturedImage && confidence > 0 && (
        <div className="w-[320px]">
          <div className="flex justify-between text-[10px] font-mono text-ev-text-muted mb-1">
            <span>ALIGNMENT</span><span>{confidence}%</span>
          </div>
          <div className="h-1 bg-ev-navy-800 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${confidence}%`,
                background: confidence >= 85 ? "#00A86B" : "#FF6B00"
              }}
            />
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3">
        {!capturedImage ? (
          <button
            onClick={handleCapture}
            disabled={!faceDetected}
            className={`px-8 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all
              ${faceDetected
                ? "bg-ev-green hover:bg-ev-green-light text-white shadow-lg shadow-ev-green/20"
                : "bg-ev-navy-800 text-ev-text-muted cursor-not-allowed"}`}
          >
            Capture Photo
          </button>
        ) : (
          <button onClick={handleRetake}
            className="px-8 py-2 rounded-lg font-bold text-xs uppercase tracking-widest bg-ev-navy-800 
                       text-ev-saffron border border-ev-saffron/30 hover:bg-ev-saffron/10">
            Retake
          </button>
        )}
      </div>
    </div>
  );
}
