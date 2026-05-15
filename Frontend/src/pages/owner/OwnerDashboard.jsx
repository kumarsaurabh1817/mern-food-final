import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';
import {
  ShoppingBag, DollarSign, Clock,
  ArrowRight, TrendingUp, TrendingDown,
  CheckCircle, XCircle, Volume2, Activity
} from 'lucide-react';

const C = {
  primary: '#FF7A00', primaryLight: '#FF9F43', primaryGlow: 'rgba(255,122,0,0.12)',
  bg: '#F5F7FA', white: '#FFFFFF', surface: '#F9FAFB',
  border: '#E5E7EB', borderBright: '#D1D5DB',
  text: '#1A1A1A', textSec: '#374151', textMuted: '#6B7280',
  success: '#22C55E', warning: '#F59E0B', error: '#EF4444',
};

const STATUS_CLASS = {
  pending:'status-pending', confirmed:'status-confirmed', preparing:'status-preparing',
  ready_for_pickup:'status-ready_for_pickup', out_for_delivery:'status-out_for_delivery',
  delivered:'status-delivered', cancelled:'status-cancelled',
};

const STATUS_ICON = {
  pending: '+',
  confirmed: '*',
  preparing: '~',
  ready_for_pickup: '>',
  out_for_delivery: '>',
  delivered: 'ok',
  cancelled: 'x',
};

const getStatusLabel = (status) => (status || 'pending').replace(/_/g, ' ');

const formatRelativeTime = (date) => {
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.max(0, Math.floor(diffMs / 60000));
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

function useCountUp(target, duration=1200, decimals=0) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target===null||target===undefined||Number.isNaN(Number(target))) return;
    const t=Number(target); let start=null, rafId=null;
    const step=(ts)=>{
      if(!start) start=ts;
      const p=Math.min((ts-start)/duration,1);
      const f=10**decimals;
      setValue(Math.round(t*p*f)/f);
      if(p<1) rafId=requestAnimationFrame(step);
    };
    rafId=requestAnimationFrame(step);
    return ()=>{ if(rafId) cancelAnimationFrame(rafId); };
  },[target,duration,decimals]);
  return value;
}

