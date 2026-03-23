import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import DashboardLayout from "../layouts/DashboardLayout";
import { updateMyStudentProfile } from "../services/libraryService";
import { useAuth } from "../context/useAuth";

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 max-lg:shadow-sm max-lg:shadow-slate-200/40 lg:shadow-none";

const absoluteUrl = (path) => {
  if (!path) {
    return "";
  }
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${window.location.origin}${path.startsWith("/") ? path : "/" + path}`;
};

const StudentProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    rollNo: "",
    course: "",
    phone: "",
    email: "",
    password: "",
    profileImage: null,
  });

  useEffect(() => {
    if (!user) {
      return;
    }
    setForm((f) => ({
      ...f,
      name: user.name || "",
      rollNo: user.rollNo || "",
      course: user.course || "",
      phone: user.phone || "",
      email: user.email || "",
      password: "",
      profileImage: null,
    }));
  }, [user]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm((current) => ({
      ...current,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      fd.append("rollNo", form.rollNo.trim());
      fd.append("course", (form.course || "").trim());
      fd.append("phone", form.phone.trim());
      fd.append("email", form.email.trim().toLowerCase());
      if (form.password && form.password.length >= 6) {
        fd.append("password", form.password);
      }
      if (form.profileImage) {
        fd.append("profileImage", form.profileImage);
      }

      await updateMyStudentProfile(fd);
      await refreshUser();
      setForm((current) => ({ ...current, password: "", profileImage: null }));
      toast.success("Profile updated.");
    } catch (err) {
      toast.error(String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const photoPath = user?.profileImage || user?.profilePhoto || "";

  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  useEffect(() => {
    if (!form.profileImage) {
      setFilePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(form.profileImage);
    setFilePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [form.profileImage]);

  const previewUrl = useMemo(() => filePreviewUrl || absoluteUrl(photoPath), [filePreviewUrl, photoPath]);

  return (
    <DashboardLayout
      title="My profile"
      subtitle="Update your details and upload a clear front-facing photo for face attendance."
    >
      <div className="font-display mx-auto w-full max-w-2xl min-w-0 space-y-8">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xl shadow-slate-200/50 max-lg:border-indigo-100/50 max-lg:bg-gradient-to-b max-lg:from-white max-lg:to-indigo-50/25 max-lg:shadow-lg max-lg:shadow-indigo-500/[0.05] sm:p-6 md:p-8 lg:border-slate-200/80 lg:bg-white lg:from-white lg:to-white lg:shadow-xl">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="mx-auto shrink-0 sm:mx-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">Photo</p>
              <div className="mt-2 h-32 w-32 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 ring-1 ring-slate-100 max-lg:ring-2 max-lg:ring-indigo-100/70 max-lg:shadow-md lg:ring-1 lg:shadow-none">
                {previewUrl ? (
                  <img src={previewUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center p-2 text-center text-xs text-slate-400">
                    No photo
                  </div>
                )}
              </div>
            </div>
            <p className="min-w-0 text-sm leading-relaxed text-slate-600">
              Use a well-lit, front-facing picture (JPEG/PNG/WebP, max 2MB). This image is used to verify you on{" "}
              <Link to="/student/mark-attendance" className="font-semibold text-indigo-600 underline">
                Mark Attendance
              </Link>
              .
            </p>
          </div>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="name">
                Full name
              </label>
              <input id="name" name="name" value={form.name} onChange={handleChange} required className={inputClass} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="rollNo">
                  Roll no.
                </label>
                <input id="rollNo" name="rollNo" value={form.rollNo} onChange={handleChange} required className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="course">
                  Course
                </label>
                <input id="course" name="course" value={form.course} onChange={handleChange} className={inputClass} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="phone">
                Phone
              </label>
              <input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} required className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="email">
                Email
              </label>
              <input id="email" name="email" type="email" value={form.email} onChange={handleChange} required className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="password">
                New password <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
                placeholder="Leave blank to keep current password"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="profileImage">
                Upload photo
              </label>
              <label
                htmlFor="profileImage"
                className="flex min-h-[3rem] cursor-pointer items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-center text-sm text-slate-500 transition hover:border-indigo-400 hover:bg-white"
              >
                <span className="truncate">{form.profileImage ? form.profileImage.name : "Choose new image (optional)"}</span>
              </label>
              <input
                id="profileImage"
                name="profileImage"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleChange}
                className="sr-only"
              />
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
              <button
                type="submit"
                disabled={submitting}
                className="min-h-[44px] w-full rounded-2xl bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-slate-800 disabled:opacity-50 sm:min-h-0 sm:w-auto"
              >
                {submitting ? "Saving…" : "Save changes"}
              </button>
              <Link
                to="/student/mark-attendance"
                className="inline-flex min-h-[44px] w-full items-center justify-center rounded-2xl border border-slate-200 px-6 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:min-h-0 sm:w-auto"
              >
                ← Mark Attendance
              </Link>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentProfilePage;
