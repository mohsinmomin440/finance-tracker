import { Link } from 'react-router-dom';
import ApperIcon from '@/components/ApperIcon';
import { Button } from '@/components/ui/button';

export default function NotFound({ pageName }) {
  return (
    <div className="min-h-svh flex items-center justify-center bg-background px-4 relative z-10">
      <div className="glass-card relative overflow-hidden rounded-3xl border border-white/15 dark:border-white/10 bg-card/75 backdrop-blur-2xl p-8 sm:p-12 shadow-2xl max-w-md w-full text-center space-y-5">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-emerald-400 to-sky-400" />
        
        <p className="font-display text-7xl sm:text-8xl font-black tracking-tighter text-muted-foreground/20 select-none leading-none">
          404
        </p>

        <div className="size-14 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center mx-auto text-primary shadow-sm -mt-3">
          <ApperIcon name="FileQuestion" size={28} />
        </div>

        <div className="space-y-1.5">
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Page not found
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
            {pageName
              ? `The page “${pageName}” does not exist or has been relocated.`
              : 'The resource you requested could not be located in your workspace.'}
          </p>
        </div>

        <div className="pt-2">
          <Button asChild size="lg" className="w-full min-h-[44px] h-11 rounded-xl bg-primary text-primary-foreground font-semibold shadow-md hover:bg-primary/90">
            <Link to="/" className="inline-flex items-center justify-center gap-2">
              <ApperIcon name="Home" size={17} />
              <span>Return to overview</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
