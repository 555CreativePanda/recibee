import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { ChefHat, Download, Star, Users, ArrowRight, Github, Globe, Zap, Code, Terminal, Search, Shield, Menu, X as CloseIcon, Pencil } from 'lucide-react';
import { SEO } from '../components/SEO';
import { useRef, useState } from 'react';

export function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mockupView, setMockupView] = useState<'before' | 'after'>('after');
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
      <section className="relative min-h-[90vh] flex items-center px-6 pt-32 pb-20 overflow-hidden">
        {/* Immersive Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(234,88,12,0.05),transparent_50%)]" />
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.05, 0.08, 0.05],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 -left-1/4 w-[800px] h-[800px] bg-kitchen-primary rounded-full blur-[120px]"
          />
          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #ea580c 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Left Content */}
            <motion.div 
              style={{ opacity, scale, y }}
              className="flex flex-col space-y-10"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-orange-50 border border-orange-100 text-[10px] font-bold uppercase tracking-[0.2em] text-kitchen-primary w-fit"
              >
                <Zap size={12} className="animate-pulse" />
                <span>Smart Recipe Management</span>
              </motion.div>

              <div className="space-y-6">
                <motion.h1 
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="text-6xl md:text-8xl font-serif font-bold tracking-tight leading-[0.95] text-kitchen-text"
                >
                  Stop Scrolling.<br />
                  <span className="text-kitchen-primary italic">Start Cooking.</span>
                </motion.h1>

                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="text-lg md:text-xl text-kitchen-muted max-w-xl leading-relaxed font-light"
                >
                  The first ad-free <span className="font-semibold text-kitchen-text">recipe manager</span> that strips the blog noise. Import from any URL and save your own tweaks to build a living <span className="font-semibold text-kitchen-text">digital notebook</span>.
                </motion.p>
              </div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col sm:flex-row gap-4 pt-4"
              >
                <Link 
                  to="/explore" 
                  className="group relative flex items-center justify-center gap-3 bg-orange-600 text-white px-10 py-5 text-lg font-bold rounded-2xl transition-all hover:bg-orange-700 overflow-hidden shadow-xl shadow-orange-200 active:scale-95"
                >
                  <span>Get Started</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  to="/docs" 
                  className="flex items-center justify-center gap-3 border border-kitchen-border hover:bg-white text-kitchen-text px-10 py-5 text-lg font-medium rounded-2xl transition-all backdrop-blur-sm shadow-sm active:scale-95"
                >
                  See how it works
                </Link>
              </motion.div>
            </motion.div>

            {/* Right Mockup */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative group lg:scale-110 xl:scale-125 origin-right"
            >
              <div className="relative aspect-[4/3] w-full max-w-lg mx-auto">
                {/* Before: Cluttered Blog */}
                <motion.div 
                  animate={{
                    x: mockupView === 'before' ? 0 : -48,
                    scale: mockupView === 'before' ? 1.05 : 0.95,
                    opacity: mockupView === 'before' ? 1 : 0.3,
                    filter: mockupView === 'before' ? 'blur(2px)' : 'blur(8px)',
                    zIndex: mockupView === 'before' ? 30 : 10
                  }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => setMockupView('before')}
                  className="absolute inset-0 bg-white rounded-[2rem] shadow-2xl border border-kitchen-border overflow-hidden cursor-pointer"
                >
                  <div className="absolute inset-0 flex flex-col">
                    {/* Fake Browser Header */}
                    <div className="h-12 bg-stone-100 border-b border-stone-200 flex items-center px-4 gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-stone-300" />
                        <div className="w-2.5 h-2.5 rounded-full bg-stone-300" />
                        <div className="w-2.5 h-2.5 rounded-full bg-stone-300" />
                      </div>
                      <div className="flex-1 bg-white h-6 rounded-md border border-stone-200 ml-4 flex items-center px-3">
                        <div className="w-full h-1 bg-stone-100 rounded" />
                      </div>
                    </div>

                    {/* Blog Content with Specific Noisy Elements */}
                    <div className="flex-1 relative overflow-hidden bg-white">
                      <div className="p-8 space-y-6">
                        <div className="flex justify-between items-center">
                          <div className="h-8 w-32 bg-stone-100" />
                          <div className="h-6 w-48 bg-stone-50" />
                        </div>
                        <div className="h-10 w-3/4 bg-stone-200 rounded" />
                        <div className="grid grid-cols-3 gap-6">
                          <div className="col-span-2 space-y-6">
                            <img 
                              src="https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=2070&auto=format&fit=crop" 
                              alt="Ultimate Lasagna"
                              className="w-full h-64 object-cover rounded-xl"
                              referrerPolicy="no-referrer"
                            />
                            <div className="space-y-3">
                              <div className="h-4 bg-stone-100 w-full" />
                              <div className="h-4 bg-stone-100 w-full" />
                              <div className="h-4 bg-stone-100 w-5/6" />
                              <div className="h-4 bg-stone-100 w-4/6" />
                            </div>
                          </div>
                          {/* Sidebar Ads */}
                          <div className="space-y-4">
                            <div className="aspect-square bg-blue-100 rounded-lg flex flex-col items-center justify-center p-4 text-center border-2 border-blue-200 relative">
                              <div className="absolute -top-2 -right-2 bg-stone-400 text-white text-[6px] px-1 rounded uppercase">Ad</div>
                              <div className="text-[10px] font-black text-blue-600 leading-tight">SAVE 30% NOW AUTO INSURANCE</div>
                              <div className="mt-2 text-[8px] bg-blue-600 text-white px-2 py-1 rounded">LEARN MORE</div>
                            </div>
                            <div className="aspect-[4/5] bg-red-50 rounded-lg border-2 border-red-100 p-4 flex flex-col items-center justify-center relative overflow-hidden">
                              <div className="absolute -top-2 -right-2 bg-stone-400 text-white text-[6px] px-1 rounded uppercase">Ad</div>
                              <div className="bg-red-600 text-white text-[8px] font-bold px-2 py-0.5 rounded rotate-12 absolute top-2 right-2">50% OFF</div>
                              <div className="mt-auto text-[10px] font-black text-red-600 leading-tight">KITCHEN PRO 5000</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* The Big Newsletter Popup from Screenshot */}
                      <div className="absolute inset-0 bg-stone-900/10 backdrop-blur-[1px] flex items-center justify-center p-12">
                        <div className="bg-[#0099e5] text-white p-8 rounded-2xl shadow-2xl w-full max-w-sm text-center relative pointer-events-none">
                          <div className="absolute top-4 right-4 text-white/60">✕</div>
                          <h3 className="text-xl font-black mb-2 uppercase italic tracking-tighter">Stay Connected!</h3>
                          <p className="text-xs mb-6 text-blue-50">Sign up for our Newsletter!</p>
                          <div className="space-y-3">
                            <div className="h-10 bg-white/20 rounded-lg border border-white/30" />
                            <div className="h-10 bg-white/20 rounded-lg border border-white/30" />
                            <div className="h-12 bg-white text-[#0099e5] font-black uppercase tracking-widest flex items-center justify-center rounded-lg shadow-lg">JOIN NOW!</div>
                          </div>
                        </div>
                      </div>

                      {/* Cookie Notice Footer */}
                      <div className="absolute bottom-0 left-0 right-0 bg-stone-900/90 text-white text-[8px] p-2 flex items-center justify-between">
                        <span>We use cookies to improve your messy experience...</span>
                        <div className="bg-kitchen-primary px-3 py-1 rounded-sm">ACCEPT</div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* After: ReciBee Card */}
                <motion.div 
                  initial={{ rotateY: 20, x: 20 }}
                  animate={{ 
                    rotateY: mockupView === 'after' ? 0 : 5,
                    x: mockupView === 'after' ? 0 : 48,
                    scale: mockupView === 'after' ? 1 : 0.9,
                    opacity: mockupView === 'after' ? 1 : 0.3,
                    filter: mockupView === 'after' ? 'blur(0px)' : 'blur(4px)',
                    zIndex: mockupView === 'after' ? 30 : 20
                  }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => setMockupView('after')}
                  className="absolute inset-0 bg-white rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(234,88,12,0.15)] border-4 border-white overflow-hidden transform perspective-1000 cursor-pointer"
                >
                  <div className="h-full flex flex-col">
                    {/* Fake Header */}
                    <div className="p-6 bg-kitchen-bg border-b border-kitchen-border">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex gap-2">
                          <div className="px-2 py-0.5 bg-orange-50 text-kitchen-primary text-[8px] font-bold uppercase rounded-lg border border-orange-100">Smart Scraper</div>
                        </div>
                        <ChefHat size={16} className="text-kitchen-primary" />
                      </div>
                      <h4 className="text-xl font-serif font-bold text-kitchen-text">Carrot & Ginger Soup</h4>
                      <p className="text-[10px] text-kitchen-muted font-bold uppercase tracking-widest mt-1">by @ChefBee</p>
                    </div>
                    {/* Fake Details */}
                    <div className="p-6 bg-white flex-1 space-y-6">
                      <div className="grid grid-cols-3 gap-4 border-b border-kitchen-border pb-6">
                        <div className="space-y-1">
                          <div className="text-[8px] font-bold text-kitchen-muted uppercase tracking-widest">Prep</div>
                          <div className="text-xs font-bold">15 min</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[8px] font-bold text-kitchen-muted uppercase tracking-widest">Cook</div>
                          <div className="text-xs font-bold">40 min</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[8px] font-bold text-kitchen-muted uppercase tracking-widest">Servings</div>
                          <div className="text-xs font-bold">4 bowl</div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h5 className="text-[10px] font-bold text-kitchen-muted uppercase tracking-widest">Ingredients</h5>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between py-1 border-b border-stone-50">
                            <span className="text-xs text-kitchen-text font-medium">Carrots, peeled</span>
                            <span className="text-xs text-kitchen-muted">1 kg</span>
                          </div>
                          <div className="flex items-center justify-between py-1 border-b border-stone-50">
                            <span className="text-xs text-kitchen-text font-medium text-kitchen-primary">Fresh Ginger</span>
                            <span className="text-xs text-kitchen-muted">2 tbsp</span>
                          </div>
                          <div className="flex items-center justify-between py-1 border-b border-stone-50">
                            <span className="text-xs text-kitchen-text font-medium">Vegetable Stock</span>
                            <span className="text-xs text-kitchen-muted">1.5 L</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
                
                {/* Labels / Toggles */}
                <div className="absolute -bottom-16 left-0 right-0 flex justify-center gap-4 z-40">
                  <button 
                    onClick={() => setMockupView('before')}
                    className={`text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl border transition-all duration-300 ${
                      mockupView === 'before' 
                        ? 'text-white bg-kitchen-text border-kitchen-text shadow-lg scale-110' 
                        : 'text-kitchen-muted bg-white/80 backdrop-blur border-kitchen-border hover:bg-stone-50'
                    }`}
                  >
                    The Blog Noise
                  </button>
                  <div className="w-[1px] h-8 bg-kitchen-border self-center" />
                  <button 
                    onClick={() => setMockupView('after')}
                    className={`text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl border transition-all duration-300 ${
                      mockupView === 'after' 
                        ? 'text-white bg-kitchen-primary border-kitchen-primary shadow-lg scale-110' 
                        : 'text-kitchen-muted bg-white/80 backdrop-blur border-kitchen-border hover:bg-stone-50 shadow-sm'
                    }`}
                  >
                    Pure ReciBee
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

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

      {/* Features Section */}
      <section className="py-24 px-6 bg-white relative">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center space-y-4 mb-20">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-kitchen-text">Precision in Every Recipe.</h2>
            <p className="text-kitchen-muted text-lg max-w-2xl mx-auto font-light">
              We've stripped away the noise to give you the most powerful recipe notebook ever built.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Card 1: The Scraper */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="group relative bg-white p-12 rounded-3xl border border-kitchen-border shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(234,88,12,0.08)] transition-all duration-500 overflow-hidden"
            >
              {/* Subtle background texture/glow */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              <div className="relative mb-10">
                <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-kitchen-primary transform group-hover:rotate-6 transition-transform duration-500">
                  <div className="absolute inset-0 bg-kitchen-primary opacity-5 rounded-2xl scale-110 group-hover:scale-125 transition-transform duration-500" />
                  <Zap size={32} strokeWidth={1.5} />
                </div>
              </div>
              
              <h3 className="text-3xl font-serif font-bold text-kitchen-text mb-5 tracking-tight">Ad-Free Importing</h3>
              <p className="text-kitchen-muted leading-relaxed font-light text-lg">
                Instantly scrape the ingredients and steps from any food blog. No ads, no stories, <span className="text-kitchen-text font-medium italic">just the food.</span>
              </p>
            </motion.div>

            {/* Card 2: The Notebook */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="group relative bg-white p-12 rounded-3xl border border-kitchen-border shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(234,88,12,0.08)] transition-all duration-500 overflow-hidden"
            >
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              <div className="relative mb-10">
                <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-kitchen-primary transform group-hover:-rotate-6 transition-transform duration-500">
                  <div className="absolute inset-0 bg-kitchen-primary opacity-5 rounded-2xl scale-110 group-hover:scale-125 transition-transform duration-500" />
                  <Pencil size={32} strokeWidth={1.5} />
                </div>
              </div>

              <h3 className="text-3xl font-serif font-bold text-kitchen-text mb-5 tracking-tight">Living Versions</h3>
              <p className="text-kitchen-muted leading-relaxed font-light text-lg">
                Every recipe is a starting point. Tweak measurements, swap ingredients, and save your own versions <span className="text-kitchen-text font-medium italic">without losing the original.</span>
              </p>
            </motion.div>

            {/* Card 3: Community Proof */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="group relative bg-white p-12 rounded-3xl border border-kitchen-border shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(234,88,12,0.08)] transition-all duration-500 overflow-hidden"
            >
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              <div className="relative mb-10">
                <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-kitchen-primary transform group-hover:rotate-12 transition-transform duration-500">
                  <div className="absolute inset-0 bg-kitchen-primary opacity-5 rounded-2xl scale-110 group-hover:scale-125 transition-transform duration-500" />
                  <Users size={32} strokeWidth={1.5} />
                </div>
              </div>

              <h3 className="text-3xl font-serif font-bold text-kitchen-text mb-5 tracking-tight">Community Tested</h3>
              <p className="text-kitchen-muted leading-relaxed font-light text-lg">
                See how other cooks have tweaked a dish. Find the version that <span className="text-kitchen-text font-medium italic">fits your kitchen.</span>
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Philosophy Section - Big Typography */}
      <section className="py-40 px-6 bg-white relative overflow-hidden">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8"
          >
            <div className="text-kitchen-primary font-bold text-xs uppercase tracking-[0.3em]">The Philosophy</div>
            <h2 className="text-5xl md:text-8xl font-serif font-bold tracking-tight leading-[0.9] text-kitchen-text">
              Recipes are <br />
              <span className="text-kitchen-muted italic">Personal.</span>
            </h2>
            <p className="text-xl md:text-2xl text-kitchen-muted leading-relaxed font-light mx-auto max-w-2xl">
              We believe the best dishes are built through iteration. A recipe is just the beginning—your tweaks and adjustments are what make it yours.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Live Preview Section */}
      <section className="py-48 px-6 bg-[#fafafa] relative overflow-hidden">
        {/* Subtle background element */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl border-x border-stone-100 pointer-events-none" />
        
        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="flex flex-col items-center text-center space-y-16">
            <div className="space-y-6">
              <h2 className="text-4xl md:text-7xl font-serif font-bold tracking-tight text-kitchen-text">Kitchen Precision.</h2>
              <p className="text-kitchen-muted text-xl md:text-2xl max-w-2xl mx-auto font-light leading-relaxed">
                Our interface is designed for clarity. Track adjustments, save community favorites, and manage your culinary notebook with ease.
              </p>
            </div>

            <div className="w-full space-y-10">
              {/* Card 1: Forked Version */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.98, y: 30 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white border border-kitchen-border p-10 md:p-14 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_40px_80px_-12px_rgba(234,88,12,0.12)] rounded-[2rem] relative group transition-all duration-700"
              >
                <div className="flex flex-col space-y-8 text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 border border-stone-200 text-[10px] font-bold text-stone-500 uppercase tracking-[0.15em] rounded-lg bg-stone-50/50">Public Recipe</span>
                      <span className="px-3 py-1 bg-orange-50 text-kitchen-primary text-[10px] font-bold uppercase tracking-[0.15em] flex items-center gap-2 rounded-lg border border-orange-100/50">
                        <div className="w-1.5 h-1.5 bg-kitchen-primary rounded-full animate-pulse" />
                        Modified Tweak
                      </span>
                    </div>
                    <button className="flex items-center gap-2 bg-stone-100/50 border border-stone-200 px-6 py-3 rounded-2xl text-xs font-bold text-stone-700 hover:bg-stone-200/50 transition-all hover:scale-105 active:scale-95">
                      <Pencil size={16} strokeWidth={2.5} className="text-kitchen-primary" />
                      SAVE NEW VERSION
                    </button>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4">
                    <h3 className="text-3xl md:text-4xl font-serif font-bold tracking-tight text-kitchen-text leading-tight">
                      <span>Carrot & Ginger Soup — <span className="italic text-stone-400">Bee's Tweak</span></span>
                    </h3>
                    <span className="text-xs text-stone-400 font-bold uppercase tracking-widest whitespace-nowrap">Updated 10 Apr 2026</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-8 text-xs text-stone-500 font-bold uppercase tracking-widest pt-4 border-t border-stone-100">
                    <div className="flex items-center gap-2 group/stat cursor-pointer hover:text-kitchen-primary transition-colors">
                      <Users size={16} strokeWidth={2} />
                      <span>{12} likes</span>
                    </div>
                    <div className="flex items-center gap-2 group/stat cursor-pointer hover:text-kitchen-primary transition-colors">
                      <Star size={16} strokeWidth={2} />
                      <span>4 copies</span>
                    </div>
                    <div className="flex items-center gap-2 text-kitchen-primary bg-orange-50/50 px-3 py-1.5 rounded-full border border-orange-100/30">
                      <ChefHat size={16} strokeWidth={2.5} className="rotate-180" />
                      <span>Tweak of Master Recipe</span>
                    </div>
                    <div className="flex items-center gap-2 ml-auto text-stone-400">
                      <Globe size={16} />
                      <span>nytcooking.com</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Card 2: Original Version */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.98, y: 30 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white border border-kitchen-border p-10 md:p-14 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_40px_80px_-12px_rgba(234,88,12,0.12)] rounded-[2rem] relative group/secondary transition-all duration-700 opacity-60 grayscale hover:grayscale-0 hover:opacity-100"
              >
                <div className="flex flex-col space-y-8 text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 border border-stone-200 text-[10px] font-bold text-stone-500 uppercase tracking-[0.15em] rounded-lg bg-stone-50/50">Origin Source</span>
                    </div>
                    <button className="flex items-center gap-2 bg-stone-100/50 border border-stone-200 px-6 py-3 rounded-2xl text-xs font-bold text-stone-700 hover:bg-stone-200/50 transition-all">
                      <Search size={16} strokeWidth={2.5} />
                      VIEW ORIGINAL
                    </button>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4">
                    <h3 className="text-3xl md:text-4xl font-serif font-bold tracking-tight text-kitchen-text leading-tight">
                      <span>Pure Carrot & Ginger Soup</span>
                    </h3>
                    <span className="text-xs text-stone-400 font-bold uppercase tracking-widest whitespace-nowrap">Updated 9 Apr 2026</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-8 text-xs text-stone-500 font-bold uppercase tracking-widest pt-4 border-t border-stone-100">
                    <div className="flex items-center gap-2">
                      <Star size={16} strokeWidth={2} />
                      <span>45 likes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChefHat size={16} strokeWidth={2} />
                      <span>18 copies</span>
                    </div>
                    <div className="flex items-center gap-2 ml-auto text-stone-400">
                      <Globe size={16} />
                      <span>nytcooking.com</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-56 px-6 relative overflow-hidden bg-kitchen-text">
        <div className="absolute inset-0 bg-kitchen-text" />
        <div className="absolute inset-0 opacity-[0.03] scale-150" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(234,88,12,0.15),transparent_70%)]" />
        
        <div className="container mx-auto max-w-4xl relative z-10 text-center space-y-16">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8"
          >
            <h2 className="text-6xl md:text-9xl font-serif font-bold tracking-tight leading-[0.9] text-white">
              Build your <br />
              <span className="text-kitchen-primary italic">Kitchen Legacy.</span>
            </h2>
            <p className="text-xl md:text-3xl text-stone-400 max-w-2xl mx-auto font-light leading-relaxed">
              Every dish is an evolution. Start your ad-free, noise-free, living recipe collection today.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link 
              to="/explore" 
              className="inline-flex items-center gap-6 bg-kitchen-primary text-white hover:bg-orange-700 px-16 py-8 text-3xl font-bold rounded-3xl transition-all hover:scale-105 active:scale-95 shadow-[0_32px_64px_-16px_rgba(234,88,12,0.3)] group"
            >
              Get Started Free
              <ArrowRight size={36} strokeWidth={2.5} className="group-hover:translate-x-3 transition-transform duration-500" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>

  );
}
