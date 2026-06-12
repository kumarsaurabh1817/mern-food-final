import { UtensilsCrossed } from 'lucide-react';

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-10">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: `${Math.random() * 80 + 20}px`,
                height: `${Math.random() * 80 + 20}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.5 + 0.1,
              }}
            />
          ))}
        </div>
        <div className="relative z-10 text-center text-white">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
              <UtensilsCrossed className="w-9 h-9 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-black mb-4 tracking-tight">OrangeBite</h1>
          <p className="text-xl text-orange-100 font-medium max-w-xs mx-auto leading-relaxed">
            Delicious food from your favourite restaurants, delivered fast
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6 text-center">
            {[['500+', 'Restaurants'], ['50k+', 'Happy Customers'], ['30 min', 'Avg Delivery']].map(([val, label]) => (
              <div key={label} className="bg-white/10 backdrop-blur rounded-xl p-4">
                <div className="text-2xl font-black">{val}</div>
                <div className="text-xs text-orange-200 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-black text-orange-500">OrangeBite</span>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            {title && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                {subtitle && <p className="text-gray-500 mt-1 text-sm">{subtitle}</p>}
              </div>
            )}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
