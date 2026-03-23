import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { needsCameraUserGesture } from "../utils/cameraEnv";

/**
 * Webcam preview for face attendance. Stops tracks on unmount.
 * On mobile, camera starts only after user taps "Start camera" (browser security).
 */
const FaceAttendanceCam = forwardRef(function FaceAttendanceCam({ onStreamError }, ref) {
  const videoRef = useRef(null);
  const onErrRef = useRef(onStreamError);
  onErrRef.current = onStreamError;

  const [tapToStart] = useState(() => needsCameraUserGesture());
  const [phase, setPhase] = useState(() => (needsCameraUserGesture() ? "idle" : "starting"));

  /** Parent ref must always point at the <video> node (useImperativeHandle([]) left it stuck on null). */
  const setVideoRef = useCallback(
    (el) => {
      videoRef.current = el;
      if (typeof ref === "function") {
        ref(el);
      } else if (ref) {
        ref.current = el;
      }
    },
    [ref],
  );

  const attachStream = useCallback(async (stream) => {
    const el = videoRef.current;
    if (!el) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }
    el.srcObject = stream;
    try {
      await el.play();
    } catch (playErr) {
      onErrRef.current?.(playErr);
    }
  }, []);

  /** Avoid infinite "Starting camera…" if getUserMedia never settles (some browsers hang on permission). */
  const withCameraTimeout = useCallback(async (getStream, ms = 20000) => {
    return Promise.race([
      getStream(),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Camera request timed out. Allow camera in the browser address bar, or try again.")),
          ms,
        ),
      ),
    ]);
  }, []);

  const startCamera = useCallback(async () => {
    setPhase("starting");
    let stream;
    try {
      const mobileLoose = needsCameraUserGesture();
      stream = await withCameraTimeout(() =>
        navigator.mediaDevices.getUserMedia({
          video: mobileLoose
            ? {
                facingMode: "user",
              }
            : {
                facingMode: "user",
                width: { ideal: 640, max: 960 },
                height: { ideal: 480, max: 540 },
                frameRate: { ideal: 24, max: 30 },
              },
          audio: false,
        }),
      );
      await attachStream(stream);
      setPhase("live");
    } catch (e) {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      setPhase(tapToStart ? "idle" : "error");
      onErrRef.current?.(e);
    }
  }, [attachStream, tapToStart, withCameraTimeout]);

  useEffect(() => {
    if (tapToStart) {
      return;
    }
    let stream;
    let cancelled = false;

    (async () => {
      try {
        stream = await withCameraTimeout(() =>
          navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "user",
              width: { ideal: 640, max: 960 },
              height: { ideal: 480, max: 540 },
              frameRate: { ideal: 24, max: 30 },
            },
            audio: false,
          }),
        );
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        await attachStream(stream);
        setPhase("live");
      } catch (e) {
        if (!cancelled) {
          setPhase("error");
          onErrRef.current?.(e);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      const el = videoRef.current;
      if (el) {
        el.srcObject = null;
      }
    };
  }, [tapToStart, attachStream, withCameraTimeout]);

  useEffect(() => {
    if (!tapToStart || phase !== "live") {
      return;
    }
    return () => {
      const el = videoRef.current;
      const s = el?.srcObject;
      if (s) {
        s.getTracks().forEach((t) => t.stop());
      }
      if (el) {
        el.srcObject = null;
      }
    };
  }, [tapToStart, phase]);

  return (
    <div className="relative h-full min-h-[12rem] w-full">
      <video
        ref={setVideoRef}
        className="h-full min-h-[12rem] w-full rounded-2xl bg-black object-cover"
        muted
        playsInline
        autoPlay
        aria-label="Camera preview"
      />
      {phase === "idle" && tapToStart && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl bg-slate-950/90 p-4 text-center">
          <p className="text-sm font-medium text-white">
            Tap the button to turn the camera on (required on phones for security).
          </p>
          <button
            type="button"
            onClick={() => {
              void startCamera();
            }}
            className="rounded-2xl bg-white px-6 py-3 text-sm font-bold text-slate-900 shadow-lg active:scale-[0.98]"
          >
            Start camera
          </button>
        </div>
      )}
      {phase === "starting" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50">
          <p className="text-sm font-semibold text-white">Starting camera…</p>
        </div>
      )}
      {phase === "error" && !tapToStart && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-slate-950/92 p-4 text-center">
          <p className="text-sm font-medium text-white">Camera could not be started. Allow access or check HTTPS.</p>
          <button
            type="button"
            onClick={() => {
              void startCamera();
            }}
            className="rounded-2xl bg-white px-6 py-3 text-sm font-bold text-slate-900 shadow-lg active:scale-[0.98]"
          >
            Retry camera
          </button>
        </div>
      )}
    </div>
  );
});

export default FaceAttendanceCam;
