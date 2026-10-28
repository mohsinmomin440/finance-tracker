import { useSearchParams, Link } from 'react-router-dom';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ApperIcon from '@/components/ApperIcon';
import AuthLayout from './AuthLayout';

const ERROR_MESSAGES = {
  'invalid-redirectUri': 'The redirect URL is not configured correctly. Please check your OAuth provider settings.',
  'access-denied': 'Access was denied. You may have cancelled the login or lack permission.',
  'invalid-state': 'The authentication session expired. Please try again.',
  'provider-error': 'The login provider encountered an error. Please try again later.',
};

export default function ErrorPage() {
  const [params] = useSearchParams();
  const errorCode = params.get('error');
  const message = params.get('message')
    || ERROR_MESSAGES[errorCode]
    || 'An authentication error occurred. Please try again.';

  return (
    <AuthLayout title="Something went wrong" icon="AlertCircle">
      <div className="text-center space-y-5">
        <div
          role="alert"
          aria-live="assertive"
          className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm font-medium leading-relaxed"
        >
          {message}
        </div>
        {errorCode && (
          <p className="text-xs text-muted-foreground/70 font-mono">
            Error Code: <span className="text-foreground">{errorCode}</span>
          </p>
        )}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          <Link
            to="/login"
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'w-full sm:w-auto min-h-[44px] h-11 rounded-xl border-white/15 dark:border-white/10 hover:border-primary/40 font-semibold inline-flex items-center justify-center gap-2'
            )}
          >
            <ApperIcon name="ArrowLeft" size={16} />
            Back to login
          </Link>
          <Link
            to="/"
            className={cn(
              buttonVariants({ variant: 'ghost' }),
              'w-full sm:w-auto min-h-[44px] h-11 rounded-xl font-medium'
            )}
          >
            Go to overview
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
