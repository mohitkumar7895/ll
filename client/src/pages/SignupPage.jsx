import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/useAuth";

const inputClass =
  "min-h-[2.75rem] w-full rounded-xl border border-white/10 bg-black/35 px-3.5 py-3 text-base text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 sm:px-4 sm:py-3.5";

const SignupPage = () => {
  const navigate = useNavigate();
  const { studentSignup } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    rollNo: "",
    phone: "",
    email: "",
    password: "",
    profileImage: null,
  });

  const handleChange = (event) => {
    const { name, value, files } = event.target;
    setForm((current) => ({
      ...current,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value) {
          formData.append(key, value);
        }
      });

      const user = await studentSignup(formData);
      toast.success("Welcome, " + user.name + "! Your account is ready.");
      navigate("/student/dashboard");
    } catch (error) {
      toast.error(String(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="font-display relative min-h-[100dvh] w-full overflow-x-hidden bg-[#070b14] text-slate-100">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-1/4 top-0 h-[min(420px,50vh)] w-[min(420px,50vh)] rounded-full bg-teal-500/20 blur-[100px]" />
        <div className="absolute -right-1/4 bottom-0 h-[min(400px,48vh)] w-[min(400px,48vh)] rounded-full bg-fuchsia-600/20 blur-[100px]" />
        <div className="absolute left-1/2 top-1/3 h-48 w-48 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[80px]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-8 sm:pb-8 sm:pt-6">
        {/* Top bar — stack on narrow screens so nothing clips */}
        <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0 pr-0 sm:pr-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-cyan-300/90 sm:text-xs sm:tracking-[0.4em]">
              Join
            </p>
            <h1 className="mt-1.5 bg-gradient-to-r from-white via-white to-slate-400 bg-clip-text text-xl font-black leading-tight tracking-tight text-transparent sm:mt-2 sm:text-3xl">
              Create account
            </h1>
            <p className="mt-1 max-w-[20rem] text-xs leading-snug text-slate-400 sm:mt-1.5 sm:max-w-none sm:text-sm">
              Student ID auto-generated · secure signup
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex min-h-[44px] shrink-0 items-center justify-center self-start rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-slate-200 transition active:scale-[0.98] hover:border-cyan-500/40 hover:text-white sm:self-auto"
          >
            ← Login
          </Link>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 shadow-2xl shadow-black/50 backdrop-blur-xl sm:rounded-3xl sm:p-7">
            <form className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-4" onSubmit={handleSubmit}>
              <div className="sm:col-span-1">
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400" htmlFor="name">
                  Full name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className={inputClass}
                  placeholder="Your name"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400" htmlFor="rollNo">
                  Roll no.
                </label>
                <input
                  id="rollNo"
                  name="rollNo"
                  type="text"
                  value={form.rollNo}
                  onChange={handleChange}
                  required
                  className={inputClass}
                  placeholder="Roll number"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400" htmlFor="phone">
                  Phone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  className={inputClass}
                  placeholder="+91…"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className={inputClass}
                  placeholder="you@college.edu"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className={inputClass}
                  placeholder="Min. 6 characters"
                />
              </div>
              <div className="flex flex-col justify-end sm:col-span-1">
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400" htmlFor="profileImage">
                  Upload photo
                </label>
                <p className="mb-2 text-[11px] leading-relaxed text-slate-500 sm:text-xs">
                  Optional now — needed later for face attendance.
                </p>
                <label
                  htmlFor="profileImage"
                  className="flex min-h-[3rem] cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/20 bg-black/30 px-2 py-3 text-center text-xs text-slate-400 transition hover:border-cyan-500/45 hover:text-slate-200 sm:min-h-[3.25rem] sm:px-3 sm:text-sm"
                >
                  <span className="line-clamp-2 break-all sm:truncate">{form.profileImage ? form.profileImage.name : "Choose image"}</span>
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

              <div className="col-span-full pt-1 sm:pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="min-h-[48px] w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-600 py-3.5 text-base font-bold text-white shadow-xl shadow-cyan-500/30 transition active:scale-[0.99] hover:from-cyan-400 hover:to-teal-500 disabled:cursor-not-allowed disabled:opacity-50 sm:py-4"
                >
                  {submitting ? "Creating…" : "Create my account"}
                </button>
              </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
