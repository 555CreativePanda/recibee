import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ChefHat, GitBranch, Download, Star, Users, ArrowLeft, Book, Code, Zap, Database, Search, Shield } from 'lucide-react';
import { SEO } from '../components/SEO';

export function DocumentationPage() {
  const sections = [
    {
      id: 'introduction',
      title: 'Introduction',
      icon: <ChefHat className="text-carbon-blue-60" />,
      content: 'ReciBee is a technical recipe repository designed for the modern kitchen. Inspired by version control systems like Git, it treats recipes as "source code" that can be imported, branched, and improved collaboratively.'
    },
    {
      id: 'importing',
      title: 'Importing Recipes',
      icon: <Download className="text-carbon-blue-60" />,
      content: 'The core of ReciBee is its powerful import engine. Simply paste a URL from any food blog or recipe site. Our system strips away the ads, popups, and long-winded stories, extracting only the ingredients and steps into a clean, structured format.'
    },
    {
      id: 'forking',
      title: 'Forking & Versioning',
      icon: <GitBranch className="text-carbon-blue-60" />,
      content: 'Found a recipe but want to make it your own? Use the "Fork" feature. This creates a personal copy of the recipe in your repository. You can then modify ingredients or steps while maintaining a link to the original "parent" recipe.'
    },
    {
      id: 'collaboration',
      title: 'Social & Collaboration',
      icon: <Star className="text-carbon-blue-60" />,
      content: 'ReciBee is built for community. You can "Star" recipes to save them to your favorites, see how many times a recipe has been forked, and explore different "branches" of the same dish created by other chefs.'
    },
    {
      id: 'search',
      title: 'Advanced Search',
      icon: <Search className="text-carbon-blue-60" />,
      content: 'Our repository is fully searchable. Filter by title, ingredients, or ownership. Whether you are looking for your own creations or exploring the global database, finding the right recipe is instantaneous.'
    },
    {
      id: 'technical',
      title: 'Technical Precision',
      icon: <Code className="text-carbon-blue-60" />,
      content: 'Recipes are stored with technical precision. Ingredients are broken down into items, amounts, and units, allowing for future features like automatic scaling and nutritional analysis.'
    }
  ];

  return (
    <div className="min-h-screen bg-carbon-gray-100 text-white pb-20">
      <SEO 
        title="Documentation" 
        description="Learn how to use ReciBee: The Git-inspired recipe repository. Explore features like importing, forking, and versioning."
      />
      
      {/* Header */}
      <header className="bg-carbon-gray-90 border-b border-carbon-gray-80 px-6 py-4 sticky top-0 z-10">
        <div className="container mx-auto max-w-5xl flex items-center justify-between">
          <Link to="/explore" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="bg-carbon-blue-60 p-1.5">
              <ChefHat size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">ReciBee<span className="text-carbon-blue-60">/docs</span></h1>
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
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Documentation</h2>
            <p className="text-carbon-gray-30 text-lg max-w-2xl">
              Everything you need to know about managing your culinary repository with ReciBee.
            </p>
          </div>

          <div className="grid gap-8">
            {sections.map((section, index) => (
              <motion.section
                key={section.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-carbon-gray-90 border border-carbon-gray-80 p-8 group hover:border-carbon-blue-60/50 transition-colors"
              >
                <div className="flex items-start gap-6">
                  <div className="p-3 bg-carbon-gray-100 border border-carbon-gray-80 group-hover:border-carbon-blue-60/30 transition-colors">
                    {section.icon}
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-semibold tracking-tight">{section.title}</h3>
                    <p className="text-carbon-gray-30 leading-relaxed">
                      {section.content}
                    </p>
                  </div>
                </div>
              </motion.section>
            ))}
          </div>

          <div className="bg-carbon-blue-60 p-10 text-center space-y-6">
            <h3 className="text-3xl font-bold">Ready to start cooking?</h3>
            <p className="text-carbon-blue-10 max-w-xl mx-auto">
              Join the repository today and start building your personal library of culinary source code.
            </p>
            <div className="pt-4">
              <Link 
                to="/explore" 
                className="inline-flex items-center gap-2 bg-white text-carbon-blue-60 px-8 py-3 font-bold hover:scale-105 transition-transform"
              >
                Open Repository
                <Zap size={18} />
              </Link>
            </div>
          </div>

          <div className="pt-12 border-t border-carbon-gray-80">
            <h4 className="text-sm font-mono text-carbon-gray-30 uppercase tracking-widest mb-6">Use Cases</h4>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h5 className="font-semibold">The Meal Prepper</h5>
                <p className="text-sm text-carbon-gray-30">Import 10 recipes in seconds, strip the fluff, and have a clean list of ingredients for your grocery run.</p>
              </div>
              <div className="space-y-2">
                <h5 className="font-semibold">The Experimental Chef</h5>
                <p className="text-sm text-carbon-gray-30">Fork a classic recipe, swap an ingredient, and save your "v2.0" without losing the original source.</p>
              </div>
              <div className="space-y-2">
                <h5 className="font-semibold">The Developer</h5>
                <p className="text-sm text-carbon-gray-30">Manage your recipes like you manage your code. Clean, structured, and version-controlled.</p>
              </div>
              <div className="space-y-2">
                <h5 className="font-semibold">The Collaborative Family</h5>
                <p className="text-sm text-carbon-gray-30">Share a repository with family members. See who made the best "fork" of Grandma's secret sauce.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
