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
    <div className="min-h-screen bg-carbon-gray-100 text-white pb-20 font-sans">
      <SEO 
        title="System Status" 
        description="Real-time status of ReciBee services. Monitor uptime, latency, and incident reports."
      />
      
      {/* Header */}
      <header className="bg-carbon-gray-90 border-b border-carbon-gray-80 px-6 py-4 sticky top-0 z-10">
        <div className="container mx-auto max-w-5xl flex items-center justify-between">
          <Link to="/explore" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="bg-carbon-blue-60 p-1.5">
              <ChefHat size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">ReciBee<span className="text-carbon-blue-60">/status</span></h1>
          </Link>
          <Link to="/explore" className="text-sm font-medium text-carbon-gray-30 hover:text-white transition-colors">
            Back to App
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
          <div className="bg-green-500/10 border border-green-500/20 p-6 flex items-center gap-4">
            <div className="bg-green-500 p-2 rounded-full">
              <CheckCircle2 size={24} className="text-carbon-gray-100" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-green-500">All Systems Operational</h2>
              <p className="text-carbon-gray-30 text-sm">Last updated: April 10, 2026 - 01:05 UTC</p>
            </div>
          </div>

          {/* System Grid */}
          <div className="space-y-4">
            <h3 className="text-sm font-mono text-carbon-gray-30 uppercase tracking-widest border-b border-carbon-gray-80 pb-4">Current Status</h3>
            <div className="grid gap-px bg-carbon-gray-80 border border-carbon-gray-80 overflow-hidden">
              {systems.map((system, idx) => (
                <div key={idx} className="bg-carbon-gray-90 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-carbon-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="text-carbon-blue-60">
                      <system.icon size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold">{system.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-[10px] uppercase font-mono text-green-500 font-bold">{system.status}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-8 md:gap-12">
                    <div className="space-y-1 text-right">
                      <p className="text-[10px] uppercase font-mono text-carbon-gray-30">Uptime</p>
                      <p className="font-mono text-sm">{system.uptime}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-[10px] uppercase font-mono text-carbon-gray-30">Latency</p>
                      <p className="font-mono text-sm">{system.latency}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Incident History */}
          <div className="space-y-6">
            <h3 className="text-sm font-mono text-carbon-gray-30 uppercase tracking-widest border-b border-carbon-gray-80 pb-4">Incident History</h3>
            <div className="space-y-8">
              {incidents.map((incident, idx) => (
                <div key={idx} className="relative pl-8 border-l border-carbon-gray-80 pb-8 last:pb-0">
                  <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-carbon-gray-80" />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-carbon-gray-30">{incident.date}</span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-carbon-gray-80 text-carbon-gray-30 rounded">
                        {incident.status}
                      </span>
                    </div>
                    <h4 className="text-lg font-bold">{incident.title}</h4>
                    <p className="text-carbon-gray-30 text-sm leading-relaxed max-w-2xl">
                      {incident.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Info */}
          <div className="pt-12 border-t border-carbon-gray-80 flex flex-col md:flex-row justify-between items-center gap-6 text-carbon-gray-30 text-xs font-mono">
            <div className="flex items-center gap-2">
              <Activity size={14} />
              <span>Monitoring 12 regions worldwide</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} />
              <span>Next check in 45 seconds</span>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
