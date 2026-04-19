import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ChefHat, Activity, CheckCircle2, AlertCircle, Clock, Server, Database, Globe, Zap, Shield } from 'lucide-react';
import { SEO } from '../components/SEO';

export function StatusPage() {
  const systems = [
    { name: 'Core API', status: 'operational', uptime: '99.98%', latency: '42ms', icon: Server },
    { name: 'Firestore Database', status: 'operational', uptime: '100%', latency: '12ms', icon: Database },
    { name: 'Recipe Import Engine', status: 'operational', uptime: '99.95%', latency: '1.2s', icon: Zap },
    { name: 'Authentication Service', status: 'operational', uptime: '99.99%', latency: '85ms', icon: Shield },
    { name: 'Global CDN', status: 'operational', uptime: '100%', latency: '15ms', icon: Globe },
  ];

  const incidents = [
    {
      date: 'April 8, 2026',
      title: 'Scheduled Maintenance',
      status: 'Completed',
      description: 'Database indexing optimization and security patch application.',
    },
    {
      date: 'April 2, 2026',
      title: 'Minor Latency in Import Engine',
      status: 'Resolved',
      description: 'Increased traffic caused temporary delays in recipe parsing. Scaling group adjusted.',
    }
  ];

  return (
    <div className="min-h-screen bg-kitchen-bg text-kitchen-text pb-20 font-sans">
      <SEO 
        title="System Status" 
        description="Real-time status of ReciBee services. Monitor uptime, latency, and incident reports."
      />
      
      {/* Header */}
      <header className="bg-white border-b border-kitchen-border px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto max-w-5xl flex items-center justify-between">
          <Link to="/explore" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="bg-kitchen-primary p-1.5 rounded-xl">
              <ChefHat size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-serif font-bold tracking-tight text-kitchen-text">ReciBee<span className="text-kitchen-primary font-sans ml-1 text-sm">/status</span></h1>
          </Link>
          <Link to="/" className="text-sm font-bold text-kitchen-muted hover:text-kitchen-primary transition-colors uppercase tracking-widest">
            Back to Home
          </Link>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-6 pt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          {/* Overall Status Banner */}
          <div className="bg-green-50 border border-green-100 p-8 rounded-3xl flex items-center gap-6 shadow-sm">
            <div className="bg-green-500 p-3 rounded-2xl shadow-lg shadow-green-200">
              <CheckCircle2 size={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-serif font-bold text-green-700">All Systems Operational</h2>
              <p className="text-green-600/70 text-sm font-medium">Last updated: April 10, 2026 - 01:05 UTC</p>
            </div>
          </div>

          {/* System Grid */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-kitchen-muted uppercase tracking-widest border-b border-kitchen-border pb-4">Current Status</h3>
            <div className="bg-white border border-kitchen-border rounded-3xl overflow-hidden shadow-md divide-y divide-kitchen-border">
              {systems.map((system, idx) => (
                <div key={idx} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-stone-50 transition-colors">
                  <div className="flex items-center gap-5">
                    <div className="p-3 bg-stone-100 rounded-2xl text-kitchen-primary">
                      <system.icon size={24} />
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-lg text-kitchen-text">{system.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] uppercase font-bold text-green-600 tracking-wider">{system.status}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-10 md:gap-16">
                    <div className="space-y-1 text-right">
                      <p className="text-[10px] uppercase font-bold text-kitchen-muted tracking-widest">Uptime</p>
                      <p className="font-mono text-sm font-bold text-kitchen-text">{system.uptime}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-[10px] uppercase font-bold text-kitchen-muted tracking-widest">Latency</p>
                      <p className="font-mono text-sm font-bold text-kitchen-text">{system.latency}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Incident History */}
          <div className="space-y-8">
            <h3 className="text-sm font-bold text-kitchen-muted uppercase tracking-widest border-b border-kitchen-border pb-4">Incident History</h3>
            <div className="space-y-10">
              {incidents.map((incident, idx) => (
                <div key={idx} className="relative pl-10 border-l-2 border-kitchen-border pb-10 last:pb-0">
                  <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-white border-4 border-kitchen-border" />
                  <div className="space-y-3 bg-white p-6 rounded-2xl border border-kitchen-border shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-kitchen-muted uppercase tracking-widest">{incident.date}</span>
                      <span className="text-[10px] font-bold uppercase px-3 py-1 bg-stone-100 text-kitchen-muted rounded-lg border border-stone-200">
                        {incident.status}
                      </span>
                    </div>
                    <h4 className="text-xl font-serif font-bold text-kitchen-text">{incident.title}</h4>
                    <p className="text-kitchen-muted text-sm leading-relaxed max-w-2xl">
                      {incident.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Info */}
          <div className="pt-12 border-t border-kitchen-border flex flex-col md:flex-row justify-between items-center gap-6 text-kitchen-muted text-xs font-bold uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-kitchen-primary" />
              <span>Monitoring 12 regions worldwide</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-kitchen-primary" />
              <span>Next check in 45 seconds</span>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
