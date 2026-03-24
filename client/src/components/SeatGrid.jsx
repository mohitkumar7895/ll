const statusConfig = {
  available: {
    cell: "border-emerald-400/50 bg-gradient-to-b from-emerald-50 to-emerald-100/80 text-emerald-900 shadow-sm shadow-emerald-900/5 hover:border-emerald-500 hover:shadow-md hover:shadow-emerald-500/15",
    dot: "bg-emerald-500",
  },
  occupied: {
    cell: "border-rose-300/60 bg-gradient-to-b from-rose-50 to-rose-100/90 text-rose-900 opacity-95",
    dot: "bg-rose-500",
  },
  reserved: {
    cell: "border-amber-400/60 bg-gradient-to-b from-amber-50 to-amber-100/90 text-amber-950",
    dot: "bg-amber-500",
  },
};

const SeatGrid = ({ seats, selectedSeatId, onSelect }) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Floor map</h3>
          <p className="mt-1 text-xs text-slate-500">Tap a <span className="font-semibold text-emerald-700">green</span> seat — locked & busy seats are disabled.</p>
        </div>
        <div className="flex flex-wrap gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Free
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Held
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Busy
          </span>
        </div>
      </div>

      <div className="relative max-h-[min(58vh,520px)] overflow-y-auto rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3 shadow-inner">
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-10">
          {seats.map((seat) => {
            const isSelected = selectedSeatId === seat._id;
            const isAvailable = seat.status === "available";
            const cfg = statusConfig[seat.status] || statusConfig.available;

            return (
              <button
                key={seat._id}
                type="button"
                onClick={() => isAvailable && onSelect(seat)}
                title={seat.seatNumber + " · " + seat.status}
                className={
                  "relative flex min-h-[3.25rem] flex-col items-center justify-center rounded-xl border-2 px-1 py-2 text-center transition duration-150 " +
                  cfg.cell +
                  (isSelected
                    ? " z-10 scale-[1.03] border-indigo-500 !bg-white shadow-lg shadow-indigo-500/25 ring-2 ring-indigo-400/40"
                    : "") +
                  (!isAvailable ? " cursor-not-allowed grayscale-[0.15]" : " active:scale-[0.98]")
                }
              >
                <span className="max-w-full truncate px-0.5 text-[11px] font-bold leading-tight sm:text-xs">{seat.seatNumber}</span>
                <span className={"mt-0.5 h-1 w-1 rounded-full " + cfg.dot} aria-hidden />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SeatGrid;
