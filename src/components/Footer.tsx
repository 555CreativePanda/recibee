import { Link } from 'react-router-dom';
import { ChefHat } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-carbon-gray-100 border-t border-carbon-gray-80 py-12 px-6 mt-auto">
      <div className="container mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-3">
          <div className="bg-carbon-blue-60 p-1">
            <ChefHat size={16} className="text-white" />
          </div>
          <span className="text-sm font-bold tracking-tighter uppercase text-white">ReciBee</span>
        </div>
        
        <div className="flex flex-wrap justify-center gap-6 md:gap-8 text-[10px] font-mono uppercase tracking-[0.2em] text-carbon-gray-30">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <Link to="/explore" className="hover:text-white transition-colors">Explore</Link>
          <Link to="/docs" className="hover:text-white transition-colors">Documentation</Link>
          <Link to="/api-docs" className="hover:text-white transition-colors">API Reference</Link>
          <Link to="/features" className="hover:text-white transition-colors">Request a Feature</Link>
          <Link to="/status" className="hover:text-white transition-colors">Status</Link>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
        </div>
        
        <div className="text-[10px] font-mono text-carbon-gray-80">
          © 2026 RECIBEE CORE. v1.0.4-STABLE
        </div>
      </div>
    </footer>
  );
}
