/**
 * useRazorpay — loads the Razorpay checkout script on demand and
 * exposes an openCheckout() helper that handles the full payment flow.
 *
 * Usage:
 *   const { openCheckout, loading, error } = useRazorpay();
 *   await openCheckout({ orderId, amount, currency, name, description, prefill, onSuccess, onDismiss });
 */
import { useState, useCallback } from 'react';

const RAZORPAY_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';

function loadScript(src) {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = src;
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function useRazorpay() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const openCheckout = useCallback(async ({
    rzpOrderId,
    amount,
    currency = 'INR',
    name = 'Orange Bite',
    description = 'Food Order Payment',
    prefill = {},
    onSuccess,
    onDismiss,
    onFailure,  // NEW: called with error when payment.failed fires
  }) => {
    setLoading(true);
    setError(null);

    const loaded = await loadScript(RAZORPAY_SCRIPT);
    if (!loaded) {
      const msg = 'Failed to load Razorpay SDK. Check your internet connection.';
      setError(msg);
      setLoading(false);
      throw new Error(msg);
    }

    const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!keyId || keyId === 'rzp_test_REPLACE_ME') {
      const msg = 'Razorpay Key ID not configured. Set VITE_RAZORPAY_KEY_ID in Frontend/.env';
      setError(msg);
      setLoading(false);
      throw new Error(msg);
    }

    return new Promise((resolve, reject) => {
      const options = {
        key: keyId,
        amount,
        currency,
        name,
        description,
        image: '/logo.png',
        order_id: rzpOrderId,
        prefill: {
          name:    prefill.name    || '',
          email:   prefill.email   || '',
          contact: prefill.contact || '',
        },
        theme: { color: '#FF7A00' },
        modal: {
          ondismiss() {
            setLoading(false);
            onDismiss?.();
            resolve(null);
          },
        },
        handler(response) {
          setLoading(false);
          onSuccess?.(response);
          resolve(response);
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => {
        setLoading(false);
        const msg = resp.error?.description || 'Payment failed';
        setError(msg);
        onFailure?.(msg);   // let caller cancel the DB order
        reject(new Error(msg));
      });
      rzp.open();
    });
  }, []);

  return { openCheckout, loading, error };
}
