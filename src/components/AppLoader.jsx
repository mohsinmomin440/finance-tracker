import { APP_CONFIG } from '@/config/app.config';
import { cn } from '@/lib/utils';
import ApperIcon from '@/components/ApperIcon';

/**
 * The unified Aurora loading screen.
 *   fullScreen — covers the viewport (RootLayout, before the session resolves)
 *   default    — fills the content area inside a layout (route chunks)
 */
export default function AppLoader({ fullScreen = false, label, className }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center gap-4 bg-background text-muted-foreground',
        fullScreen ? 'fixed inset-0 z-50 backdrop-blur-md' : 'min-h-[50vh] w-full',
        className,
      )}
    >
      <div className="relative">
        <div className="brand-mark size-12 rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center">
          <ApperIcon name="WalletCards" size={22} className="text-white" />
        </div>
        <div className="absolute -inset-1.5 rounded-3xl border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
      <div className="flex flex-col items-center text-center">
        <span className="font-display text-sm font-semibold text-foreground tracking-tight">
          {label ?? APP_CONFIG.name}
        </span>
        <span className="text-[11px] text-muted-foreground/70 mt-0.5">
          Loading workspace…
        </span>
      </div>
    </div>
  );
}
