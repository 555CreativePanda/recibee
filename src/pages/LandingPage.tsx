import { motion, useScroll, useTransform } from 'motion/react';
import { Link } from 'react-router-dom';
import { ChefHat, GitBranch, Download, Star, Users, ArrowRight, Github, Globe, Zap, Code, Terminal, Search, Shield } from 'lucide-react';
import { SEO } from '../components/SEO';
import { useRef } from 'react';

export function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
  const y = useTransform(scrollYProgress, [0, 0.2], [0, -50]);

  return (
    <div ref={containerRef} className="relative flex flex-col min-h-screen bg-carbon-gray-100 text-white overflow-x-hidden selection:bg-carbon-blue-60 selection:text-white">
      <SEO 
        title="Fork the Flavor" 
        description="ReciBee is a Git-inspired recipe repository for developers and home cooks. Import recipes, fork versions, and collaborate on the ultimate culinary repository."
      />

      {/* Header Navigation */}
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 bg-carbon-gray-100/80 backdrop-blur-lg border-b border-carbon-gray-80 px-6 py-4"
      >
        <div className="container mx-auto max-w-7xl flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="bg-carbon-blue-60 p-1.5 transition-transform group-hover:rotate-12">
              <ChefHat size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tighter">ReciBee<span className="text-carbon-blue-60">/_</span></h1>
          </Link>
          <div className="flex items-center gap-8">
            <Link to="/explore" className="text-xs font-mono uppercase tracking-widest text-carbon-gray-30 hover:text-white transition-colors">Explore</Link>
            <Link to="/docs" className="text-xs font-mono uppercase tracking-widest text-carbon-gray-30 hover:text-white transition-colors">Docs</Link>
            <Link to="/api-docs" className="text-xs font-mono uppercase tracking-widest text-carbon-gray-30 hover:text-white transition-colors">API</Link>
            <Link 
              to="/explore" 
              className="bg-carbon-blue-60 hover:bg-carbon-blue-70 text-white px-5 py-2 text-xs font-mono uppercase tracking-widest transition-all"
            >
              Launch
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center px-6 overflow-hidden">
        {/* Immersive Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent_50%)]" />
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.05, 0.08, 0.05],
              x: [0, 50, 0],
              y: [0, -30, 0]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 -left-1/4 w-[800px] h-[800px] bg-carbon-blue-60 rounded-full blur-[120px]"
          />
          <motion.div 
            animate={{ 
              scale: [1.2, 1, 1.2],
              opacity: [0.03, 0.06, 0.03],
              x: [0, -50, 0],
              y: [0, 30, 0]
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-carbon-blue-60 rounded-full blur-[150px]"
          />
          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.03] bg-[grid-white_20px]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <motion.div 
          style={{ opacity, scale, y }}
          className="container mx-auto max-w-6xl relative z-10"
        >
          <div className="flex flex-col items-center text-center space-y-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-carbon-gray-90/50 backdrop-blur-sm border border-carbon-gray-80 text-[10px] font-mono uppercase tracking-[0.2em] text-carbon-blue-60"
            >
              <Zap size={12} className="animate-pulse" />
              <span>Culinary Version Control System</span>
            </motion.div>

            <div className="space-y-6">
              <motion.h1 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="text-7xl md:text-[10rem] font-bold tracking-tighter leading-[0.85] flex flex-col items-center"
              >
                <span className="block">Fork the</span>
                <span className="block text-carbon-blue-60 italic">Flavor.</span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="text-lg md:text-2xl text-carbon-gray-30 max-w-3xl mx-auto leading-relaxed font-light"
              >
                ReciBee treats recipes as source code. Import from any URL, branch your favorites, and track every culinary iteration with technical precision.
              </motion.p>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col sm:flex-row gap-6 pt-8"
            >
              <Link 
                to="/explore" 
                className="group relative flex items-center gap-3 bg-white text-carbon-gray-100 px-10 py-5 text-lg font-bold transition-all hover:bg-carbon-blue-60 hover:text-white overflow-hidden"
              >
                <span className="relative z-10">Initialize Repository</span>
                <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                <motion.div 
                  className="absolute inset-0 bg-carbon-blue-60 translate-y-full group-hover:translate-y-0 transition-transform duration-300"
                />
              </Link>
              <Link 
                to="/docs" 
                className="flex items-center gap-3 border border-carbon-gray-80 hover:bg-carbon-gray-80/50 text-white px-10 py-5 text-lg font-medium transition-all backdrop-blur-sm"
              >
                <Terminal size={20} className="text-carbon-gray-30" />
                Read the Docs
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
        >
          <span className="text-[10px] uppercase tracking-[0.3em] text-carbon-gray-30 font-mono">Scroll to explore</span>
          <div className="w-[1px] h-16 bg-carbon-gray-80 relative overflow-hidden">
            <motion.div 
              animate={{ y: ["-100%", "100%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-carbon-blue-60"
            />
          </div>
        </motion.div>
      </section>

      {/* Philosophy Section - Big Typography */}
      <section className="py-40 px-6 bg-carbon-gray-100 relative overflow-hidden">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8"
            >
              <div className="text-carbon-blue-60 font-mono text-xs uppercase tracking-[0.3em]">The Philosophy</div>
              <h2 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[0.9]">
                Recipes are <br />
                <span className="text-carbon-gray-30">Source Code.</span>
              </h2>
              <p className="text-xl text-carbon-gray-30 leading-relaxed font-light max-w-xl">
                We believe the best dishes are built through iteration. Like software, a recipe is a set of instructions that can be improved, branched, and shared.
              </p>
            </motion.div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Download, title: 'Import', desc: 'Scrape the noise from any food blog.' },
                { icon: GitBranch, title: 'Fork', desc: 'Branch your own version of any dish.' },
                { icon: Search, title: 'Explore', desc: 'Find the ultimate culinary source.' },
                { icon: Shield, title: 'Secure', desc: 'Your repository, your rules.' }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-carbon-gray-90 border border-carbon-gray-80 p-8 space-y-4 group hover:border-carbon-blue-60 transition-colors"
                >
                  <div className="text-carbon-blue-60 group-hover:scale-110 transition-transform duration-300">
                    <item.icon size={24} />
                  </div>
                  <h4 className="font-bold text-lg">{item.title}</h4>
                  <p className="text-sm text-carbon-gray-30 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Live Preview Section */}
      <section className="py-40 px-6 bg-carbon-gray-90 relative">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col items-center text-center space-y-16">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-6xl font-bold tracking-tighter">Technical Precision.</h2>
              <p className="text-carbon-gray-30 text-lg max-w-2xl mx-auto">
                Our interface is designed for clarity and control. Track versions, monitor forks, and manage your culinary repository with ease.
              </p>
            </div>

            <div className="w-full space-y-6">
              {/* Card 1: Forked Version */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="bg-carbon-gray-100 border border-carbon-gray-80 p-6 shadow-2xl relative group"
              >
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 border border-carbon-gray-80 text-[10px] font-mono text-carbon-gray-30 uppercase tracking-wider">Public</span>
                      <span className="px-2 py-0.5 bg-[#EAB308] text-black text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-black" />
                        Forked
                      </span>
                    </div>
                    <button className="flex items-center gap-2 bg-carbon-gray-90 border border-carbon-gray-80 px-3 py-1.5 text-xs font-medium hover:bg-carbon-gray-80 transition-colors">
                      <GitBranch size={14} />
                      Fork
                    </button>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2">
                    <h3 className="text-xl font-bold tracking-tight">
                      <span className="text-carbon-blue-60">pMzqlU54</span>
                      <span className="text-carbon-gray-30 mx-2">/</span>
                      <span>The Best Banana Cake I've Ever Had</span>
                    </h3>
                    <span className="text-xs text-carbon-gray-30 font-mono">Updated 10 Apr 2026</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 text-xs text-carbon-gray-30 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Star size={14} />
                      <span>0 stars</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <GitBranch size={14} />
                      <span>0 forks</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-carbon-blue-60">
                      <GitBranch size={14} className="rotate-180" />
                      <span>from 6DJgqmHM</span>
                    </div>
                    <div className="flex items-center gap-1.5 ml-auto">
                      <Globe size={14} />
                      <span>sallysbakingaddiction.com</span>
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-carbon-gray-80 flex items-center gap-2 text-xs text-carbon-gray-30 font-mono cursor-pointer hover:text-white transition-colors">
                  <ArrowRight size={14} className="rotate-90" />
                  Show details
                </div>
              </motion.div>

              {/* Card 2: Original Version */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="bg-carbon-gray-100 border border-carbon-gray-80 p-6 shadow-2xl relative group"
              >
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 border border-carbon-gray-80 text-[10px] font-mono text-carbon-gray-30 uppercase tracking-wider">Public</span>
                    </div>
                    <button className="flex items-center gap-2 bg-carbon-gray-90 border border-carbon-gray-80 px-3 py-1.5 text-xs font-medium hover:bg-carbon-gray-80 transition-colors">
                      <GitBranch size={14} />
                      Fork
                    </button>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2">
                    <h3 className="text-xl font-bold tracking-tight">
                      <span className="text-carbon-blue-60">pMzqlU54</span>
                      <span className="text-carbon-gray-30 mx-2">/</span>
                      <span>The Best Banana Cake I've Ever Had</span>
                    </h3>
                    <span className="text-xs text-carbon-gray-30 font-mono">Updated 9 Apr 2026</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 text-xs text-carbon-gray-30 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Star size={14} />
                      <span>0 stars</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <GitBranch size={14} />
                      <span>1 forks</span>
                    </div>
                    <div className="flex items-center gap-1.5 ml-auto">
                      <Globe size={14} />
                      <span>sallysbakingaddiction.com</span>
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-carbon-gray-80 flex items-center gap-2 text-xs text-carbon-gray-30 font-mono cursor-pointer hover:text-white transition-colors">
                  <ArrowRight size={14} className="rotate-90" />
                  Show details
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-40 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-carbon-blue-60" />
        <div className="absolute inset-0 opacity-10 bg-[grid-white_20px]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        
        <div className="container mx-auto max-w-4xl relative z-10 text-center space-y-12">
          <motion.h2 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-8xl font-bold tracking-tighter leading-tight"
          >
            Start your <br /> repository today.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-xl md:text-2xl text-carbon-blue-10 max-w-2xl mx-auto font-light"
          >
            Join the community of technical chefs building the future of recipe management.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link 
              to="/explore" 
              className="inline-flex items-center gap-4 bg-white text-carbon-blue-60 px-12 py-6 text-2xl font-bold transition-all hover:scale-105 shadow-2xl group"
            >
              Get Started
              <ArrowRight size={28} className="group-hover:translate-x-2 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
