import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-24 left-6 z-50 flex items-center gap-3 rounded-2xl bg-amber-500 p-4 text-xs font-bold text-white shadow-2xl animate-bounce">
      <div className="p-2 rounded-full bg-white/20">
        <WifiOff className="w-4 h-4" />
      </div>
      <div>
        <p className="block">Network Disconnected</p>
        <p className="text-[10px] opacity-90 font-medium">Using cached healthcare data</p>
      </div>
    </div>
  );
};
