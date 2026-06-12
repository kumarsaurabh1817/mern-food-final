import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../features/auth/authSlice';
import { Home, UtensilsCrossed } from 'lucide-react';

const ROLE_HOME = { user: '/', owner: '/owner', delivery_boy: '/delivery', admin: '/admin' };

export default function NotFoundPage() {
  const user = useSelector(selectUser);
  const homeLink = ROLE_HOME[user?.role] || '/';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <UtensilsCrossed className="w-12 h-12 text-orange-400" />
        </div>
        <h1 className="text-8xl font-black text-orange-500 mb-2">404</h1>
        <h2 className="text-2xl font-bold text-gray-800 mb-3">Page not found</h2>
        <p className="text-gray-400 mb-8 max-w-sm mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to={homeLink}
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          <Home className="w-4 h-4" /> Go Home
        </Link>
      </div>
    </div>
  );
}
