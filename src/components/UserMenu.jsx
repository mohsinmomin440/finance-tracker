import { Link } from 'react-router-dom';
import { useAuth } from '@/layouts/RootLayout';
import ThemeToggle from '@/components/ThemeToggle';
import ApperIcon from '@/components/ApperIcon';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * Aurora Glassmorphism account menu.
 * Keeps all required props (user, initials, displayName, logout) and functionality:
 * profile info, role badge, theme toggle in safe container, change password, and sign-out.
 */
export default function UserMenu({ user: userProp, initials: initialsProp, displayName: displayNameProp, logout: logoutProp }) {
  const auth = useAuth();
  const user = userProp ?? auth.user;
  const logout = logoutProp ?? auth.logout;
  const displayName =
    displayNameProp ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.emailAddress ||
    'Account';
  const initials =
    initialsProp ||
    displayName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() ||
    'U';
  const profileLabel = String(user?.profile ?? '').replace(/_c$/, '');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex size-9 min-h-[44px] min-w-[44px] items-center justify-center rounded-full outline-none transition-all hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label="Account menu"
        >
          <Avatar className="size-9 border border-white/20 dark:border-white/10 shadow-sm">
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-xs font-bold tracking-tight">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-64 rounded-2xl border border-white/15 dark:border-white/10 bg-popover/95 backdrop-blur-2xl shadow-2xl p-2 animate-in fade-in-0 zoom-in-95"
      >
        <DropdownMenuLabel className="p-2.5">
          <p className="text-sm font-semibold text-foreground tracking-tight truncate">{displayName}</p>
          {user?.emailAddress && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{user.emailAddress}</p>
          )}
          {profileLabel && (
            <div className="mt-2">
              <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">
                {profileLabel}
              </span>
            </div>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/60 my-1" />
        <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground px-2.5 pt-1.5 pb-1">
          Theme
        </DropdownMenuLabel>
        <div className="px-2 pb-2">
          <ThemeToggle className="w-full justify-between rounded-xl bg-muted/40 border border-border/50 p-1" />
        </div>
        <DropdownMenuSeparator className="bg-border/60 my-1" />
        <DropdownMenuItem asChild className="rounded-xl px-3 py-2 text-sm cursor-pointer hover:bg-accent/80 focus:bg-accent/80 transition-colors">
          <Link to="/change-password" className="flex items-center gap-2.5">
            <ApperIcon name="KeyRound" size={15} className="text-muted-foreground" />
            <span>Change password</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border/60 my-1" />
        <DropdownMenuItem
          onClick={logout}
          className="rounded-xl px-3 py-2 text-sm text-destructive hover:bg-destructive/10 focus:bg-destructive/10 cursor-pointer transition-colors flex items-center gap-2.5 font-medium"
        >
          <ApperIcon name="LogOut" size={15} />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
