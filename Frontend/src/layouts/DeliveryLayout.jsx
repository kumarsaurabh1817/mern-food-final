import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { UtensilsCrossed, User, LogOut, Bike } from 'lucide-react';
import { selectUser } from '../features/auth/authSlice';
import { signOut } from '../features/auth/authSlice';

export default function DeliveryLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);

  const handleLogout = () => { dispatch(signOut()); navigate('/login'); };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/delivery" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <UtensilsCrossed className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-orange-500 text-lg">OrangeBite</span>
            <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">Delivery</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center">
                <Bike className="w-4 h-4 text-orange-600" />
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:block">{user?.name}</span>
            </div>
            <Link to="/delivery/profile" className="p-2 rounded-xl hover:bg-gray-50">
              <User className="w-5 h-5 text-gray-500" />
            </Link>
            <button onClick={handleLogout} className="p-2 rounded-xl hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
