const StatCard = ({ label, value, accent = "indigo" }) => {
  const accentClasses = {
    indigo: "from-indigo-500 to-blue-500",
    emerald: "from-emerald-500 to-teal-500",
    amber: "from-amber-500 to-orange-500",
    rose: "from-rose-500 to-pink-500",
  };

  return (
    <div className="rounded-3xl bg-white p-5 shadow-xl shadow-slate-200/50">
      <div className={"inline-flex rounded-2xl bg-gradient-to-r px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white " + (accentClasses[accent] || accentClasses.indigo)}>
        {label}
      </div>
      <p className="mt-4 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
};

export default StatCard;
