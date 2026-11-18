import { useEffect, useRef, useState } from 'react';
export function Timer({ expiresAt, serverNow, onExpire }) {
  const deadline = useRef(Date.now() + new Date(expiresAt).getTime() - new Date(serverNow).getTime());
  const [seconds,setSeconds] = useState(() => Math.max(0, Math.ceil((deadline.current-Date.now())/1000)));
  const fired = useRef(false); const callback = useRef(onExpire); callback.current = onExpire;
  useEffect(() => {
    const tick = () => {
      const value = Math.max(0, Math.ceil((deadline.current-Date.now())/1000)); setSeconds(value);
      if (!value && !fired.current) { fired.current = true; callback.current(); }
    };
    tick(); const timer = setInterval(tick,1000); return () => clearInterval(timer);
  }, []);
  return <div className={'exam-timer '+(seconds < 60 ? 'urgent' : '')} role="timer" aria-label="Time remaining"><span>TIME LEFT</span><strong>{String(Math.floor(seconds/3600)).padStart(2,'0')}:{String(Math.floor(seconds/60)%60).padStart(2,'0')}:{String(seconds%60).padStart(2,'0')}</strong></div>;
}
