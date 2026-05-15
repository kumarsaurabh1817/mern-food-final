import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { hideToast } from '../../features/ui/uiSlice';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

// ─── Per-type design tokens ───────────────────────────────────────────────────
const TYPES = {
  success: {
    Icon: CheckCircle2,
    iconColor: '#16A34A',
    iconBg: '#DCFCE7',
    bg: '#F0FDF4',
    border: '#86EFAC',
    bar: '#16A34A',
    label: 'Success',
    labelColor: '#15803D',
  },
  error: {
    Icon: XCircle,
    iconColor: '#DC2626',
    iconBg: '#FEE2E2',
    bg: '#FEF2F2',
    border: '#FCA5A5',
    bar: '#DC2626',
    label: 'Error',
    labelColor: '#B91C1C',
  },
  info: {
    Icon: Info,
    iconColor: '#2563EB',
    iconBg: '#DBEAFE',
    bg: '#EFF6FF',
    border: '#93C5FD',
    bar: '#2563EB',
    label: 'Info',
    labelColor: '#1D4ED8',
  },
  warning: {
    Icon: AlertCircle,
    iconColor: '#D97706',
    iconBg: '#FEF3C7',
    bg: '#FFFBEB',
    border: '#FCD34D',
    bar: '#D97706',
    label: 'Warning',
    labelColor: '#B45309',
  },
};

const DURATION = 3800; // ms

export default function Toast() {
  const dispatch = useDispatch();
  const toast = useSelector(s => s.ui.toast);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!toast) return;
    // Small delay so the enter animation is visible
    const enterTimer = setTimeout(() => setVisible(true), 20);
    const exitTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => dispatch(hideToast()), 320);
    }, DURATION);
    return () => { clearTimeout(enterTimer); clearTimeout(exitTimer); };
  }, [toast, dispatch]);

  if (!toast) return null;

  const type = toast.type && TYPES[toast.type] ? toast.type : 'info';
  const cfg = TYPES[type];
  const { Icon } = cfg;

  const dismiss = () => {
    setVisible(false);
    setTimeout(() => dispatch(hideToast()), 320);
  };

  return (
    <>
      {/* ── Toast container ── */}
      <div
        role="alert"
        aria-live="assertive"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 99999,
          width: '340px',
          maxWidth: 'calc(100vw - 48px)',
          borderRadius: '18px',
          background: cfg.bg,
          border: `1.5px solid ${cfg.border}`,
          boxShadow: `0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)`,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          overflow: 'hidden',
          /* Slide-up from bottom-right */
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
          transition: 'opacity 0.3s cubic-bezier(0.16,1,0.3,1), transform 0.3s cubic-bezier(0.16,1,0.3,1)',
          pointerEvents: visible ? 'auto' : 'none',
        }}
      >
        {/* Body */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px 14px 14px 16px' }}>
          {/* Icon circle */}
          <div style={{
            width: '38px', height: '38px', borderRadius: '12px', flexShrink: 0,
            background: cfg.iconBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={20} color={cfg.iconColor} strokeWidth={2.2} />
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0, paddingTop: '1px' }}>
            <p style={{
              margin: '0 0 3px', fontSize: '11px', fontWeight: 800,
              color: cfg.labelColor, textTransform: 'uppercase', letterSpacing: '0.07em',
            }}>
              {cfg.label}
            </p>
            <p style={{
              margin: 0, fontSize: '13px', fontWeight: 600,
              color: '#1A1A1A', lineHeight: 1.5,
              wordBreak: 'break-word',
            }}>
              {toast.message}
            </p>
          </div>

          {/* Dismiss button */}
          <button
            onClick={dismiss}
            style={{
              flexShrink: 0, marginTop: '1px',
              width: '26px', height: '26px', borderRadius: '8px',
              background: 'transparent', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#9CA3AF', transition: 'all 0.18s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.07)'; e.currentTarget.style.color = '#374151'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}
            aria-label="Dismiss"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ height: '3px', background: `${cfg.bar}28` }}>
          <div style={{
            height: '100%',
            background: `linear-gradient(90deg, ${cfg.bar}99, ${cfg.bar})`,
            borderRadius: '0 0 0 0',
            animation: visible ? `toast-shrink ${DURATION}ms linear forwards` : 'none',
          }} />
        </div>
      </div>

      <style>{`
        @keyframes toast-shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </>
  );
}