function KPICard({icon:Icon,label,value,prefix='',suffix='',delta,deltaUp,bg,decimals=0,liveDot=false,index}) {
  const isNum=typeof value==='number'&&Number.isFinite(value);
  const num=useCountUp(isNum?value:0,1200,decimals);
  const display=isNum?(decimals>0?num.toFixed(decimals):Math.round(num).toLocaleString()):value;
  const showDelta = delta !== undefined && delta !== null;
  return (
    <div className="animate-slide-up" style={{
      animationDelay:`${index*0.08}s`,
      background:C.white, border:`1px solid ${C.border}`,
      borderRadius:'16px', padding:'22px',
      boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
      transition:'all 0.25s ease',
    }}
      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.1)';}}
      onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.06)';}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px'}}>
        <div style={{width:'40px',height:'40px',borderRadius:'12px',background:bg,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <Icon size={18} color={C.primary} />
        </div>
        <span style={{fontSize:'11px',color:C.textMuted,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',display:'flex',alignItems:'center',gap:'6px'}}>
          {label}
          {liveDot&&<span style={{width:'7px',height:'7px',borderRadius:'50%',background:C.primary}} className="animate-pulse-green" />}
        </span>
      </div>
      <p style={{fontSize:'30px',fontWeight:900,color:C.text,margin:'0 0 10px',letterSpacing:'-0.03em'}}>
        {prefix}{display}{suffix}
      </p>
      {showDelta && (
        <div style={{display:'flex',alignItems:'center',gap:'5px'}}>
          {deltaUp ? <TrendingUp size={13} color={C.success} /> : <TrendingDown size={13} color={C.error} />}
          <span style={{fontSize:'12px',fontWeight:700,color:deltaUp?C.success:C.error}}>{delta}</span>
          <span style={{fontSize:'11px',color:C.textMuted}}>vs yesterday</span>
        </div>
      )}
    </div>
  );
}

function OrderCard({order,onAccept,onCancel}) {
  const [accepting,setAccepting]=useState(false);
  const [prepTime,setPrepTime]=useState(15);
  const id=(order._id||order.id||'').slice(-6).toUpperCase();
  const mins=Math.floor((Date.now()-new Date(order.createdAt||order.created_at))/60000);
  const isNew=order.status==='pending'&&mins<=2;
  const items=order.items?.map(i=>`${i.name||i.item?.name||'Item'} ×${i.quantity}`).join(', ')||'Items';
  return (
    <div className={isNew?'animate-slide-in-right glow-border':'animate-slide-up'} style={{
      background:C.white,
      border:`1px solid ${order.status==='pending'?'#FED7AA':C.border}`,
      borderLeft:`3px solid ${order.status==='pending'?C.primary:C.border}`,
      borderRadius:'14px',padding:'16px',marginBottom:'12px',
      boxShadow:'0 1px 4px rgba(0,0,0,0.05)',transition:'all 0.25s ease',
    }}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'12px',flexWrap:'wrap'}}>
        <div>
          <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px'}}>
            <span style={{fontSize:'13px',fontWeight:900,color:C.text,fontFamily:'monospace'}}>#{id}</span>
            <span style={{fontSize:'11px',color:C.textMuted}}>{mins}m ago</span>
            {order.status==='pending'&&<span style={{width:'7px',height:'7px',background:C.primary,borderRadius:'50%'}} className="animate-pulse-green"/>}
            {isNew&&<span style={{position:'relative',display:'inline-flex'}} title="New order"><Volume2 size={14} color={C.primary}/></span>}
          </div>
          <p style={{fontSize:'13px',fontWeight:700,color:C.textSec,margin:'0 0 4px'}}>{order.customer?.name||'Customer'}</p>
          <p style={{fontSize:'11px',color:C.textMuted,margin:0,maxWidth:'260px'}}>{items.length>60?items.slice(0,60)+'…':items}</p>
        </div>
        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'8px'}}>
          <span style={{fontSize:'16px',fontWeight:900,color:C.text}}>₹{(order.totalAmount||order.total_amount||0).toFixed(0)}</span>
          <span className={`${STATUS_CLASS[order.status]||'status-pending'} animate-pop-in`}>{(order.status||'pending').replace(/_/g,' ')}</span>
        </div>
      </div>
      {order.status==='pending'&&(
        <div style={{marginTop:'12px',paddingTop:'12px',borderTop:`1px solid ${C.border}`}}>
          {accepting?(
            <div className="animate-slide-up" style={{display:'flex',alignItems:'center',gap:'10px',flexWrap:'wrap'}}>
              <span style={{fontSize:'12px',color:C.textMuted,fontWeight:600}}>Prep time:</span>
              <input type="number" value={prepTime} onChange={e=>setPrepTime(Number(e.target.value))}
                style={{width:'56px',padding:'6px 8px',background:C.white,border:`1.5px solid ${C.primary}`,borderRadius:'8px',color:C.text,fontFamily:'inherit',fontWeight:700,fontSize:'13px',outline:'none'}}/>
              <span style={{fontSize:'12px',color:C.textMuted,fontWeight:600}}>mins</span>
              <button className="btn-primary" style={{padding:'8px 16px',fontSize:'12px'}} onClick={()=>{onAccept(order,prepTime);setAccepting(false);}}>Confirm</button>
              <button className="btn-ghost" style={{padding:'8px 12px',fontSize:'12px'}} onClick={()=>setAccepting(false)}>Cancel</button>
            </div>
          ):(
            <div style={{display:'flex',gap:'8px'}}>
              <button className="btn-primary" style={{padding:'9px 18px',fontSize:'12px',display:'flex',alignItems:'center',gap:'5px'}} onClick={()=>setAccepting(true)}>
                <CheckCircle size={13}/> Accept
              </button>
              <button className="btn-ghost-danger" style={{padding:'9px 18px',fontSize:'12px',display:'flex',alignItems:'center',gap:'5px'}} onClick={()=>onCancel(order)}>
                <XCircle size={13}/> Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OwnerDashboard() {
  const [shop,setShop]=useState(null);
  const [orders,setOrders]=useState([]);
  const [analytics,setAnalytics]=useState(null);
  const [loading,setLoading]=useState(true);
  const [tooltipDay,setTooltipDay]=useState(null);

  useEffect(()=>{
    (async()=>{
      try{
        const [shopRes, ordersRes, analyticsRes] = await Promise.all([
          api.get('/shops/owner/me'),
          api.get('/orders?limit=50'),
          api.get('/orders/analytics?days=7'),
        ]);

        if(shopRes.data?.success && shopRes.data.shop) {
          setShop(shopRes.data.shop);
        }

        if(ordersRes.data?.success) {
          setOrders(ordersRes.data.orders || []);
        }

        if(analyticsRes.data?.success) {
          setAnalytics(analyticsRes.data.analytics || null);
        }
      }catch(e){console.error(e);}
      finally{setLoading(false);}
    })();
  },[]);

  const handleAccept=async (order, prepTime)=>{
    try {
      await api.patch(`/orders/${order._id||order.id}/confirm`, { preparationTime: prepTime });
      setOrders(prev=>prev.map(o=>(o._id||o.id)===(order._id||order.id)?{...o,status:'confirmed'}:o));
    } catch(e) { console.error('Failed to confirm', e); }
  };
  const handleCancel=async (order)=>{
    if (!window.confirm('Cancel this order?')) return;
    try {
      await api.patch(`/orders/${order._id||order.id}/cancel`);
      setOrders(prev=>prev.map(o=>(o._id||o.id)===(order._id||order.id)?{...o,status:'cancelled'}:o));
    } catch(e) { console.error('Failed to cancel', e); }
  };

  const card={background:C.white,border:`1px solid ${C.border}`,borderRadius:'16px',padding:'22px',boxShadow:'0 1px 4px rgba(0,0,0,0.05)'};

  if(loading) return (
    <div style={{paddingBottom:'40px'}}>
      <div style={{marginBottom:'28px'}}>
        <div className="skeleton" style={{height:'28px',width:'220px',marginBottom:'10px'}}/>
        <div className="skeleton" style={{height:'13px',width:'360px'}}/>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" style={{marginBottom:'28px'}}>
        {[0,1,2,3].map(i=>(
          <div key={i} style={{...card}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'16px'}}>
              <div className="skeleton" style={{width:'40px',height:'40px',borderRadius:'12px'}}/>
              <div className="skeleton" style={{height:'12px',width:'110px',borderRadius:'8px'}}/>
            </div>
            <div className="skeleton" style={{height:'34px',width:'150px',borderRadius:'10px',marginBottom:'12px'}}/>
            <div className="skeleton" style={{height:'12px',width:'130px',borderRadius:'8px'}}/>
          </div>
        ))}
      </div>
    </div>
  );

  if(!shop) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'80px 24px',...card}}>
      <div style={{fontSize:'48px',marginBottom:'16px'}}>🏪</div>
      <h2 style={{fontSize:'24px',fontWeight:800,color:C.text,marginBottom:'8px'}}>No shop yet</h2>
      <p style={{color:C.textMuted,marginBottom:'24px',textAlign:'center',maxWidth:'320px'}}>Create your shop to start receiving orders and growing your business.</p>
      <Link to="/owner/shop" className="btn-primary" style={{textDecoration:'none',display:'flex',alignItems:'center',gap:'8px'}}>
        Set Up Shop <ArrowRight size={16}/>
      </Link>
    </div>
  );

  const pendingOrders=orders.filter(o=>o.status==='pending');
  const otherOrders=orders.filter(o=>o.status!=='pending');
  const sortedOrders=[...pendingOrders,...otherOrders];
  const liveOrders=sortedOrders.slice(0,8);

  const revenueToday = analytics?.revenue?.today || 0;
  const revenueYesterday = analytics?.revenue?.yesterday || 0;
  const ordersTodayCount = analytics?.orders?.today || 0;
  const ordersYesterdayCount = analytics?.orders?.yesterday || 0;
  const pendingCount = analytics?.orders?.pending ?? pendingOrders.length;

  const revenueDeltaPct = revenueYesterday
    ? Math.round(((revenueToday - revenueYesterday) / revenueYesterday) * 100)
    : revenueToday
      ? 100
      : 0;

  const ordersDeltaPct = ordersYesterdayCount
    ? Math.round(((ordersTodayCount - ordersYesterdayCount) / ordersYesterdayCount) * 100)
    : ordersTodayCount
      ? 100
      : 0;

  const kpis=[
    {icon:DollarSign,label:"Today's Revenue",value:revenueToday,prefix:'₹',delta:`${Math.abs(revenueDeltaPct)}%`,deltaUp:revenueDeltaPct>=0,bg:'#FFF7ED'},
    {icon:ShoppingBag,label:'Orders Today',value:ordersTodayCount,delta:`${Math.abs(ordersDeltaPct)}%`,deltaUp:ordersDeltaPct>=0,bg:'#EFF6FF'},
    {icon:Clock,label:'Pending Now',value:pendingCount,delta:null,deltaUp:true,bg:'#FEF3C7',liveDot:pendingCount>0},
  ];

  const delivered = analytics?.statusCounts?.delivered ?? orders.filter(o=>o.status==='delivered').length;
  const pending2 = analytics?.statusCounts?.pending ?? orders.filter(o=>o.status==='pending').length;
  const cancelled = analytics?.statusCounts?.cancelled ?? orders.filter(o=>o.status==='cancelled').length;
  const total2=delivered+pending2+cancelled;
  const pDel=total2?Math.round((delivered/total2)*100):0;
  const pPen=total2?Math.round((pending2/total2)*100):0;
  const pCan=total2?Math.max(0,100-pDel-pPen):0;
  const donut=total2
    ? `conic-gradient(${C.primary} 0% ${pDel}%, ${C.warning} ${pDel}% ${pDel+pPen}%, ${C.error} ${pDel+pPen}% 100%)`
    : `conic-gradient(${C.border} 0% 100%)`;

  const weekData = (analytics?.weekRevenue || []).map(d => ({
    day: d.label || d.date,
    revenue: d.total || 0,
  }));
  const weekTotal = weekData.reduce((sum, d) => sum + d.revenue, 0);
  const maxRev = Math.max(...weekData.map(d => d.revenue), 1);

  const topItems = analytics?.topItems || [];

  const activityItems = (analytics?.activity || []).map(item => {
    const status = item.status || 'pending';
    const icon = STATUS_ICON[status] || '*';
    const shortId = (item.id || '').slice(-6).toUpperCase() || '------';
    const label = getStatusLabel(status);
    const createdAt = item.createdAt ? new Date(item.createdAt) : new Date();
    return {
      icon,
      text: item.customerName
        ? `${item.customerName} - Order #${shortId} ${label}`
        : `Order #${shortId} ${label}`,
      time: formatRelativeTime(createdAt),
    };
  });

  const onlineCount = analytics?.paymentSplit?.online || 0;
  const codCount = analytics?.paymentSplit?.cod || 0;
  const paymentTotal = onlineCount + codCount;
  const onlinePct = paymentTotal ? Math.round((onlineCount / paymentTotal) * 100) : 0;
  const codPct = paymentTotal ? Math.max(0, 100 - onlinePct) : 0;
  const paymentSplit = [
    { label: 'Online', pct: onlinePct, color: C.primary },
    { label: 'Cash on Delivery', pct: codPct, color: C.textSec },
  ];

  return (
    <div style={{paddingBottom:'40px'}}>
      {/* Header */}
      <div className="animate-slide-up" style={{marginBottom:'28px'}}>
        <h1 style={{fontSize:'26px',fontWeight:900,color:C.text,margin:'0 0 4px',letterSpacing:'-0.03em'}}>Control Room</h1>
        <p style={{color:C.textMuted,fontSize:'13px',margin:0}}>
          {shop.name} · {new Date().toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" style={{marginBottom:'28px'}}>
        {kpis.map((kpi,i)=><KPICard key={kpi.label} {...kpi} index={i}/>)}
      </div>

      {/* Middle row */}
      <div style={{display:'grid',gridTemplateColumns:'1fr',gap:'20px',marginBottom:'24px'}} className="owner-mid-grid">

        {/* Live Orders */}
        <div style={card}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'18px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
              <div style={{position:'relative'}}>
                <Activity size={18} color={C.primary}/>
                {pendingOrders.length>0&&<span style={{position:'absolute',top:'-3px',right:'-3px',width:'8px',height:'8px',background:C.primary,borderRadius:'50%'}} className="animate-pulse-green"/>}
              </div>
              <h3 style={{fontSize:'16px',fontWeight:800,color:C.text,margin:0}}>Live Orders</h3>
              <span className="badge">{sortedOrders.length}</span>
            </div>
            <Link to="/owner/orders" style={{color:C.primary,fontSize:'12px',fontWeight:700,textDecoration:'none',display:'flex',alignItems:'center',gap:'4px'}}>
              View all <ArrowRight size={13}/>
            </Link>
          </div>
          {sortedOrders.length===0?(
            <div style={{textAlign:'center',padding:'40px',color:C.textMuted}}>
              <ShoppingBag size={32} style={{marginBottom:'10px',opacity:0.3}}/>
              <p style={{fontWeight:700,fontSize:'13px'}}>No orders yet today</p>
            </div>
          ):(
            <div style={{maxHeight:'420px',overflowY:'auto'}} className="scrollbar-hide">
              {liveOrders.map(order=><OrderCard key={order._id||order.id} order={order} onAccept={handleAccept} onCancel={handleCancel}/>)}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>

          {/* Revenue chart */}
          <div style={card}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'18px'}}>
              <h3 style={{fontSize:'15px',fontWeight:800,color:C.text,margin:0}}>This Week</h3>
              <span style={{fontSize:'14px',fontWeight:800,color:C.primary}}>₹{weekTotal.toLocaleString()}</span>
            </div>
            <div style={{display:'flex',alignItems:'flex-end',gap:'8px',height:'100px'}}>
              {weekData.map((d,i)=>{
                const h=Math.round((d.revenue/maxRev)*100);
                return (
                  <div key={d.day} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'4px',position:'relative'}}
                    onMouseEnter={()=>setTooltipDay(i)} onMouseLeave={()=>setTooltipDay(null)}>
                    {tooltipDay===i&&(
                      <div style={{position:'absolute',top:'-32px',left:'50%',transform:'translateX(-50%)',background:C.white,border:`1px solid ${C.border}`,borderRadius:'8px',padding:'4px 8px',fontSize:'11px',fontWeight:700,color:C.primary,whiteSpace:'nowrap',zIndex:10,boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}>
                        ₹{d.revenue.toLocaleString()}
                      </div>
                    )}
                    <div style={{
                      width:'100%',height:`${h}%`,minHeight:'4px',
                      background:tooltipDay===i?C.primary:'rgba(255,122,0,0.2)',
                      borderRadius:'6px 6px 0 0',
                      border:`1px solid ${tooltipDay===i?C.primary:'rgba(255,122,0,0.35)'}`,
                      transition:'all 0.2s ease',cursor:'pointer',
                    }}/>
                    <span style={{fontSize:'10px',color:C.textMuted,fontWeight:700}}>{d.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity feed */}
          <div style={card}>
            <h3 style={{fontSize:'15px',fontWeight:800,color:C.text,margin:'0 0 14px'}}>Recent Activity</h3>
            {activityItems.length===0?(
              <p style={{fontSize:'12px',color:C.textMuted,fontWeight:600}}>No recent activity yet</p>
            ):(
              activityItems.map((a,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:'12px',padding:'10px 0',borderBottom:i<activityItems.length-1?`1px solid ${C.border}`:'none'}}>
                  <span style={{fontSize:'16px',flexShrink:0}}>{a.icon}</span>
                  <span style={{flex:1,fontSize:'12px',color:C.textSec,fontWeight:600}}>{a.text}</span>
                  <span style={{fontSize:'11px',color:C.textMuted,flexShrink:0}}>{a.time}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Top Items */}
        <div style={card}>
          <h3 style={{fontSize:'15px',fontWeight:800,color:C.text,margin:'0 0 16px'}}>🏆 Top Items This Week</h3>
          {topItems.length===0?(
            <p style={{fontSize:'12px',color:C.textMuted,fontWeight:600}}>No items sold this week yet</p>
          ):(
            topItems.map((item,i)=>(
              <div key={item.name} style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:i<topItems.length-1?'12px':'0'}}>
                <span style={{width:'24px',height:'24px',borderRadius:'50%',flexShrink:0,background:C.surface,border:`1px solid ${C.border}`,color:i===0?C.warning:i===1?C.textMuted:C.primary,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:900}}>#{i+1}</span>
                <span style={{flex:1,fontSize:'13px',color:C.text,fontWeight:700}}>{item.name}</span>
                <span style={{fontSize:'12px',color:C.primary,fontWeight:800}}>{item.count} sold</span>
              </div>
            ))
          )}
        </div>

        {/* Donut */}
        <div style={card}>
          <h3 style={{fontSize:'15px',fontWeight:800,color:C.text,margin:'0 0 16px'}}>📊 Order Status</h3>
          <div style={{display:'flex',alignItems:'center',gap:'20px'}}>
            <div style={{width:'80px',height:'80px',borderRadius:'50%',background:donut,WebkitMask:'radial-gradient(circle at center,transparent 45%,black 46%)',mask:'radial-gradient(circle at center,transparent 45%,black 46%)',flexShrink:0}}/>
            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              {[{label:'Delivered',pct:pDel,color:C.success},{label:'Pending',pct:pPen,color:C.warning},{label:'Cancelled',pct:pCan,color:C.error}].map(s=>(
                <div key={s.label} style={{display:'flex',alignItems:'center',gap:'8px'}}>
                  <span style={{width:'8px',height:'8px',borderRadius:'50%',background:s.color,flexShrink:0}}/>
                  <span style={{fontSize:'12px',color:C.textMuted,fontWeight:600}}>{s.label}</span>
                  <span style={{fontSize:'12px',color:s.color,fontWeight:800}}>{s.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Payment split */}
        <div style={card}>
          <h3 style={{fontSize:'15px',fontWeight:800,color:C.text,margin:'0 0 16px'}}>💳 Payment Split</h3>
          {paymentSplit.map(p=>(
            <div key={p.label} style={{marginBottom:'14px'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'6px'}}>
                <span style={{fontSize:'12px',color:C.textSec,fontWeight:700}}>{p.label}</span>
                <span style={{fontSize:'12px',color:p.color,fontWeight:800}}>{p.pct}%</span>
              </div>
              <div style={{height:'6px',background:C.surface,borderRadius:'100px',overflow:'hidden',border:`1px solid ${C.border}`}}>
                <div style={{height:'100%',width:`${p.pct}%`,background:p.color,borderRadius:'100px',transition:'width 1s ease'}}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media(min-width:1024px){ .owner-mid-grid{grid-template-columns:3fr 2fr !important;} }
      `}</style>
    </div>
  );
}
