import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { selectToast, hideToast } from '../../features/ui/uiSlice';

const configs = {
  success: { icon: CheckCircle, bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', icon_color: 'text-emerald-500' },
  error:   { icon: XCircle,     bg: 'bg-red-50 border-red-200',         text: 'text-red-800',     icon_color: 'text-red-500' },
  info:    { icon: Info,         bg: 'bg-blue-50 border-blue-200',       text: 'text-blue-800',    icon_color: 'text-blue-500' },
  warning: { icon: AlertTriangle,bg: 'bg-amber-50 border-amber-200',     text: 'text-amber-800',   icon_color: 'text-amber-500' },
};

export default function Toast() {
  const dispatch = useDispatch();
  const toast = useSelector(selectToast);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => dispatch(hideToast()), toast.duration || 3000);
    return () => clearTimeout(timer);
  }, [toast, dispatch]);

  if (!toast) return null;

  const cfg = configs[toast.type] || configs.info;
  const Icon = cfg.icon;

  return (
    <div className="fixed top-5 right-5 z-[100] max-w-sm animate-slide-in-right">
      <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg ${cfg.bg}`}>
        <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${cfg.icon_color}`} />
        <p className={`text-sm font-medium flex-1 ${cfg.text}`}>{toast.message}</p>
        <button onClick={() => dispatch(hideToast())} className={`flex-shrink-0 ${cfg.icon_color} hover:opacity-70`}>
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
