import { useDispatch, useSelector } from 'react-redux';
import { ShoppingCart, AlertTriangle } from 'lucide-react';
import { selectClearCartModal, hideClearCartModal } from '../../features/ui/uiSlice';
import { clearShopAndAddItem } from '../../features/cart/cartSlice';

export default function ClearCartModal() {
  const dispatch = useDispatch();
  const { visible, pendingItem } = useSelector(selectClearCartModal);

  if (!visible) return null;

  const handleKeep = () => dispatch(hideClearCartModal());
  const handleClear = () => {
    if (pendingItem) dispatch(clearShopAndAddItem(pendingItem));
    dispatch(hideClearCartModal());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-scale-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Start a new order?</h3>
        </div>
        <p className="text-gray-500 text-sm mb-6">
          Your cart has items from a different restaurant. Adding this item will clear your current cart.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleKeep}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
          >
            Keep current
          </button>
          <button
            onClick={handleClear}
            className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white font-semibold text-sm hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            Clear & add
          </button>
        </div>
      </div>
    </div>
  );
}
