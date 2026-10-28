import { useEffect } from 'react';
import { sdk } from '@/services/sdk';
import ApperIcon from '@/components/ApperIcon';

export default function Callback() {
  useEffect(() => {
    sdk.session.ui?.showSSOVerify?.('#callback-target');
    return () => sdk.session.ui?.showBlank?.('#callback-target');
  }, []);

  return (
    <div className="min-h-svh flex items-center justify-center bg-background relative z-10 px-4">
      <div className="glass-card rounded-3xl border border-white/15 dark:border-white/10 bg-card/75 backdrop-blur-2xl p-8 sm:p-10 shadow-2xl flex flex-col items-center text-center max-w-sm w-full space-y-4">
        <div className="relative">
          <div className="brand-mark size-14 rounded-2xl shadow-lg shadow-primary/25 flex items-center justify-center">
            <ApperIcon name="WalletCards" size={26} className="text-white" />
          </div>
          <div className="absolute -inset-1.5 rounded-3xl border-2 border-primary/30 border-t-primary animate-spin" />
        </div>
        <div className="space-y-1">
          <h2 className="font-display text-lg font-bold text-foreground">Authenticating session</h2>
          <p className="text-xs text-muted-foreground">Verifying your credentials and securing your workspace…</p>
        </div>
      </div>
      <div id="callback-target" />
    </div>
  );
}
