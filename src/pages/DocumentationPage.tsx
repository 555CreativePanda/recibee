import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ChefHat, GitBranch, Download, Star, Users, ArrowLeft, Book, Code, Zap, Database, Search, Shield } from 'lucide-react';
import { SEO } from '../components/SEO';

export function DocumentationPage() {
  const sections = [
    {
      id: 'introduction',
      title: 'Introduction',
      icon: <ChefHat className="text-kitchen-primary" />,
      content: 'ReciBee is a digital kitchen notebook designed for the modern home cook. Inspired by the clarity of technical documentation, it treats recipes as living documents that can be imported, tweaked, and improved over time.'
    },
    {
      id: 'importing',
      title: 'Importing Recipes',
      icon: <Download className="text-kitchen-primary" />,
      content: 'The core of ReciBee is its powerful import engine. Simply paste a URL from any food blog or recipe site. Our system strips away the ads, popups, and long-winded stories, extracting only the ingredients and steps into a clean, structured format.'
    },
    {
      id: 'forking',
      title: 'Tweaking',
      icon: <GitBranch className="text-kitchen-primary" />,
      content: 'Found a recipe but want to make it your own? Use the "Tweak" feature. This creates a personal copy of the recipe in your notebook. You can then modify ingredients or steps while maintaining a link to the original "parent" recipe.'
    },
    {
      id: 'collaboration',
      title: 'Community & Favorites',
      icon: <Star className="text-kitchen-primary" />,
      content: 'ReciBee is built for community. You can "Like" recipes to save them to your favorites, see how many times a recipe has been tweaked, and explore different versions of the same dish created by other cooks.'
    },
    {
      id: 'search',
      title: 'Smart Search',
      icon: <Search className="text-kitchen-primary" />,
      content: 'Our notebook is fully searchable. Filter by title, ingredients, or ownership. Whether you are looking for your own creations or exploring the community database, finding the right recipe is instantaneous.'
    },
    {
      id: 'technical',
      title: 'Kitchen Precision',
      icon: <Code className="text-kitchen-primary" />,
      content: 'Recipes are stored with precision. Ingredients are broken down into items, amounts, and units, allowing for future features like automatic scaling and nutritional analysis.'
    }
  ];

  return (
    <div className="min-h-screen bg-kitchen-bg text-kitchen-text pb-20">
      <SEO 
        title="Documentation" 
        description="Learn how to use ReciBee: The digital kitchen notebook. Explore features like importing, saving, and tweaking recipes."
      />
      
      {/* Header */}
      <header className="bg-white border-b border-kitchen-border px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto max-w-5xl flex items-center justify-between">
          <Link to="/explore" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="bg-kitchen-primary p-1.5 rounded-xl">
              <ChefHat size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-serif font-bold tracking-tight text-kitchen-text">ReciBee<span className="text-kitchen-primary font-sans ml-1 text-sm">/docs</span></h1>
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
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-kitchen-text">Documentation</h2>
            <p className="text-kitchen-muted text-lg max-w-2xl">
              Everything you need to know about managing your digital kitchen notebook with ReciBee.
            </p>
          </div>

          <div className="grid gap-8">
            {sections.map((section, index) => (
              <motion.section
                key={section.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white border border-kitchen-border p-8 rounded-2xl shadow-md group hover:border-kitchen-primary/50 transition-colors"
              >
                <div className="flex items-start gap-6">
                  <div className="p-3 bg-stone-50 border border-kitchen-border rounded-xl group-hover:border-kitchen-primary/30 transition-colors">
                    {section.icon}
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-serif font-bold tracking-tight text-kitchen-text">{section.title}</h3>
                    <p className="text-kitchen-muted leading-relaxed">
                      {section.content}
                    </p>
                  </div>
                </div>
              </motion.section>
            ))}
          </div>

          <div className="bg-kitchen-primary p-10 text-center space-y-6 rounded-3xl shadow-xl">
            <h3 className="text-3xl font-serif font-bold text-white">Ready to start cooking?</h3>
            <p className="text-orange-100 max-w-xl mx-auto">
              Join the community today and start building your personal library of culinary favorites.
            </p>
            <div className="pt-4">
              <Link 
                to="/explore" 
                className="inline-flex items-center gap-2 bg-white text-kitchen-primary px-8 py-3 rounded-2xl font-bold hover:scale-105 transition-transform shadow-lg"
              >
                Open Recipes
                <Zap size={18} />
              </Link>
            </div>
          </div>

          <div className="pt-12 border-t border-kitchen-border">
            <h4 className="text-sm font-bold text-kitchen-muted uppercase tracking-widest mb-6">Use Cases</h4>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2 bg-white p-6 rounded-2xl border border-kitchen-border shadow-sm">
                <h5 className="font-serif font-bold text-lg text-kitchen-text">The Meal Prepper</h5>
                <p className="text-sm text-kitchen-muted leading-relaxed">Import 10 recipes in seconds, strip the fluff, and have a clean list of ingredients for your grocery run.</p>
              </div>
              <div className="space-y-2 bg-white p-6 rounded-2xl border border-kitchen-border shadow-sm">
                <h5 className="font-serif font-bold text-lg text-kitchen-text">The Experimental Chef</h5>
                <p className="text-sm text-kitchen-muted leading-relaxed">Save a copy of a classic recipe, swap an ingredient, and save your "v2.0" without losing the original source.</p>
              </div>
              <div className="space-y-2 bg-white p-6 rounded-2xl border border-kitchen-border shadow-sm">
                <h5 className="font-serif font-bold text-lg text-kitchen-text">The Organized Cook</h5>
                <p className="text-sm text-kitchen-muted leading-relaxed">Manage your recipes with structure. Clean, organized, and always accessible in your digital notebook.</p>
              </div>
              <div className="space-y-2 bg-white p-6 rounded-2xl border border-kitchen-border shadow-sm">
                <h5 className="font-serif font-bold text-lg text-kitchen-text">The Collaborative Family</h5>
                <p className="text-sm text-kitchen-muted leading-relaxed">Share a recipe box with family members. See who made the best tweak to Grandma's secret sauce.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
