import { Outlet } from 'react-router-dom';
import ThemeToggle from '@/components/ThemeToggle';

export default function PublicLayout() {
  return (
    <div className="min-h-svh bg-background relative flex flex-col justify-center">
      <div className="absolute top-5 right-5 z-20">
        <div className="rounded-2xl border border-white/15 dark:border-white/10 bg-card/70 backdrop-blur-xl p-1 shadow-sm">
          <ThemeToggle />
        </div>
      </div>
      <Outlet />
    </div>
  );
}
