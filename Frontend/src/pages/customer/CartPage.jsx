import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight, UtensilsCrossed } from 'lucide-react';
import { selectCartItems, selectCartTotal, selectCartShopName, selectCartShopId, removeItem, addItemSafe } from '../../features/cart/cartSlice';

export default function CartPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const items = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal);
  const shopName = useSelector(selectCartShopName);
  const shopId = useSelector(selectCartShopId);

  const platformFee = Math.round(total * 0.1);
  const deliveryCharge = total > 0 ? 5 : 0;
  const grandTotal = total + platformFee + deliveryCharge;

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <ShoppingCart className="w-10 h-10 text-orange-300" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
        <p className="text-gray-400 text-sm mb-6">Add some delicious items from a restaurant</p>
        <button onClick={() => navigate('/restaurants')} className="bg-orange-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition-colors">
          Browse Restaurants
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-black text-gray-900 mb-2">Your Cart</h1>
      {shopName && (
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <UtensilsCrossed className="w-4 h-4 text-orange-400" />
          <span>From <strong className="text-gray-700">{shopName}</strong></span>
        </div>
      )}

      <div className="space-y-3 mb-6">
        {items.map((item) => (
          <div key={item._id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm">
            {item.image && <img src={item.image} alt={item.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
              <p className="text-orange-500 font-bold text-sm mt-0.5">₹{item.price}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => dispatch(removeItem(item._id))}
                className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:border-orange-400 hover:text-orange-500 transition-colors"
              >
                {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
              </button>
              <span className="w-8 text-center font-bold text-gray-900">{item.quantity}</span>
              <button
                onClick={() => dispatch(addItemSafe({ item, shopId, shopName }))}
                className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center text-white hover:bg-orange-600 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="font-bold text-gray-900 w-16 text-right">₹{item.price * item.quantity}</p>
          </div>
        ))}
      </div>

      {/* Bill summary */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-6">
        <h3 className="font-bold text-gray-900 mb-4">Bill Details</h3>
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹{total}</span></div>
          <div className="flex justify-between text-gray-600"><span>Platform fee</span><span>₹{platformFee}</span></div>
          <div className="flex justify-between text-gray-600"><span>Delivery charge</span><span>₹{deliveryCharge}</span></div>
          <hr className="border-gray-100" />
          <div className="flex justify-between font-bold text-gray-900 text-base"><span>Total</span><span>₹{grandTotal}</span></div>
        </div>
      </div>

      <button
        onClick={() => navigate('/checkout')}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-base transition-colors shadow-lg shadow-orange-200"
      >
        Proceed to Checkout <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
}
