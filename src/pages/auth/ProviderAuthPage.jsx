import { useEffect } from 'react';
import { sdk } from '@/services/sdk';
import ApperIcon from '@/components/ApperIcon';

export default function ProviderAuthPage({ title, description, targetId, mount }) {
  useEffect(() => {
    mount(`#${targetId}`);
    return () => { if (document.querySelector(`#${targetId}`)) sdk.session.ui?.showBlank?.(`#${targetId}`); };
  }, [targetId, mount]);

  return (
    <div className="min-h-svh flex flex-col items-center justify-center py-8 px-4 sm:px-6 relative z-10">
      <div className="w-full max-w-[440px] mx-auto">
        <div className="glass-card relative overflow-hidden rounded-3xl border border-white/15 dark:border-white/10 bg-card/75 backdrop-blur-2xl p-6 sm:p-9 shadow-[0_16px_50px_rgba(0,0,0,0.35)]">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-emerald-400 to-sky-400" />

          {/* Header Info */}
          {(title || description) && (
            <div className="flex flex-col items-center text-center mb-6">
              <div className="brand-mark size-13 rounded-2xl shadow-lg shadow-primary/25 mb-3 flex items-center justify-center">
                <ApperIcon name="WalletCards" size={24} className="text-white" />
              </div>
              <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary/90 mb-1">
                Glassflow Finance
              </div>
              {title && (
                <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
                  {title}
                </h1>
              )}
              {description && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 max-w-sm leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          )}

          {/* SDK target container styled cleanly */}
          <div id={targetId} className="min-h-[280px] flex flex-col justify-center" />
        </div>

        {/* Security Badge */}
        <div className="mt-5 text-center flex items-center justify-center gap-2 text-[11px] text-muted-foreground/70">
          <ApperIcon name="ShieldCheck" size={13} className="text-emerald-400/80" />
          <span>Private & encrypted financial workspace</span>
        </div>
      </div>
    </div>
  );
}
