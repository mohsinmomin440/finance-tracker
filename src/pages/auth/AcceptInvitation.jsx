import { sdk } from '@/services/sdk';
import ApperIcon from '@/components/ApperIcon';
import ProviderAuthPage from './ProviderAuthPage';
import AuthLayout from './AuthLayout';

export default function AcceptInvitation() {
  const hasUI = !!sdk.session.ui;

  if (hasUI) {
    return (
      <ProviderAuthPage
        title="Accept Invitation"
        description="Set up your account to join the team"
        targetId="accept-invitation-target"
        mount={(t) => sdk.session.ui.showAcceptInvitation(t)}
      />
    );
  }

  return (
    <AuthLayout
      title="Accept Invitation"
      icon="UserPlus"
      description="Set up your account to join the workspace. Your invitation token is validated automatically."
    >
      <div className="rounded-2xl border border-white/10 dark:border-white/5 bg-card/40 p-6 text-center space-y-3">
        <div className="size-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center mx-auto">
          <ApperIcon name="Loader2" size={22} className="animate-spin" />
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Verifying your invitation details. Once processed, you will be redirected to your dashboard automatically.
        </p>
      </div>
    </AuthLayout>
  );
}
