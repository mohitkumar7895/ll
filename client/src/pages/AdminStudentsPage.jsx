import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import DashboardLayout from "../layouts/DashboardLayout";
import { deleteStudentAsAdmin, fetchStudents, updateStudentAsAdmin } from "../services/libraryService";

const emptyEditForm = () => ({
  name: "",
  phone: "",
  email: "",
  password: "",
  penaltyAmount: 0,
  subscriptionStatus: "active",
});

const AdminStudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [editPhoto, setEditPhoto] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await fetchStudents();
      setStudents(res.students || []);
    } catch (e) {
      toast.error(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => {
      const blob = [s.name, s.studentId, s.email].filter(Boolean).join(" ").toLowerCase();
      return blob.includes(q);
    });
  }, [students, query]);

  const openEdit = (student) => {
    setEditId(student._id);
    setEditForm({
      name: student.name || "",
      phone: student.phone || "",
      email: student.email || "",
      password: "",
      penaltyAmount: student.penaltyAmount ?? 0,
      subscriptionStatus: student.subscriptionStatus || "active",
    });
    setEditPhoto(null);
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditId(null);
    setEditForm(emptyEditForm());
    setEditPhoto(null);
  };

  const handleEditChange = (e) => {
    const { name, value, type } = e.target;
    if (type === "number") {
      setEditForm((prev) => ({ ...prev, [name]: value === "" ? "" : Number(value) }));
    } else {
      setEditForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    if (!editId) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", editForm.name.trim());
      fd.append("phone", editForm.phone.trim());
      fd.append("email", editForm.email.trim().toLowerCase());
      fd.append("penaltyAmount", String(editForm.penaltyAmount === "" ? 0 : editForm.penaltyAmount));
      fd.append("subscriptionStatus", editForm.subscriptionStatus);
      if (editForm.password && editForm.password.length > 0) {
        fd.append("password", editForm.password);
      }
      if (editPhoto) {
        fd.append("profilePhoto", editPhoto);
      }
      await updateStudentAsAdmin(editId, fd);
      toast.success("Student updated");
      closeEdit();
      await load();
    } catch (err) {
      toast.error(String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (student) => {
    const ok = window.confirm(
      `Delete "${student.name}" permanently?\n\n` +
        "This will remove their account, all bookings, attendance records, and payments. Seats linked to active bookings will be freed.",
    );
    if (!ok) return;
    setDeletingId(student._id);
    try {
      await deleteStudentAsAdmin(student._id);
      toast.success("Student and all related data deleted");
      await load();
    } catch (err) {
      toast.error(String(err));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <DashboardLayout
      title="Registered Students"
      subtitle="Directory with admin controls — edit details or remove a student and all linked data."
    >
      <div className="font-display min-w-0">
        <div className="relative overflow-hidden rounded-[2rem] border border-violet-500/25 bg-gradient-to-br from-violet-950 via-slate-900 to-slate-950 p-5 text-white shadow-2xl shadow-violet-900/30 sm:p-8 md:p-10">
          <div className="pointer-events-none absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" aria-hidden />
          <div className="relative flex min-w-0 flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-violet-300/90">Directory</p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">Every enrolled student</h2>
              <p className="mt-3 max-w-xl text-sm text-slate-300">
                Search, edit profiles, or delete — deletion wipes bookings, attendance & payments.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-violet-200/80">Total</p>
                <p className="text-2xl font-bold tabular-nums">{students.length}</p>
              </div>
              <Link
                to="/admin/dashboard"
                className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-violet-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg transition hover:bg-violet-300"
              >
                ← Dashboard
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 sm:mt-8">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, student ID, email…"
            className="w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 sm:text-sm md:max-w-xl"
          />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <p className="col-span-full py-12 text-center text-slate-500">Loading students…</p>
          ) : filtered.length ? (
            filtered.map((student, index) => (
              <article
                key={student._id}
                className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/40 transition hover:-translate-y-0.5 hover:border-violet-300/60 hover:shadow-xl hover:shadow-violet-500/10"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Student</p>
                    <h3 className="mt-1 text-xl font-bold text-slate-900">{student.name}</h3>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(student)}
                      className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-800 transition hover:bg-violet-100"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === student._id}
                      onClick={() => handleDelete(student)}
                      className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                    >
                      {deletingId === student._id ? "…" : "Delete"}
                    </button>
                  </div>
                </div>
                <div className="pointer-events-none absolute -right-4 top-24 h-24 w-24 rounded-2xl bg-gradient-to-br from-violet-500/15 to-transparent opacity-0 transition group-hover:opacity-100" />
                <p className="mt-3 font-mono text-sm font-semibold text-violet-700">{student.studentId}</p>
                <dl className="mt-4 space-y-2 text-sm text-slate-600">
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-400">Email</dt>
                    <dd className="truncate text-right font-medium text-slate-800">{student.email}</dd>
                  </div>
                  <div className="flex justify-between gap-2 border-t border-slate-100 pt-3">
                    <dt className="font-semibold text-slate-800">Penalty</dt>
                    <dd className="font-bold tabular-nums text-rose-600">₹{student.penaltyAmount ?? 0}</dd>
                  </div>
                </dl>
              </article>
            ))
          ) : (
            <p className="col-span-full py-12 text-center text-slate-500">No students match your search.</p>
          )}
        </div>
      </div>

      {editOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-student-title"
        >
          <div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-violet-500/30 bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl shadow-violet-900/20 sm:rounded-3xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="edit-student-title" className="text-xl font-extrabold text-slate-900">
                  Edit student
                </h2>
                <p className="mt-1 text-sm text-slate-500">Leave password blank to keep the current one.</p>
              </div>
              <button
                type="button"
                onClick={closeEdit}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                ✕
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={submitEdit}>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="edit-name">
                  Name
                </label>
                <input
                  id="edit-name"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditChange}
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="edit-phone">
                  Phone
                </label>
                <input
                  id="edit-phone"
                  name="phone"
                  value={editForm.phone}
                  onChange={handleEditChange}
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="edit-email">
                  Email
                </label>
                <input
                  id="edit-email"
                  name="email"
                  type="email"
                  value={editForm.email}
                  onChange={handleEditChange}
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="edit-penalty">
                    Penalty (₹)
                  </label>
                  <input
                    id="edit-penalty"
                    name="penaltyAmount"
                    type="number"
                    min={0}
                    step={1}
                    value={editForm.penaltyAmount}
                    onChange={handleEditChange}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="edit-sub">
                    Subscription
                  </label>
                  <select
                    id="edit-sub"
                    name="subscriptionStatus"
                    value={editForm.subscriptionStatus}
                    onChange={handleEditChange}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="edit-pass">
                  New password (optional)
                </label>
                <input
                  id="edit-pass"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={editForm.password}
                  onChange={handleEditChange}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="edit-photo">
                  Profile photo (optional)
                </label>
                <input
                  id="edit-photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setEditPhoto(e.target.files?.[0] || null)}
                  className="w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-violet-100 file:px-3 file:py-2 file:text-sm file:font-bold file:text-violet-800"
                />
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-2xl bg-violet-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition hover:bg-violet-500 disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
                <button
                  type="button"
                  onClick={closeEdit}
                  className="rounded-2xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminStudentsPage;
