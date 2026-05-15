export default function InputField({
  label,
  icon: Icon,
  endIcon: EndIcon,
  onEndClick,
  labelAction,
  error,
  className = '',
  ...props
}) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
          <span>{label}</span>
          {labelAction}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon size={16} />
          </span>
        )}
        <input
          className={`w-full rounded-xl border border-slate-200 bg-white px-10 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-[#FF7A00] focus:outline-none focus:ring-1 focus:ring-[#FF9F43]/30 ${error ? 'border-red-400' : ''} ${className}`}
          {...props}
        />
        {EndIcon && (
          <button
            type="button"
            onClick={onEndClick}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
          >
            <EndIcon size={16} />
          </button>
        )}
      </div>
      {error && <p className="text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
}
