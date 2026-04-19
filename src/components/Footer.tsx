import { Link } from 'react-router-dom';
import { ChefHat, Database, Loader2 } from 'lucide-react';

interface FooterProps {
  user?: any;
  onHeal?: () => void;
  isHealing?: boolean;
}

export function Footer({ user, onHeal, isHealing }: FooterProps) {
  const isAdmin = user?.email === 'chandra.mayur@gmail.com';

  return (
    <footer className="bg-white border-t border-kitchen-border py-12 px-6 mt-auto">
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-kitchen-primary p-1.5 rounded-lg">
              <ChefHat size={16} className="text-white" />
            </div>
            <span className="text-sm font-serif font-bold tracking-tight text-kitchen-text">ReciBee</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 md:gap-8 text-[10px] font-bold uppercase tracking-[0.2em] text-kitchen-muted">
            <Link to="/" className="hover:text-kitchen-primary transition-colors">Home</Link>
            <Link to="/explore" className="hover:text-kitchen-primary transition-colors">Explore</Link>
            <Link to="/docs" className="hover:text-kitchen-primary transition-colors">Documentation</Link>
            <Link to="/api-docs" className="hover:text-kitchen-primary transition-colors">API Reference</Link>
            <Link to="/features" className="hover:text-kitchen-primary transition-colors">Request a Feature</Link>
            <Link to="/status" className="hover:text-kitchen-primary transition-colors">Status</Link>
          </div>
          
          <div className="text-[10px] font-bold text-stone-300 uppercase tracking-widest">
            © 2026 RECIBEE KITCHEN. v1.0.6-MAINTENANCE
          </div>
        </div>

        {isAdmin && onHeal && (
          <div className="border-t border-dashed border-kitchen-border pt-8 mt-8 flex flex-col items-center gap-4">
            <p className="text-[9px] font-bold text-kitchen-muted uppercase tracking-[0.2em]">Maintenance Console</p>
            <button
              onClick={onHeal}
              disabled={isHealing}
              className="flex items-center gap-2 bg-stone-900 hover:bg-black text-white px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50"
            >
              {isHealing ? <Loader2 size={14} className="animate-spin" /> : <Database size={14} />}
              {isHealing ? 'Repairing Database...' : 'Repair Public Visibility (Heal)'}
            </button>
            <p className="text-[9px] text-stone-300 max-w-md text-center italic">
              This tool ensures all existing recipes have 'is_public: true' if missing, resolving visibility issues for guests.
            </p>
          </div>
        )}
      </div>
    </footer>
  );
}
