import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/useAuth";

const LoginPage = () => {
  const navigate = useNavigate();
  const { studentLogin, adminLogin } = useAuth();
  const [mode, setMode] = useState("student");
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const user = mode === "student" ? await studentLogin(form) : await adminLogin(form);
      toast.success("Welcome back, " + user.name);
      navigate(user.role === "admin" ? "/admin/dashboard" : "/student/dashboard");
    } catch (error) {
      toast.error(String(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="font-display fixed inset-0 flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-[#070b14] text-slate-100">
      {/* Ambient mesh */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-1/4 top-0 h-[min(500px,55vh)] w-[min(500px,55vh)] rounded-full bg-fuchsia-600/25 blur-[120px]" />
        <div className="absolute -right-1/4 bottom-0 h-[min(480px,52vh)] w-[min(480px,52vh)] rounded-full bg-cyan-500/20 blur-[110px]" />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 max-h-[40vh] max-w-[40vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/15 blur-[90px]" />
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-8">
        <div className="mx-auto flex w-full max-w-md min-h-0 flex-1 flex-col justify-center">
        <div className="mb-4 shrink-0 text-center sm:mb-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.5em] text-cyan-300/90">Library Hub</p>
          <h1 className="mt-2 bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-3xl font-black tracking-tight text-transparent sm:mt-3 sm:text-4xl">
            Sign in
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">Secure access · JWT protected</p>
        </div>

        {/* Mode toggle */}
        <div className="mb-4 flex shrink-0 rounded-2xl border border-white/10 bg-white/[0.04] p-1.5 shadow-inner shadow-black/40 backdrop-blur-xl sm:mb-6">
          <button
            type="button"
            onClick={() => setMode("student")}
            className={
              "relative flex flex-1 items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition " +
              (mode === "student"
                ? "bg-gradient-to-br from-cyan-500 to-teal-600 text-white shadow-lg shadow-cyan-500/25"
                : "text-slate-400 hover:text-white")
            }
          >
            <svg className="h-5 w-5 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
            Student
          </button>
          <button
            type="button"
            onClick={() => setMode("admin")}
            className={
              "relative flex flex-1 items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition " +
              (mode === "admin"
                ? "bg-gradient-to-br from-violet-600 to-fuchsia-700 text-white shadow-lg shadow-violet-500/30"
                : "text-slate-400 hover:text-white")
            }
          >
            <svg className="h-5 w-5 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Admin
          </button>
        </div>

        <div className="min-h-0 shrink rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/50 backdrop-blur-2xl sm:p-7">
          <div className="mb-4 sm:mb-5">
            <h2 className="text-lg font-bold text-white sm:text-xl">
              {mode === "student" ? "Student access" : "Admin console"}
            </h2>
            <p className="mt-1 text-xs leading-snug text-slate-400 sm:text-sm">
              {mode === "student" ? "Book seats, track attendance, pay securely." : "Manage seats, users, and live analytics."}
            </p>
          </div>

          <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="email">
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
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3.5 text-sm text-white outline-none ring-cyan-500/0 transition placeholder:text-slate-600 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20"
                placeholder={mode === "student" ? "you@college.edu" : "admin@yourdomain.com"}
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={
                "w-full rounded-xl py-4 text-sm font-bold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-50 " +
                (mode === "student"
                  ? "bg-gradient-to-r from-cyan-500 to-teal-600 shadow-cyan-500/25 hover:from-cyan-400 hover:to-teal-500"
                  : "bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-violet-500/25 hover:from-violet-500 hover:to-fuchsia-500")
              }
            >
              {submitting ? "Signing in…" : mode === "student" ? "Enter as student" : "Enter as admin"}
            </button>
          </form>

          {mode === "student" && (
            <p className="mt-4 text-center text-sm text-slate-500 sm:mt-5">
              New here?{" "}
              <Link to="/signup" className="font-bold text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline">
                Create account
              </Link>
            </p>
          )}
        </div>

        <p className="mt-4 shrink-0 text-center text-[11px] text-slate-600 sm:mt-5">Encrypted session · Role-based routing</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
