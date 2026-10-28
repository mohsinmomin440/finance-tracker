import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/layouts/RootLayout';
import { getProfileMeta } from '@/services/userPermissions';
import { APP_CONFIG, AUTH_PROFILES } from '@/config/app.config';
import ApperIcon from '@/components/ApperIcon';
import AuthLayout from './AuthLayout';

export default function AccessDenied() {
  const { user, isAuthenticated } = useAuth();

  const profileLabel = getProfileMeta(user?.profile)?.label || user?.profileLabel || user?.profile || 'current';

  return (
    <AuthLayout
      title="Access Denied"
      icon="ShieldOff"
    >
      <div className="text-center space-y-5">
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs sm:text-sm font-medium leading-relaxed">
          {isAuthenticated
            ? `Your ${profileLabel} account doesn't have permission to access this page.`
            : 'You need to sign in to access this page.'}
        </div>

        {!isAuthenticated && AUTH_PROFILES?.length > 0 && (
          <div className="flex flex-col gap-3 pt-2">
            <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Sign in with an authorized profile:</p>
            <div className="flex flex-col gap-2">
              {AUTH_PROFILES.map((p) => (
                <Button key={p.key} variant="outline" asChild className="w-full min-h-[44px] h-11 rounded-xl border-white/15 dark:border-white/10 hover:border-primary/40 font-semibold">
                  <Link to={`/${p.key}/login`}>{p.label}</Link>
                </Button>
              ))}
            </div>
          </div>
        )}

        {!isAuthenticated && !AUTH_PROFILES?.length && (
          <Button asChild className="w-full min-h-[44px] h-11 rounded-xl bg-primary text-primary-foreground font-semibold shadow-md hover:bg-primary/90">
            <Link to={APP_CONFIG.defaultLoginRoute}>
              <ApperIcon name="LogIn" size={16} className="mr-2" />
              Sign in
            </Link>
          </Button>
        )}

        {isAuthenticated && (
          <Button asChild className="w-full min-h-[44px] h-11 rounded-xl bg-primary text-primary-foreground font-semibold shadow-md hover:bg-primary/90">
            <Link to="/">
              <ApperIcon name="Home" size={16} className="mr-2" />
              Return to dashboard
            </Link>
          </Button>
        )}
      </div>
    </AuthLayout>
  );
}
