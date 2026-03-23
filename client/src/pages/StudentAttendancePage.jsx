import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import DashboardLayout from "../layouts/DashboardLayout";
import { fetchAttendance } from "../services/libraryService";
import { getSocket } from "../services/socket";
import { formatDateTime, formatHours } from "../utils/format";

const faceSortTime = (entry) => {
  if (entry?.updatedAt) {
    const u = new Date(entry.updatedAt).getTime();
    if (!Number.isNaN(u)) {
      return u;
    }
  }
  if (entry?.createdAt) {
    const c = new Date(entry.createdAt).getTime();
    if (!Number.isNaN(c)) {
      return c;
    }
  }
  if (entry?.date && entry?.time) {
    const t = new Date(`${entry.date}T${entry.time}`);
    const ms = t.getTime();
    if (!Number.isNaN(ms)) {
      return ms;
    }
  }
  return 0;
};

const librarySortTime = (entry) => {
  if (entry?.checkInTime) {
    return new Date(entry.checkInTime).getTime();
  }
  return 0;
};

const StudentAttendancePage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetchAttendance();
      const library = Array.isArray(res.attendance) ? res.attendance : [];
      const face = Array.isArray(res.faceAttendance) ? res.faceAttendance : [];

      const merged = [
        ...library.map((entry) => ({
          kind: "library",
          entry,
          sortTime: librarySortTime(entry),
        })),
        ...face.map((entry) => ({
          kind: "face",
          entry,
          sortTime: faceSortTime(entry),
        })),
      ].sort((a, b) => b.sortTime - a.sortTime);

      setRows(merged);
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
    socket.on("attendanceUpdated", load);
    return () => {
      socket.off("attendanceUpdated", load);
    };
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return rows;
    }
    return rows.filter((row) => {
      if (row.kind === "library") {
        const e = row.entry;
        const seat = e.seat?.seatNumber?.toLowerCase() || "";
        const date = e.attendanceDate?.toLowerCase() || "";
        return seat.includes(q) || date.includes(q);
      }
      const e = row.entry;
      const date = (e.date || "").toLowerCase();
      const time = (e.time || "").toLowerCase();
      if (date.includes(q) || time.includes(q)) {
        return true;
      }
      return q.length >= 2 && "face".includes(q);
    });
  }, [rows, query]);

  return (
    <DashboardLayout
      title="Attendance Log"
      subtitle="Seat check-in / check-out (hours) and face check-in / check-out — newest first."
    >
      <div className="font-display min-w-0">
        <div className="relative overflow-hidden rounded-[2rem] border border-emerald-500/25 bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 p-5 text-white shadow-2xl shadow-emerald-900/30 sm:p-8 md:p-10">
          <div className="pointer-events-none absolute right-10 top-10 h-40 w-40 rounded-full bg-emerald-400/10 blur-2xl" aria-hidden />
          <div className="relative flex min-w-0 flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-300/90">Sessions</p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">Attendance history</h2>
              <p className="mt-3 max-w-xl text-sm text-slate-300">
                Search by seat, date, or &quot;face&quot;. Face rows are daily presence from Mark Attendance.
              </p>
            </div>
            <Link
              to="/student/dashboard"
              className="inline-flex min-h-[44px] w-full items-center justify-center self-start rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg transition hover:bg-emerald-300 sm:w-auto lg:self-end"
            >
              ← Home
            </Link>
          </div>
        </div>

        <div className="mt-6 sm:mt-8">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search seat, date, or face…"
            className="w-full min-w-0 max-w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:max-w-md sm:text-sm"
          />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {loading ? (
            <p className="col-span-full py-12 text-center text-slate-500">Loading attendance…</p>
          ) : filtered.length ? (
            filtered.map((row) =>
              row.kind === "library" ? (
                <LibraryAttendanceCard key={row.entry._id} entry={row.entry} />
              ) : (
                <FaceAttendanceCard key={row.entry._id} entry={row.entry} />
              )
            )
          ) : (
            <p className="col-span-full py-12 text-center text-slate-500">No attendance records yet.</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

const LibraryAttendanceCard = ({ entry }) => (
  <article className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/40 transition hover:border-emerald-300/50 hover:shadow-xl">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{entry.attendanceDate}</p>
        <h3 className="mt-1 text-lg font-bold text-slate-900">{entry.seat?.seatNumber || "No seat"}</h3>
        <p className="text-xs text-slate-500">{entry.seat?.seatType}</p>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-600">Seat check-in</p>
      </div>
      <span
        className={
          "rounded-full px-3 py-1 text-xs font-bold " +
          (entry.status === "Present" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600")
        }
      >
        {entry.status}
      </span>
    </div>
    <dl className="mt-4 space-y-2 text-sm text-slate-600">
      <div className="flex justify-between">
        <dt>Check-in</dt>
        <dd className="font-medium text-slate-800">{formatDateTime(entry.checkInTime)}</dd>
      </div>
      <div className="flex justify-between">
        <dt>Check-out</dt>
        <dd className="font-medium text-slate-800">{formatDateTime(entry.checkOutTime)}</dd>
      </div>
      <div className="flex justify-between border-t border-slate-100 pt-3">
        <dt className="font-semibold text-slate-800">Hours</dt>
        <dd className="font-bold text-emerald-700">{formatHours(entry.totalHours)}</dd>
      </div>
    </dl>
  </article>
);

const FaceAttendanceCard = ({ entry }) => {
  const done = Boolean(entry.checkOutTime);
  return (
    <article className="rounded-3xl border border-indigo-200/80 bg-white p-6 shadow-lg shadow-slate-200/40 transition hover:border-indigo-300/50 hover:shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{entry.date}</p>
          <h3 className="mt-1 text-lg font-bold text-slate-900">Face attendance</h3>
          <p className="text-xs text-slate-500">Camera match · first scan = in, second = out</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-indigo-600">Face recognition</p>
        </div>
        <span
          className={
            "rounded-full px-3 py-1 text-xs font-bold " +
            (done ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900")
          }
        >
          {done ? "Completed" : "In progress"}
        </span>
      </div>
      <dl className="mt-4 space-y-2 text-sm text-slate-600">
        <div className="flex justify-between">
          <dt>Check-in</dt>
          <dd className="font-medium text-slate-800">
            {entry.date} {entry.time ? `· ${entry.time}` : ""}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt>Check-out</dt>
          <dd className="font-medium text-slate-800">{entry.checkOutTime || "—"}</dd>
        </div>
        <div className="flex justify-between border-t border-slate-100 pt-3">
          <dt className="font-semibold text-slate-800">Hours</dt>
          <dd className="font-bold text-indigo-700">
            {entry.totalFaceHours != null ? formatHours(entry.totalFaceHours) : "—"}
          </dd>
        </div>
      </dl>
    </article>
  );
};

export default StudentAttendancePage;
