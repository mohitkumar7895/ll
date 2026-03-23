import { NavLink } from "react-router-dom";
import { useAuth } from "../context/useAuth";

const linkClass = ({ isActive }) =>
  "shrink-0 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-medium transition sm:px-4 max-sm:snap-start " +
  (isActive
    ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20 max-sm:ring-2 max-sm:ring-indigo-400/25"
    : "text-slate-600 hover:bg-white hover:text-slate-900 max-sm:border max-sm:border-slate-200/90 max-sm:bg-white max-sm:shadow-sm sm:border-transparent sm:bg-white/70 sm:shadow-none");

const DashboardLayout = ({ title, subtitle, children }) => {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-[100dvh] min-w-0 bg-slate-100 text-slate-900 max-lg:bg-[linear-gradient(180deg,#f5f7fc_0%,#eef1f8_55%,#e8ecf4_100%)] lg:bg-slate-100">
      <div className="mx-auto max-w-7xl px-3 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 sm:py-6 lg:px-8">
        <div className="mb-5 rounded-[1.25rem] border border-transparent bg-white p-4 shadow-xl shadow-slate-200/60 max-lg:border-indigo-100/40 max-lg:bg-gradient-to-br max-lg:from-white max-lg:to-indigo-50/35 max-lg:shadow-lg max-lg:shadow-indigo-500/[0.06] sm:mb-6 sm:rounded-3xl sm:p-5 lg:border-transparent lg:bg-white lg:from-white lg:to-white lg:shadow-xl lg:shadow-slate-200/60">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-indigo-600 sm:text-sm sm:tracking-[0.3em]">
                Library Hub
              </p>
              <h1 className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:tracking-normal">{title}</h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-500 max-lg:text-slate-600">{subtitle}</p>
            </div>
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <div className="min-w-0 rounded-2xl border border-transparent bg-slate-100 px-4 py-3 max-lg:border-indigo-100/60 max-lg:bg-white max-lg:shadow-sm sm:max-w-[min(100%,20rem)] lg:border-transparent lg:bg-slate-100 lg:shadow-none">
                <p className="truncate text-sm font-semibold text-slate-900">{user?.name}</p>
                <p className="truncate text-xs text-slate-500">{isAdmin ? user?.email : user?.studentId}</p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="min-h-[44px] shrink-0 rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-rose-500/20 transition hover:bg-rose-600 max-lg:ring-2 max-lg:ring-rose-300/30 sm:min-h-0 lg:shadow-none lg:ring-0"
              >
                Logout
              </button>
            </div>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto overscroll-x-contain pb-2 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] max-sm:rounded-2xl max-sm:border max-sm:border-slate-200/60 max-sm:bg-slate-100/95 max-sm:p-2 max-sm:shadow-inner max-sm:shadow-slate-300/25 max-sm:snap-x max-sm:snap-mandatory sm:mt-5 sm:flex-wrap sm:overflow-visible sm:pb-1 [&::-webkit-scrollbar]:hidden">
            {!isAdmin && (
              <>
                <NavLink to="/student/dashboard" className={linkClass}>
                  Home
                </NavLink>
                <NavLink to="/student/profile" className={linkClass}>
                  Profile
                </NavLink>
                <NavLink to="/student/seats" className={linkClass}>
                  Book seat
                </NavLink>
                <NavLink to="/student/bookings" className={linkClass}>
                  Bookings
                </NavLink>
                <NavLink to="/student/payments" className={linkClass}>
                  Payments
                </NavLink>
                <NavLink to="/student/attendance" className={linkClass}>
                  Attendance
                </NavLink>
                <NavLink to="/student/mark-attendance" className={linkClass}>
                  Mark Attendance
                </NavLink>
              </>
            )}
            {isAdmin && (
              <>
                <NavLink to="/admin/dashboard" className={linkClass}>
                  Dashboard
                </NavLink>
                <NavLink to="/admin/attendance" className={linkClass}>
                  Face Attendance
                </NavLink>
                <NavLink to="/admin/mark-attendance" className={linkClass}>
                  Mark Attendance
                </NavLink>
                <NavLink to="/admin/payments" className={linkClass}>
                  Payments
                </NavLink>
                <NavLink to="/admin/students" className={linkClass}>
                  Students
                </NavLink>
              </>
            )}
          </div>
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
};

export default DashboardLayout;
