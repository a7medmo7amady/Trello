import { memo } from 'react';
import { useOfflineSync } from '../hooks/useOfflineSync';

const Header = () => {
  const { isOnline, isSyncing, pendingChanges, lastSyncedAt } = useOfflineSync();

  const getSyncStatus = () => {
    if (!isOnline) {
      return { text: 'Offline', className: 'bg-red-500/20 text-red-400' };
    }
    if (isSyncing) {
      return { text: 'Syncing...', className: 'bg-amber-500/20 text-amber-400' };
    }
    if (pendingChanges > 0) {
      return { text: `${pendingChanges} pending`, className: 'bg-amber-500/20 text-amber-400' };
    }
    return { text: 'Synced', className: 'bg-green-500/20 text-green-400' };
  };

  const syncStatus = getSyncStatus();

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-neutral-950/90 backdrop-blur-sm border-b border-white/5">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <svg
            className="w-8 h-8 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="9" strokeWidth={2} />
            <circle cx="12" cy="12" r="3" strokeWidth={2} />
            <path strokeLinecap="round" strokeWidth={2} d="M12 3v3M12 18v3M3 12h3M18 12h3" />
          </svg>
          <h1 className="text-xl font-bold text-white">Reinvent the Wheel</h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${syncStatus.className}`}
          role="status"
          aria-live="polite"
        >
          {isSyncing ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : isOnline ? (
            <span className="w-2 h-2 rounded-full bg-current" />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636a9 9 0 010 12.728m-2.829-2.829a5 5 0 000-7.07m-4.243 4.243a1 1 0 11-1.414-1.414"
              />
            </svg>
          )}
          <span>{syncStatus.text}</span>
        </div>

        {lastSyncedAt && (
          <span className="text-xs text-gray-500 hidden sm:block">
            Last synced: {new Date(lastSyncedAt).toLocaleTimeString()}
          </span>
        )}
      </div>
    </header>
  );
};

export default memo(Header);
