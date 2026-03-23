import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import DashboardLayout from "../layouts/DashboardLayout";
import FaceAttendanceCam from "../components/FaceAttendanceCam";
import { FACE_MATCH_DISTANCE_THRESHOLD } from "../constants/faceAttendance";
import { loadFaceModels, faceapi } from "../utils/faceApiModels";
import { fetchStudentFaceToday, fetchStudents, markFaceAttendanceAsAdmin } from "../services/libraryService";
import { waitForVideoReady } from "../utils/videoReady";
import { useTinyFaceDetectorOptions } from "../hooks/useTinyFaceDetectorOptions";

const yieldToMain = () =>
  new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });

const absoluteUrl = (path) => {
  if (!path) {
    return "";
  }
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${window.location.origin}${path.startsWith("/") ? path : "/" + path}`;
};

const AdminMarkAttendancePage = () => {
  const videoRef = useRef(null);
  const tinyOptions = useTinyFaceDetectorOptions();
  const [modelsReady, setModelsReady] = useState(false);
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [refDescriptor, setRefDescriptor] = useState(null);
  const [refStatus, setRefStatus] = useState("idle");
  const [submitting, setSubmitting] = useState(false);
  const [camError, setCamError] = useState(null);
  const [todayFaceRecord, setTodayFaceRecord] = useState(null);

  const selectedStudent = students.find((s) => String(s._id) === studentId);
  const photoPath = selectedStudent?.profileImage || selectedStudent?.profilePhoto || "";

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

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchStudents();
        setStudents(res.students || []);
      } catch (e) {
        toast.error(String(e));
      }
    })();
  }, []);

  const loadTodayFace = useCallback(async (sid) => {
    if (!sid) {
      setTodayFaceRecord(null);
      return;
    }
    try {
      const res = await fetchStudentFaceToday(sid);
      setTodayFaceRecord(res.record || null);
    } catch {
      setTodayFaceRecord(null);
    }
  }, []);

  useEffect(() => {
    loadTodayFace(studentId);
  }, [studentId, loadTodayFace]);

  useEffect(() => {
    if (!studentId) {
      setRefDescriptor(null);
      setRefStatus("idle");
      return;
    }
    if (!modelsReady) {
      return;
    }
    if (!photoPath) {
      setRefDescriptor(null);
      setRefStatus("no-photo");
      return;
    }

    let cancelled = false;
    (async () => {
      setRefStatus("loading");
      try {
        await yieldToMain();
        const url = absoluteUrl(photoPath);
        const img = await faceapi.fetchImage(url);
        const det = await faceapi.detectSingleFace(img, tinyOptions).withFaceLandmarks().withFaceDescriptor();
        if (cancelled) {
          return;
        }
        if (!det) {
          setRefDescriptor(null);
          setRefStatus("no-face-in-photo");
          return;
        }
        setRefDescriptor(det.descriptor);
        setRefStatus("ready");
      } catch (e) {
        if (!cancelled) {
          setRefDescriptor(null);
          setRefStatus("photo-error");
          console.error(e);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [modelsReady, studentId, photoPath, tinyOptions]);

  const handleStreamError = useCallback((err) => {
    setCamError(String(err?.message || err || "Camera unavailable"));
    toast.error("Camera access denied or unavailable.");
  }, []);

  const handleCapture = async () => {
    if (!studentId) {
      toast.error("Select a student first.");
      return;
    }
    if (!refDescriptor) {
      toast.error("Reference photo not ready for this student.");
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
        toast.error("Face not matched — person in camera must match the selected student's profile photo.");
        return;
      }

      const res = await markFaceAttendanceAsAdmin(studentId);
      toast.success(res?.message || "Saved.");
      await loadTodayFace(studentId);
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
      title="Mark Attendance (Admin)"
      subtitle="Choose a student, then verify their face against the profile photo on file — same check-in / check-out rules as the student app."
    >
      <div className="font-display mx-auto w-full max-w-3xl min-w-0 space-y-6 sm:space-y-8">
        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-4 shadow-xl shadow-slate-200/50 max-lg:border-indigo-100/45 max-lg:bg-gradient-to-b max-lg:from-white max-lg:to-slate-50/80 max-lg:shadow-lg sm:p-6 md:p-8 lg:border-slate-200/80 lg:bg-white lg:from-white lg:to-white lg:shadow-xl">
          <label className="block text-sm font-bold text-slate-800" htmlFor="admin-student">
            Student
          </label>
          <select
            id="admin-student"
            value={studentId}
            onChange={(e) => {
              setStudentId(e.target.value);
              setCamError(null);
            }}
            className="mt-2 min-h-[48px] w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:min-h-0 sm:text-sm"
          >
            <option value="">— Select student —</option>
            {students.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} · {s.studentId || s.rollNo} · {s.email}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-slate-500">
            Data comes from <Link to="/admin/students" className="font-semibold text-indigo-600 underline">Students</Link>. Student must have a profile photo.
          </p>
        </div>

        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-4 shadow-xl shadow-slate-200/50 max-lg:border-indigo-100/45 max-lg:bg-gradient-to-b max-lg:from-white max-lg:to-slate-50/80 max-lg:shadow-lg sm:p-6 md:p-8 lg:border-slate-200/80 lg:bg-white lg:from-white lg:to-white lg:shadow-xl">
          <h2 className="text-lg font-bold text-slate-900">Webcam</h2>
          <p className="mt-1 text-sm text-slate-500">
            The person in frame should be the selected student — we match against their saved photo. On a phone, tap{" "}
            <span className="font-semibold text-slate-700">Start camera</span> first if you see it.
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
        </div>

        <div className="rounded-[2rem] border border-indigo-200/60 bg-gradient-to-br from-indigo-50 to-white p-4 shadow-md shadow-indigo-500/5 max-lg:ring-1 max-lg:ring-indigo-200/50 sm:p-6 md:p-8 lg:shadow-none lg:ring-0">
          <h2 className="text-lg font-bold text-slate-900">Registered face (selected student)</h2>
          <p className="mt-1 text-sm text-slate-600">
            Threshold {FACE_MATCH_DISTANCE_THRESHOLD}. Today&apos;s face status updates after each successful mark.
          </p>
          <div className="mt-4 text-sm text-slate-700">
            {!studentId && <p className="text-slate-500">Select a student to load their reference photo.</p>}
            {studentId && refStatus === "loading" && <p>Loading reference photo…</p>}
            {studentId && refStatus === "no-photo" && (
              <p className="text-amber-800">This student has no profile photo. Add one from the Students page.</p>
            )}
            {studentId && refStatus === "no-face-in-photo" && (
              <p className="text-rose-700">Could not detect a face in this student&apos;s saved photo.</p>
            )}
            {studentId && refStatus === "photo-error" && (
              <p className="text-rose-700">Could not load the profile image (URL or network).</p>
            )}
            {studentId && refStatus === "ready" && !faceSessionComplete && (
              <p className="font-medium text-emerald-800">
                {faceNeedsCheckOut
                  ? "Student is checked in via face — scan again to record check-out."
                  : "Reference loaded — scan to check in."}
              </p>
            )}
            {studentId && refStatus === "ready" && faceSessionComplete && (
              <p className="font-medium text-slate-700">
                Today&apos;s face check-in and check-out are done for this student.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleCapture}
            disabled={submitting || refStatus !== "ready" || !modelsReady || !studentId || faceSessionComplete}
            className="mt-6 min-h-[48px] w-full rounded-2xl bg-slate-900 px-4 py-4 text-sm font-bold text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
          >
            {submitting ? "Processing…" : captureLabel}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminMarkAttendancePage;
