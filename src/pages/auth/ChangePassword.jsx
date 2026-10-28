import { useState } from 'react';
import { sdk } from '@/services/sdk';
import ApperIcon from '@/components/ApperIcon';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import ProviderAuthPage from './ProviderAuthPage';

export const route = {
  path: '/change-password',
  layout: 'owner',
  access: 'authenticated',
};

export default function ChangePassword() {
  const hasUI = Boolean(sdk.session.ui);

  if (hasUI) {
    return (
      <ProviderAuthPage
        targetId="change-password-target"
        mount={(t) => sdk.session.ui.showChangePassword(t)}
      />
    );
  }

  return <HeadlessChangePassword />;
}

function HeadlessChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      const result = await sdk.session.changePassword({ currentPassword, newPassword, confirmPassword });
      if (result.ok) {
        setDone(true);
      } else {
        setError(result.error?.message || 'Failed to change password');
      }
    } catch (err) {
      setError(err?.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-[440px] mx-auto py-8">
        <div className="glass-card relative overflow-hidden rounded-3xl border border-white/15 dark:border-white/10 bg-card/75 backdrop-blur-2xl p-6 sm:p-9 shadow-xl text-center space-y-4">
          <div className="size-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mx-auto text-emerald-400 shadow-sm">
            <ApperIcon name="CheckCircle2" size={28} />
          </div>
          <div className="space-y-1">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Password updated</h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Your account password has been changed successfully. You can now use your new password across your devices.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[440px] mx-auto py-8">
      <div className="glass-card relative overflow-hidden rounded-3xl border border-white/15 dark:border-white/10 bg-card/75 backdrop-blur-2xl p-6 sm:p-9 shadow-xl">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-emerald-400 to-sky-400" />

        <div className="flex flex-col items-center text-center mb-7">
          <div className="brand-mark size-13 rounded-2xl shadow-lg shadow-primary/25 mb-3 flex items-center justify-center">
            <ApperIcon name="Lock" size={24} className="text-white" />
          </div>
          <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary/90 mb-1">
            Security Settings
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Change password
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
            Update your current credentials to keep your account safe.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <PasswordField
            id="currentPassword"
            label="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            show={showCurrent}
            onToggle={() => setShowCurrent(!showCurrent)}
            autoFocus
          />
          <PasswordField
            id="newPassword"
            label="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            show={showNew}
            onToggle={() => setShowNew(!showNew)}
          />
          <PasswordField
            id="confirmPassword"
            label="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            show={showConfirm}
            onToggle={() => setShowConfirm(!showConfirm)}
          />

          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium"
            >
              <ApperIcon name="AlertCircle" size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full min-h-[44px] h-11 rounded-xl bg-primary text-primary-foreground font-semibold shadow-md hover:bg-primary/90 disabled:opacity-60 transition-all"
            >
              {loading ? (
                <>
                  <ApperIcon name="Loader2" size={16} className="animate-spin mr-2" />
                  Updating password…
                </>
              ) : (
                'Update password'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PasswordField({ id, label, value, onChange, show, onToggle, autoFocus }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold text-foreground/90">{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          required
          autoFocus={autoFocus}
          className="min-h-[44px] h-11 rounded-xl border-border/60 bg-card/60 backdrop-blur-md focus-visible:ring-primary text-sm pr-11"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute inset-y-0 right-0 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
        >
          <ApperIcon name={show ? 'EyeOff' : 'Eye'} size={17} />
        </button>
      </div>
    </div>
  );
}
