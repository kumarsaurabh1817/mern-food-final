import { useEffect, useState } from 'react';
import { getSocket } from '../../lib/socket';

// A tiny "live" indicator that reflects the shared socket's connection state.
// Green pulsing = connected/live; gray = reconnecting. Drop it into any header
// to signal that the page updates in real time.
export default function LiveDot({ label = 'Live', className = '' }) {
  const [connected, setConnected] = useState(() => getSocket().connected);

  useEffect(() => {
    const socket = getSocket();
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    setConnected(socket.connected);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${
        connected ? 'text-green-600' : 'text-gray-400'
      } ${className}`}
    >
      <span className="relative flex h-2 w-2">
        {connected && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
        )}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${
            connected ? 'bg-green-500' : 'bg-gray-300'
          }`}
        />
      </span>
      {connected ? label : 'Connecting…'}
    </span>
  );
}
