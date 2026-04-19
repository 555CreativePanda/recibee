import { Link } from 'react-router-dom';
import { ChefHat } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white border-t border-kitchen-border py-12 px-6 mt-auto">
      <div className="container mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-center gap-8">
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
          © 2026 RECIBEE KITCHEN. v1.0.5-STABLE
        </div>
      </div>
    </footer>
  );
}
