import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { sdk } from '@/services/sdk';
import { setUser } from '@/store/userSlice';
import { GENERIC_AUTH } from '@/config/app.config';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import ApperIcon from '@/components/ApperIcon';
import AuthLayout from './AuthLayout';

export default function EmailVerification() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resent, setResent] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await sdk.session.verifyEmail({ code });
      if (result.ok) {
        const user = await sdk.session.getUser();
        if (user) dispatch(setUser(user));
        navigate(GENERIC_AUTH.redirectAfterAuth);
      } else {
        setError(result.error?.message || 'Verification failed');
      }
    } catch (err) {
      setError(err?.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResent(false);
    const user = sdk.session.user();
    const email = user?.emailAddress || user?.email;
    if (!email) return;
    await sdk.session.resendVerificationCode({ emailAddress: email });
    setResent(true);
  };

  return (
    <AuthLayout
      title="Verify your email"
      description="Enter the 6-digit verification code sent to your email address."
      icon="MailCheck"
    >
      <form onSubmit={handleVerify} className="flex flex-col gap-3.5">
        <div className="space-y-1.5">
          <Label htmlFor="code" className="text-xs font-semibold text-foreground/90">Verification code</Label>
          <Input
            id="code"
            type="text"
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            autoFocus
            className="min-h-[44px] h-12 text-center text-lg tracking-[0.25em] font-mono rounded-xl border-border/60 bg-card/60 backdrop-blur-md focus-visible:ring-primary"
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

        {resent && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium"
          >
            <ApperIcon name="CheckCircle2" size={16} className="shrink-0" />
            <span>A fresh verification code has been sent.</span>
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
                Verifying…
              </>
            ) : (
              'Verify email'
            )}
          </Button>
        </div>
      </form>

      <p className="text-center text-xs text-muted-foreground mt-6 pt-4 border-t border-border/40">
        Didn&apos;t receive the code?{' '}
        <button
          type="button"
          onClick={handleResend}
          className="text-primary font-semibold hover:underline transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm min-h-[44px] py-2 px-1"
        >
          Resend code
        </button>
      </p>
    </AuthLayout>
  );
}
