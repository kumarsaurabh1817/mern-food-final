import { Zap, Bike, MapPin, ShieldCheck } from 'lucide-react';

const defaultFeatures = [
  { title: 'Fast Delivery', desc: 'Hot meals at your door in minutes.', icon: Bike },
  { title: 'Real-time Tracking', desc: 'Live order updates from kitchen to you.', icon: MapPin },
  { title: 'Secure Payments', desc: 'Protected checkout and verified partners.', icon: ShieldCheck },
];

export default function AuthLayout({
  children,
  tagline = 'Food delivery made effortless',
  heading = 'Orange Bite',
  features = defaultFeatures,
}) {
  return (
    <div className="h-screen overflow-hidden bg-[#F5F7FA]">
      <div className="grid h-screen w-full grid-cols-1 lg:grid-cols-2">
        <section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#1E3A5F] via-[#1B3354] to-[#142C47] p-8 text-white lg:flex animate-slide-in-left">
          <div className="pointer-events-none absolute -top-16 -right-24 h-64 w-64 rounded-full bg-[#FF9F43]/25 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-8 h-40 w-40 rounded-full bg-[#FF7A00]/20 blur-3xl" />

          <div className="text-center">
            <div className="flex items-center justify-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#FF9F43] shadow-[0_10px_30px_rgba(255,122,0,0.35)]">
                <Zap size={22} className="text-white" />
              </div>
              <div>
                <p className="text-xl font-extrabold tracking-tight" style={{ color: '#FF7A00' }}>{heading}</p>
                <p className="text-sm text-white/70">{tagline}</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <h2 className="text-2xl font-extrabold leading-tight" style={{ color: '#FFFFFF' }}>
                Your control center for fast, reliable food delivery.
              </h2>
              <p className="mx-auto max-w-md text-sm text-white/70">
                Manage orders, track deliveries, and keep customers happy with a clean, modern experience that matches your dashboard.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {features.map((feature) => (
              <div key={feature.title} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                  <feature.icon size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{feature.title}</p>
                  <p className="text-xs text-white/70">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center bg-[#F5F7FA] p-6 lg:p-8">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.12)] animate-fade-in">
            <div className="mb-5 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#FF9F43]">
                <Zap size={20} className="text-white" />
              </div>
              <div>
                <p className="text-lg font-bold" style={{ color: '#FF7A00' }}>{heading}</p>
                <p className="text-xs text-slate-500">{tagline}</p>
              </div>
            </div>
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}
