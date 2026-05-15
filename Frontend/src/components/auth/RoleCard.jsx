export default function RoleCard({ icon: Icon, label, description, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition ${
        selected
          ? 'border-[#FF7A00] bg-orange-50/80 shadow-[0_10px_20px_rgba(255,122,0,0.15)]'
          : 'border-slate-200 bg-white hover:border-orange-200 hover:bg-orange-50/40'
      }`}
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
          selected
            ? 'bg-gradient-to-r from-[#FF7A00] to-[#FF9F43] text-white'
            : 'bg-slate-100 text-slate-500'
        }`}
      >
        <Icon size={16} />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-900">{label}</p>
        <p className="text-[11px] text-slate-500 leading-tight">{description}</p>
      </div>
    </button>
  );
}
