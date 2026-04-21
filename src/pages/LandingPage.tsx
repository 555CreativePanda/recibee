import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { ChefHat, Download, Star, Users, ArrowRight, Github, Globe, Zap, Code, Terminal, Search, Shield, Menu, X as CloseIcon, Pencil } from 'lucide-react';
import { SEO } from '../components/SEO';
import { useRef, useState } from 'react';

export function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
  const y = useTransform(scrollYProgress, [0, 0.2], [0, -50]);

  return (
    <div ref={containerRef} className="relative flex flex-col min-h-screen bg-kitchen-bg text-kitchen-text overflow-x-hidden selection:bg-kitchen-primary selection:text-white">
      <SEO 
        title="Your Digital Kitchen Notebook" 
        description="ReciBee is a warm, community-driven recipe box. Import recipes, save copies, and tweak them to perfection."
      />

      {/* Header Navigation */}
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-kitchen-border px-6 py-4"
      >
        <div className="container mx-auto max-w-7xl flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="bg-kitchen-primary p-1.5 rounded-xl transition-transform group-hover:rotate-12">
              <ChefHat size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-serif font-bold tracking-tight text-kitchen-text">ReciBee</h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/explore" className="text-xs font-bold uppercase tracking-widest text-kitchen-muted hover:text-kitchen-primary transition-colors">Explore</Link>
            <Link to="/docs" className="text-xs font-bold uppercase tracking-widest text-kitchen-muted hover:text-kitchen-primary transition-colors">Docs</Link>
            <Link to="/api-docs" className="text-xs font-bold uppercase tracking-widest text-kitchen-muted hover:text-kitchen-primary transition-colors">API</Link>
            <Link 
              to="/explore" 
              className="bg-kitchen-primary hover:bg-kitchen-primary-hover text-white px-6 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all shadow-md hover:shadow-lg"
            >
              Open Recipes
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-kitchen-muted hover:text-kitchen-primary transition-colors"
          >
            {isMenuOpen ? <CloseIcon size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-kitchen-border overflow-hidden"
            >
              <div className="flex flex-col p-6 gap-6">
                <Link 
                  to="/explore" 
                  onClick={() => setIsMenuOpen(false)}
                  className="text-sm font-bold uppercase tracking-widest text-kitchen-muted hover:text-kitchen-primary transition-colors"
                >
                  Explore
                </Link>
                <Link 
                  to="/docs" 
                  onClick={() => setIsMenuOpen(false)}
                  className="text-sm font-bold uppercase tracking-widest text-kitchen-muted hover:text-kitchen-primary transition-colors"
                >
                  Docs
                </Link>
                <Link 
                  to="/api-docs" 
                  onClick={() => setIsMenuOpen(false)}
                  className="text-sm font-bold uppercase tracking-widest text-kitchen-muted hover:text-kitchen-primary transition-colors"
                >
                  API
                </Link>
                <Link 
                  to="/explore" 
                  onClick={() => setIsMenuOpen(false)}
                  className="bg-kitchen-primary hover:bg-kitchen-primary-hover text-white px-5 py-3 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all text-center shadow-md"
                >
                  Open Recipes
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>


      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center px-6 pt-32 overflow-hidden">
        {/* Immersive Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(234,88,12,0.05),transparent_50%)]" />
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.05, 0.08, 0.05],
              x: [0, 50, 0],
              y: [0, -30, 0]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 -left-1/4 w-[800px] h-[800px] bg-kitchen-primary rounded-full blur-[120px]"
          />
          <motion.div 
            animate={{ 
              scale: [1.2, 1, 1.2],
              opacity: [0.03, 0.06, 0.03],
              x: [0, -50, 0],
              y: [0, 30, 0]
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-kitchen-primary rounded-full blur-[150px]"
          />
          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #ea580c 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <motion.div 
          style={{ opacity, scale, y }}
          className="container mx-auto max-w-6xl relative z-10"
        >
          <div className="flex flex-col items-center text-center space-y-12 mt-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/50 backdrop-blur-sm border border-kitchen-border text-[10px] font-bold uppercase tracking-[0.2em] text-kitchen-primary"
            >
              <Zap size={12} className="animate-pulse" />
              <span>Your Personal Kitchen Notebook</span>
            </motion.div>

            <div className="space-y-6">
              <motion.h1 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="text-7xl md:text-[10rem] font-serif font-bold tracking-tight leading-[0.85] flex flex-col items-center text-kitchen-text"
              >
                <span className="block">Cook with</span>
                <span className="block text-kitchen-primary italic">Flavor.</span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="text-lg md:text-2xl text-kitchen-muted max-w-3xl mx-auto leading-relaxed font-light"
              >
                ReciBee treats recipes like a living notebook. Import from any URL, save your own versions, and tweak every dish to perfection.
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
                className="group relative flex items-center gap-3 bg-kitchen-primary text-white px-10 py-5 text-lg font-bold rounded-2xl transition-all hover:bg-kitchen-primary-hover overflow-hidden shadow-xl"
              >
                <span className="relative z-10">Open Recipes</span>
                <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                to="/docs" 
                className="flex items-center gap-3 border border-kitchen-border hover:bg-white text-kitchen-text px-10 py-5 text-lg font-medium rounded-2xl transition-all backdrop-blur-sm shadow-sm"
              >
                <Terminal size={20} className="text-kitchen-muted" />
                Read the Guide
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
          <span className="text-[10px] uppercase tracking-[0.3em] text-kitchen-muted font-bold">Scroll to explore</span>
          <div className="w-[1px] h-16 bg-kitchen-border relative overflow-hidden">
            <motion.div 
              animate={{ y: ["-100%", "100%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-kitchen-primary"
            />
          </div>
        </motion.div>
      </section>

      {/* Philosophy Section - Big Typography */}
      <section className="py-40 px-6 bg-white relative overflow-hidden">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8"
            >
              <div className="text-kitchen-primary font-bold text-xs uppercase tracking-[0.3em]">The Philosophy</div>
              <h2 className="text-5xl md:text-7xl font-serif font-bold tracking-tight leading-[0.9] text-kitchen-text">
                Recipes are <br />
                <span className="text-kitchen-muted">Personal.</span>
              </h2>
              <p className="text-xl text-kitchen-muted leading-relaxed font-light max-w-xl">
                We believe the best dishes are built through iteration. A recipe is just the beginning—your tweaks and adjustments are what make it yours.
              </p>
            </motion.div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Download, title: 'Import', desc: 'Scrape the noise from any food blog instantly.' },
                { icon: ChefHat, title: 'Tweak', desc: 'Save your own version of any dish you find.' },
                { icon: Search, title: 'Explore', desc: 'Find the ultimate community-tested recipes.' },
                { icon: Shield, title: 'Private', desc: 'Your recipe box, your rules, your kitchen.' }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-kitchen-bg border border-kitchen-border p-8 space-y-4 group hover:border-kitchen-primary transition-colors rounded-2xl"
                >
                  <div className="text-kitchen-primary group-hover:scale-110 transition-transform duration-300">
                    <item.icon size={24} />
                  </div>
                  <h4 className="font-serif font-bold text-xl text-kitchen-text">{item.title}</h4>
                  <p className="text-sm text-kitchen-muted leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Live Preview Section */}
      <section className="py-40 px-6 bg-kitchen-bg relative">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col items-center text-center space-y-16">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-6xl font-serif font-bold tracking-tight text-kitchen-text">Kitchen Precision.</h2>
              <p className="text-kitchen-muted text-lg max-w-2xl mx-auto">
                Our interface is designed for clarity. Track your adjustments, save community favorites, and manage your culinary notebook with ease.
              </p>
            </div>

            <div className="w-full space-y-6">
              {/* Card 1: Forked Version */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white border border-kitchen-border p-8 shadow-xl rounded-2xl relative group"
              >
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 border border-kitchen-border text-[10px] font-bold text-kitchen-muted uppercase tracking-wider rounded-lg">Public</span>
                      <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-lg">
                        <div className="w-1.5 h-1.5 bg-orange-600 rounded-full" />
                        Tweaked
                      </span>
                    </div>
                    <button className="flex items-center gap-2 bg-stone-50 border border-kitchen-border px-4 py-2 rounded-xl text-xs font-bold text-kitchen-text hover:bg-stone-100 transition-colors">
                      <Pencil size={14} />
                      TWEAK
                    </button>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2 text-left">
                    <h3 className="text-2xl font-serif font-bold tracking-tight text-kitchen-text">
                      <span>The Best Banana Cake I've Ever Had</span>
                    </h3>
                    <span className="text-xs text-kitchen-muted font-bold">Updated 10 Apr 2026</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 text-xs text-kitchen-muted font-bold">
                    <div className="flex items-center gap-1.5">
                      <Users size={14} />
                      <span>{12} likes</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ChefHat size={14} />
                      <span>4 copies</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-kitchen-primary">
                      <ChefHat size={14} className="rotate-180" />
                      <span>from Original Recipe</span>
                    </div>
                    <div className="flex items-center gap-1.5 ml-auto">
                      <Globe size={14} />
                      <span>sallysbakingaddiction.com</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Card 2: Original Version */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white border border-kitchen-border p-8 shadow-xl rounded-2xl relative group"
              >
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 border border-kitchen-border text-[10px] font-bold text-kitchen-muted uppercase tracking-wider rounded-lg">Public</span>
                    </div>
                    <button className="flex items-center gap-2 bg-stone-50 border border-kitchen-border px-4 py-2 rounded-xl text-xs font-bold text-kitchen-text hover:bg-stone-100 transition-colors">
                      <Pencil size={14} />
                      TWEAK
                    </button>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2 text-left">
                    <h3 className="text-2xl font-serif font-bold tracking-tight text-kitchen-text">
                      <span>The Best Banana Cake I've Ever Had</span>
                    </h3>
                    <span className="text-xs text-kitchen-muted font-bold">Updated 9 Apr 2026</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 text-xs text-kitchen-muted font-bold">
                    <div className="flex items-center gap-1.5">
                      <Star size={14} />
                      <span>45 likes</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ChefHat size={14} />
                      <span>18 copies</span>
                    </div>
                    <div className="flex items-center gap-1.5 ml-auto">
                      <Globe size={14} />
                      <span>sallysbakingaddiction.com</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-40 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-kitchen-primary" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        
        <div className="container mx-auto max-w-4xl relative z-10 text-center space-y-12">
          <motion.h2 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-8xl font-serif font-bold tracking-tight leading-tight text-white"
          >
            Start your <br /> recipes today.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-xl md:text-2xl text-orange-100 max-w-2xl mx-auto font-light"
          >
            Join the community of home cooks building the future of recipe management.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link 
              to="/explore" 
              className="inline-flex items-center gap-4 bg-white text-kitchen-primary px-12 py-6 text-2xl font-bold rounded-2xl transition-all hover:scale-105 shadow-2xl group"
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
