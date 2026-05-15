import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useEffect, useRef } from 'react';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { user } = useSelector(s => s.auth);
  const plateRef = useRef(null);
  const bowlRef = useRef(null);

  // Subtle floating animation via JS (no external lib needed)
  useEffect(() => {
    let frame;
    let t = 0;
    const animate = () => {
      t += 0.02;
      if (plateRef.current) {
        plateRef.current.style.transform = `translateY(${Math.sin(t) * 8}px) rotate(${Math.sin(t * 0.7) * 3}deg)`;
      }
      if (bowlRef.current) {
        bowlRef.current.style.transform = `translateY(${Math.sin(t + 1.5) * 6}px) rotate(${Math.cos(t * 0.5) * 2}deg)`;
      }
      frame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleHome = () => {
    if (!user) { navigate('/login'); return; }
    if (user.role === 'admin') navigate('/admin');
    else if (user.role === 'owner') navigate('/owner');
    else if (user.role === 'delivery_boy') navigate('/delivery');
    else navigate('/');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #FFF7F0 0%, #F5F7FA 50%, #EFF6FF 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Background blobs */}
      <div style={{
        position: 'absolute', top: '-120px', right: '-120px',
        width: 400, height: 400, borderRadius: '50%',
        background: 'rgba(255, 122, 0, 0.07)',
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-100px', left: '-100px',
        width: 350, height: 350, borderRadius: '50%',
        background: 'rgba(30, 58, 95, 0.06)',
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      {/* Main card */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 28,
        boxShadow: '0 8px 60px rgba(0,0,0,0.08)',
        padding: '56px 48px',
        maxWidth: 520,
        width: '100%',
        textAlign: 'center',
        position: 'relative',
        border: '1px solid rgba(229,231,235,0.8)',
      }}>

        {/* Floating emoji illustrations */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 32 }}>
          <span
            ref={plateRef}
            style={{ fontSize: 64, display: 'inline-block', transition: 'transform 0.05s linear', userSelect: 'none' }}
            aria-hidden="true"
          >
            🍽️
          </span>
          <span
            ref={bowlRef}
            style={{ fontSize: 56, display: 'inline-block', transition: 'transform 0.05s linear', userSelect: 'none', alignSelf: 'flex-end' }}
            aria-hidden="true"
          >
            🍜
          </span>
        </div>

        {/* 404 number */}
        <div style={{
          fontSize: 96,
          fontWeight: 900,
          letterSpacing: '-4px',
          lineHeight: 1,
          marginBottom: 8,
          background: 'linear-gradient(135deg, #FF7A00 0%, #E06800 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          404
        </div>

        {/* Divider with fork & knife */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0 24px' }}>
          <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
          <span style={{ fontSize: 18, userSelect: 'none' }} aria-hidden="true">🍴</span>
          <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
        </div>

        <h1 style={{
          fontSize: 22,
          fontWeight: 800,
          color: '#1A1A1A',
          margin: '0 0 10px',
          letterSpacing: '-0.5px',
        }}>
          Page Not Found
        </h1>

        <p style={{
          fontSize: 15,
          color: '#6B7280',
          fontWeight: 500,
          margin: '0 0 36px',
          lineHeight: 1.6,
          maxWidth: 340,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}>
          Looks like this page got lost in the kitchen.
          Let's get you back to something delicious.
        </p>

        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleHome}
            style={{
              padding: '13px 28px',
              background: 'linear-gradient(135deg, #FF7A00 0%, #E06800 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              letterSpacing: '0.3px',
              boxShadow: '0 4px 16px rgba(255,122,0,0.3)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 22px rgba(255,122,0,0.4)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,122,0,0.3)';
            }}
          >
            🏠 Go Home
          </button>

          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '13px 28px',
              background: 'transparent',
              color: '#374151',
              border: '1.5px solid #E5E7EB',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              letterSpacing: '0.3px',
              transition: 'border-color 0.15s ease, color 0.15s ease, transform 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#FF7A00';
              e.currentTarget.style.color = '#FF7A00';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#E5E7EB';
              e.currentTarget.style.color = '#374151';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            ← Go Back
          </button>
        </div>

        {/* Error code tag */}
        <div style={{
          marginTop: 40,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          background: '#F9FAFB',
          border: '1px solid #E5E7EB',
          borderRadius: 100,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
            Error 404 · Page Not Found
          </span>
        </div>
      </div>

      {/* Orange Bite branding at bottom */}
      <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 20 }} aria-hidden="true">🍊</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: '#FF7A00', letterSpacing: '-0.3px' }}>
          Orange Bite
        </span>
      </div>
    </div>
  );
}
