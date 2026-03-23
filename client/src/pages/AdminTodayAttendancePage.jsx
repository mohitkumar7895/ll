import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import DashboardLayout from "../layouts/DashboardLayout";
import { fetchFaceAttendanceAll } from "../services/libraryService";
import { getSocket } from "../services/socket";
import { formatHours } from "../utils/format";

const AdminTodayAttendancePage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetchFaceAttendanceAll();
      setRows(res.attendance || []);
    } catch (e) {
      toast.error(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const socket = getSocket();
    socket.connect();
    socket.on("faceAttendanceUpdated", load);
    socket.on("attendanceUpdated", load);
    return () => {
      socket.off("faceAttendanceUpdated", load);
      socket.off("attendanceUpdated", load);
    };
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return rows;
    }
    return rows.filter((entry) => {
      const name = (entry.name || "").toLowerCase();
      const uid = String(entry.userId || "").toLowerCase();
      return name.includes(q) || uid.includes(q);
    });
  }, [rows, query]);

  return (
    <DashboardLayout
      title="Face Attendance"
      subtitle="Students who marked present via face recognition — name, date, time, and status."
    >
      <div className="font-display min-w-0">
        <div className="relative overflow-hidden rounded-[2rem] border border-emerald-500/20 bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 p-5 text-white shadow-2xl shadow-emerald-900/30 sm:p-8 md:p-10">
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl"
            aria-hidden
          />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-300/90">Recognition log</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">Face attendance records</h2>
              <p className="mt-3 max-w-xl text-sm text-slate-300">
                Updates when a student successfully marks attendance from the Mark Attendance page. Search by name.
              </p>
            </div>
            <Link
              to="/admin/dashboard"
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-lg transition hover:bg-emerald-50 sm:w-auto"
            >
              ← Dashboard
            </Link>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 sm:mt-8 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name…"
            className="w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base outline-none ring-slate-900/5 transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:w-80 sm:text-sm"
          />
        </div>

        <div className="mt-6 min-w-0 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/50">
          <div className="-mx-px overflow-x-auto sm:mx-0">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/90 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">
                  <th className="px-5 py-4">Name</th>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Check-in</th>
                  <th className="px-5 py-4">Check-out</th>
                  <th className="px-5 py-4">Hours</th>
                  <th className="px-5 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                      Loading attendance…
                    </td>
                  </tr>
                ) : filtered.length ? (
                  filtered.map((entry) => (
                    <tr
                      key={entry._id}
                      className="border-b border-slate-100 transition hover:bg-slate-50/80 bg-emerald-50/30"
                    >
                      <td className="px-5 py-4 font-semibold text-slate-900">{entry.name || "—"}</td>
                      <td className="px-5 py-4 tabular-nums text-slate-600">{entry.date || "—"}</td>
                      <td className="px-5 py-4 tabular-nums">{entry.time || "—"}</td>
                      <td className="px-5 py-4 tabular-nums text-slate-600">{entry.checkOutTime || "—"}</td>
                      <td className="px-5 py-4 tabular-nums">{entry.totalFaceHours != null ? formatHours(entry.totalFaceHours) : "—"}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                          {entry.checkOutTime ? "Present · done" : "Present · in"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                      No face attendance records yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminTodayAttendancePage;
