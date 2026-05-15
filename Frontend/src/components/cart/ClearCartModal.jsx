import { useDispatch, useSelector } from 'react-redux';
import { hideClearCartModal } from '../../features/ui/uiSlice';
import { clearShopAndAddItem } from '../../features/cart/cartSlice';
import { ShoppingCart, X } from 'lucide-react';

export default function ClearCartModal() {
  const dispatch = useDispatch();
  const modal = useSelector(s => s.ui.clearCartModal);

  if (!modal) return null;

  const handleConfirm = () => {
    dispatch(clearShopAndAddItem(modal));
    dispatch(hideClearCartModal());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <ShoppingCart size={18} className="text-orange-500" />
          </div>
          <h3 className="font-semibold text-gray-900">Clear Cart?</h3>
          <button onClick={() => dispatch(hideClearCartModal())} className="ml-auto text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Your cart has items from <strong>{modal.shopName}</strong>. Adding this item will clear your current cart.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => dispatch(hideClearCartModal())}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Keep Cart
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors"
          >
            Start New
          </button>
        </div>
      </div>
    </div>
  );
}
