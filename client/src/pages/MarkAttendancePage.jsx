import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import DashboardLayout from "../layouts/DashboardLayout";
import FaceAttendanceCam from "../components/FaceAttendanceCam";
import { FACE_MATCH_DISTANCE_THRESHOLD } from "../constants/faceAttendance";
import { loadFaceModels, faceapi } from "../utils/faceApiModels";
import { fetchAttendance, markFaceAttendance } from "../services/libraryService";
import { useAuth } from "../context/useAuth";
import { getTodayDateString } from "../utils/format";
import { waitForVideoReady } from "../utils/videoReady";
import { useTinyFaceDetectorOptions } from "../hooks/useTinyFaceDetectorOptions";
import { resolvePublicAssetUrl } from "../utils/assetUrl";

/** Yield so the browser can paint / process camera frames before heavy TF work. */
const yieldToMain = () =>
  new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });

const MarkAttendancePage = () => {
  const { user, refreshUser } = useAuth();
  const videoRef = useRef(null);
  const tinyOptions = useTinyFaceDetectorOptions();
  const [modelsReady, setModelsReady] = useState(false);
  const [refDescriptor, setRefDescriptor] = useState(null);
  const [refStatus, setRefStatus] = useState("loading");
  const [submitting, setSubmitting] = useState(false);
  const [camError, setCamError] = useState(null);
  const [todayFaceRecord, setTodayFaceRecord] = useState(null);

  const loadTodayFace = useCallback(async () => {
    try {
      const res = await fetchAttendance();
      const today = getTodayDateString();
      const f = (res.faceAttendance || []).find((x) => x.date === today);
      setTodayFaceRecord(f || null);
    } catch {
      setTodayFaceRecord(null);
    }
  }, []);

  useEffect(() => {
    loadTodayFace();
  }, [loadTodayFace, user?._id]);

  useEffect(() => {
    let cancelled = false;
    const run = () => {
      (async () => {
        try {
          await loadFaceModels();
          if (!cancelled) {
            setModelsReady(true);
          }
        } catch (e) {
          if (!cancelled) {
            toast.error("Failed to load face recognition models: " + String(e?.message || e));
          }
        }
      })();
    };
    const id =
      typeof requestIdleCallback !== "undefined"
        ? requestIdleCallback(run, { timeout: 2500 })
        : setTimeout(run, 1);
    return () => {
      cancelled = true;
      if (typeof cancelIdleCallback !== "undefined") {
        cancelIdleCallback(id);
      } else {
        clearTimeout(id);
      }
    };
  }, []);

  const photoPath = user?.profileImage || user?.profilePhoto || "";

  useEffect(() => {
    if (!modelsReady || !photoPath) {
      if (modelsReady && !photoPath) {
        setRefStatus("no-photo");
      }
      return;
    }

    let cancelled = false;
    (async () => {
      setRefStatus("loading");
      try {
        await yieldToMain();
        const url = resolvePublicAssetUrl(photoPath);
        const img = await faceapi.fetchImage(url);
        const det = await faceapi.detectSingleFace(img, tinyOptions).withFaceLandmarks().withFaceDescriptor();
        if (cancelled) {
          return;
        }
        if (!det) {
          setRefStatus("no-face-in-photo");
          return;
        }
        setRefDescriptor(det.descriptor);
        setRefStatus("ready");
      } catch (e) {
        if (!cancelled) {
          setRefStatus("photo-error");
          console.error(e);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [modelsReady, photoPath, tinyOptions]);

  const handleStreamError = useCallback((err) => {
    setCamError(String(err?.message || err || "Camera unavailable"));
    toast.error("Camera access denied or unavailable.");
  }, []);

  const handleCapture = async () => {
    if (!refDescriptor) {
      toast.error("Your profile photo is not ready for matching. Upload a clear face photo first.");
      return;
    }
    const video = videoRef.current;
    if (!video) {
      toast.error("Camera is not ready yet. Tap “Start camera” if you see it.");
      return;
    }
    try {
      await waitForVideoReady(video);
    } catch {
      toast.error("Camera preview is not ready yet. Wait for the live video, then try again.");
      return;
    }

    setSubmitting(true);
    try {
      await yieldToMain();
      const live = await faceapi.detectSingleFace(video, tinyOptions).withFaceLandmarks().withFaceDescriptor();
      if (!live) {
        toast.error("Face not detected. Look at the camera and try again.");
        return;
      }

      const distance = faceapi.euclideanDistance(refDescriptor, live.descriptor);
      if (distance >= FACE_MATCH_DISTANCE_THRESHOLD) {
        toast.error("Face not matched");
        return;
      }

      const res = await markFaceAttendance();
      toast.success(res?.message || "Saved.");
      await refreshUser?.();
      await loadTodayFace();
    } catch (e) {
      toast.error(String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const faceSessionComplete = Boolean(todayFaceRecord?.checkOutTime);
  const faceNeedsCheckOut = Boolean(todayFaceRecord && !todayFaceRecord.checkOutTime);

  let captureLabel = "Capture & Face check-in";
  if (faceSessionComplete) {
    captureLabel = "Face session complete today";
  } else if (faceNeedsCheckOut) {
    captureLabel = "Capture & Face check-out";
  }

  return (
    <DashboardLayout
      title="Mark Attendance"
      subtitle="First successful scan = face check-in. Second scan same day = face check-out. Same flow idea as seat check-in / check-out."
    >
      <div className="font-display mx-auto w-full max-w-3xl min-w-0 space-y-6 sm:space-y-8">
        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-4 shadow-xl shadow-slate-200/50 max-lg:border-indigo-100/45 max-lg:bg-gradient-to-b max-lg:from-white max-lg:to-slate-50/80 max-lg:shadow-lg sm:p-6 md:p-8 lg:border-slate-200/80 lg:bg-white lg:from-white lg:to-white lg:shadow-xl">
          <h2 className="text-lg font-bold text-slate-900">Webcam</h2>
          <p className="mt-1 text-sm text-slate-500">
            Grant camera permission. On a phone, tap <span className="font-semibold text-slate-700">Start camera</span> first, then capture when the preview is live. Lighting should be even; remove hats or masks for a reliable match.
          </p>

          <div className="relative mt-6 aspect-video w-full min-h-[12rem] overflow-hidden rounded-2xl bg-slate-900 ring-1 ring-slate-200">
            <FaceAttendanceCam ref={videoRef} onStreamError={handleStreamError} />
            {!modelsReady && (
              <div className="pointer-events-none absolute bottom-3 left-3 right-3 rounded-xl bg-black/55 px-3 py-2 text-center text-xs font-medium text-white backdrop-blur-sm">
                Loading face models… preview stays live
              </div>
            )}
          </div>
          {camError && <p className="mt-3 text-sm text-rose-600">{camError}</p>}
          {!modelsReady && !camError && (
            <p className="mt-2 text-xs text-slate-500">Camera starts first; AI models load in the background so the page stays responsive.</p>
          )}
        </div>

        <div className="rounded-[2rem] border border-indigo-200/60 bg-gradient-to-br from-indigo-50 to-white p-4 shadow-md shadow-indigo-500/5 max-lg:ring-1 max-lg:ring-indigo-200/50 sm:p-6 md:p-8 lg:shadow-none lg:ring-0">
          <h2 className="text-lg font-bold text-slate-900">Registered face</h2>
          <p className="mt-1 text-sm text-slate-600">
            We compare the live feed to your saved profile image (Euclidean distance threshold {FACE_MATCH_DISTANCE_THRESHOLD}).
          </p>
          <div className="mt-4 text-sm text-slate-700">
            {refStatus === "loading" && <p>Loading your reference photo…</p>}
            {refStatus === "no-photo" && (
              <p className="text-amber-800">
                No profile photo found.{" "}
                <Link to="/student/profile" className="font-semibold text-indigo-600 underline">
                  Open My profile
                </Link>{" "}
                to upload a photo (or add one at signup).
              </p>
            )}
            {refStatus === "no-face-in-photo" && (
              <p className="text-rose-700">
                Could not detect a face in your saved photo.{" "}
                <Link to="/student/profile" className="font-semibold text-indigo-600 underline">
                  Upload a new picture
                </Link>{" "}
                — clear, front-facing, good light.
              </p>
            )}
            {refStatus === "photo-error" && (
              <p className="text-rose-700">
                Could not load your profile image.{" "}
                <Link to="/student/profile" className="font-semibold text-indigo-600 underline">
                  Re-upload on My profile
                </Link>{" "}
                or check your connection.
              </p>
            )}
            {refStatus === "ready" && !faceSessionComplete && (
              <p className="font-medium text-emerald-800">
                {faceNeedsCheckOut
                  ? "You are checked in via face — scan again to check out."
                  : "Reference face loaded — scan to check in."}
              </p>
            )}
            {refStatus === "ready" && faceSessionComplete && (
              <p className="font-medium text-slate-700">
                Today&apos;s face check-in and check-out are done. See{" "}
                <Link to="/student/attendance" className="font-semibold text-indigo-600 underline">
                  Attendance
                </Link>
                .
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleCapture}
            disabled={submitting || refStatus !== "ready" || !modelsReady || faceSessionComplete}
            className="mt-6 min-h-[48px] w-full rounded-2xl bg-slate-900 px-4 py-4 text-sm font-bold text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
          >
            {submitting ? "Processing…" : captureLabel}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MarkAttendancePage;
