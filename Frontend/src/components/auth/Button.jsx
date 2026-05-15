export default function Button({
  children,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  className = '',
  ...props
}) {
  const base = 'inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF9F43]/50 disabled:cursor-not-allowed disabled:opacity-60';
  const styles = {
    primary: 'bg-gradient-to-r from-[#FF7A00] to-[#FF9F43] text-white shadow-[0_12px_30px_rgba(255,122,0,0.25)] hover:shadow-[0_16px_36px_rgba(255,122,0,0.35)] hover:scale-[1.01]',
    outline: 'border border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:text-orange-600',
  };

  return (
    <button
      className={`${base} ${styles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/80 border-t-transparent" />
      )}
      {children}
    </button>
  );
}
