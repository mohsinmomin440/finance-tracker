import { useState } from 'react';
import { Link } from 'react-router-dom';
import { sdk } from '@/services/sdk';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import ApperIcon from '@/components/ApperIcon';
import ProviderAuthPage from './ProviderAuthPage';
import AuthLayout from './AuthLayout';

export default function ForgotPassword() {
  const hasUI = Boolean(sdk.session.ui);

  if (hasUI) {
    return (
      <ProviderAuthPage
        targetId="forgot-password-target"
        mount={(t) => sdk.session.ui.showLogin(t)}
      />
    );
  }

  return <HeadlessForgotPassword />;
}

function HeadlessForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await sdk.session.sendResetLink({ email });
      if (result.ok) {
        setSent(true);
      } else {
        setError(result.error?.message || 'Failed to send reset link');
      }
    } catch (err) {
      setError(err?.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout title="Check your email" icon="Mail">
        <div className="rounded-2xl border border-white/10 dark:border-white/5 bg-card/50 p-6 text-center space-y-4">
          <div className="size-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mx-auto text-emerald-400 shadow-sm">
            <ApperIcon name="CheckCircle2" size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-base font-semibold text-foreground">Instructions sent</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              If an account exists for <strong className="text-foreground">{email}</strong>, you will receive a password reset link shortly.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild className="min-h-[44px] rounded-xl border-white/15 dark:border-white/10 hover:border-primary/40 font-semibold w-full">
            <Link to="/login">
              <ApperIcon name="ArrowLeft" size={15} className="mr-2" />
              Back to sign in
            </Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot password?"
      description="Enter your registered email address and we will send you a password recovery link."
      icon="KeyRound"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-semibold text-foreground/90">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            className="min-h-[44px] h-11 rounded-xl border-border/60 bg-card/60 backdrop-blur-md focus-visible:ring-primary text-sm"
          />
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
                Sending link…
              </>
            ) : (
              'Send reset link'
            )}
          </Button>
        </div>
      </form>

      <p className="text-center text-xs text-muted-foreground mt-6 pt-4 border-t border-border/40">
        Remember your password?{' '}
        <Link
          to="/login"
          className="text-primary font-semibold hover:underline transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
