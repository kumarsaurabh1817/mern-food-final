import { useState, useEffect } from 'react';

const RAZORPAY_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';

export function useRazorpay() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (window.Razorpay) { setLoaded(true); return; }
    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT;
    script.onload = () => setLoaded(true);
    script.onerror = () => setLoaded(false);
    document.body.appendChild(script);
    return () => { if (document.body.contains(script)) document.body.removeChild(script); };
  }, []);

  const openRazorpay = (options) => {
    if (!window.Razorpay) { alert('Razorpay SDK not loaded'); return; }
    const rzp = new window.Razorpay(options);
    rzp.open();
    return rzp;
  };

  return { loaded, openRazorpay };
}
