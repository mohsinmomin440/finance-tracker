import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { sdk } from '@/services/sdk';
import ApperIcon from '@/components/ApperIcon';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import ProviderAuthPage from './ProviderAuthPage';
import AuthLayout from './AuthLayout';

export default function ResetPassword() {
  const hasUI = Boolean(sdk.session.ui);

  if (hasUI) {
    return (
      <ProviderAuthPage
        title="Reset Password"
        description="Set your new password below"
        targetId="reset-target"
        mount={(t) => sdk.session.ui?.showResetPassword?.(t)}
      />
    );
  }

  return <HeadlessResetPassword />;
}

function HeadlessResetPassword() {
  const { fields, token: paramToken } = useParams();
  const [params] = useSearchParams();
  const token = params.get('token') || paramToken || fields || '';

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      const result = await sdk.session.resetPassword({ token, newPassword: password });
      if (result.ok) {
        setDone(true);
      } else {
        setError(result.error?.message || 'Reset failed');
      }
    } catch (err) {
      setError(err?.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <AuthLayout title="Password reset" icon="CheckCircle">
        <div className="rounded-2xl border border-white/10 dark:border-white/5 bg-card/50 p-6 text-center space-y-4">
          <div className="size-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mx-auto text-emerald-400 shadow-sm">
            <ApperIcon name="CheckCircle2" size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-base font-semibold text-foreground">Password updated</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Your password has been successfully reset. You can now use your new credentials to sign in.
            </p>
          </div>
          <Button asChild className="w-full min-h-[44px] h-11 rounded-xl bg-primary text-primary-foreground font-semibold shadow-md hover:bg-primary/90 mt-2">
            <Link to="/login">Sign in now</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset password"
      description="Choose a strong, unique password to secure your account."
      icon="KeyRound"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-semibold text-foreground/90">New password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              className="min-h-[44px] h-11 rounded-xl border-border/60 bg-card/60 backdrop-blur-md focus-visible:ring-primary text-sm pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
            >
              <ApperIcon name={showPassword ? 'EyeOff' : 'Eye'} size={17} />
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-xs font-semibold text-foreground/90">Confirm new password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="min-h-[44px] h-11 rounded-xl border-border/60 bg-card/60 backdrop-blur-md focus-visible:ring-primary text-sm pr-11"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'Hide password confirmation' : 'Show password confirmation'}
              className="absolute inset-y-0 right-0 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
            >
              <ApperIcon name={showConfirmPassword ? 'EyeOff' : 'Eye'} size={17} />
            </button>
          </div>
        </div>

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
                Resetting…
              </>
            ) : (
              'Reset password'
            )}
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}
