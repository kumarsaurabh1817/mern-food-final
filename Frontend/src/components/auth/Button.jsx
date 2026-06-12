import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm shadow-orange-200 hover:shadow-orange-300',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 border border-gray-200',
  danger: 'bg-red-500 hover:bg-red-600 text-white shadow-sm shadow-red-200',
  outline: 'bg-transparent border border-orange-500 text-orange-500 hover:bg-orange-50',
};

export default function Button({ children, variant = 'primary', loading = false, className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
