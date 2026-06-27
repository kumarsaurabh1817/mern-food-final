// Reusable KPI/stat card used across owner, admin and delivery dashboards.
// Replaces the near-identical inline card markup that was copy-pasted in each.
export default function StatCard({
  label,
  value,
  icon: Icon,
  color = 'text-orange-500',
  bg = 'bg-orange-50',
  hint,
  className = '',
}) {
  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm animate-fade-up ${className}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-400">{label}</p>
        {Icon && (
          <div className={`w-8 h-8 ${bg} rounded-xl flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
        )}
      </div>
      <p className="mt-2 text-2xl font-black text-gray-900 leading-tight">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}
