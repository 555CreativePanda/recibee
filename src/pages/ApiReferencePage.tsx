import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ChefHat, Code, Globe, Zap, Database, Terminal, Shield, ArrowLeft, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { SEO } from '../components/SEO';

export function ApiReferencePage() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const endpoints = [
    {
      method: 'POST',
      path: '/api/import',
      description: 'Import a recipe from a third-party URL. Extracts ingredients, steps, and metadata.',
      auth: 'Required (Firebase Auth Token)',
      params: [
        { name: 'url', type: 'string', required: true, description: 'The absolute URL of the recipe page to import.' }
      ],
      response: `{
  "title": "Recipe Title",
  "ingredients": [
    { "item": "Flour", "amount": "2", "unit": "cups" }
  ],
  "steps": ["Mix ingredients", "Bake at 350F"],
  "source_url": "https://example.com/recipe"
}`
    },
    {
      method: 'GET',
      path: '/api/health',
      description: 'Check the status of the ReciBee API and database connection.',
      auth: 'None',
      params: [],
      response: `{
  "status": "ok",
  "timestamp": "2026-04-10T00:00:00Z",
  "database": "connected"
}`
    }
  ];

  return (
    <div className="min-h-screen bg-kitchen-bg text-kitchen-text pb-20 font-sans">
      <SEO 
        title="API Reference" 
        description="Technical documentation for the ReciBee API. Learn how to programmatically import recipes and integrate with our repository."
      />
      
      {/* Header */}
      <header className="bg-white border-b border-kitchen-border px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto max-w-5xl flex items-center justify-between">
          <Link to="/explore" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="bg-kitchen-primary p-1.5 rounded-xl">
              <ChefHat size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-serif font-bold tracking-tight text-kitchen-text">ReciBee<span className="text-kitchen-primary font-sans ml-1 text-sm">/api</span></h1>
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
            <div className="flex items-center gap-2 text-kitchen-primary font-bold text-xs uppercase tracking-widest">
              <Terminal size={14} />
              <span>Developer Interface</span>
            </div>
            <h2 className="text-4xl font-serif font-bold tracking-tight text-kitchen-text">API Reference</h2>
            <p className="text-kitchen-muted text-lg max-w-2xl">
              Integrate ReciBee's powerful recipe extraction features into your own tools and workflows.
            </p>
          </div>

          {/* Authentication Section */}
          <section className="bg-white border border-kitchen-border p-8 rounded-2xl shadow-md space-y-4">
            <div className="flex items-center gap-3 text-kitchen-text">
              <Shield className="text-kitchen-primary" size={20} />
              <h3 className="text-xl font-serif font-bold">Authentication</h3>
            </div>
            <p className="text-kitchen-muted text-sm leading-relaxed">
              All write operations require a valid Firebase ID Token passed in the <code className="bg-stone-50 px-1.5 py-0.5 rounded text-kitchen-primary font-mono">Authorization</code> header as a Bearer token.
            </p>
            <div className="bg-stone-50 p-4 rounded-xl border border-kitchen-border font-mono text-xs text-kitchen-muted relative group">
              <pre>Authorization: Bearer {'<your_id_token>'}</pre>
              <button 
                onClick={() => copyToClipboard('Authorization: Bearer <your_id_token>', 'auth')}
                className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity hover:text-kitchen-primary"
              >
                {copied === 'auth' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              </button>
            </div>
          </section>

          {/* Endpoints */}
          <div className="space-y-12">
            <h3 className="text-sm font-bold text-kitchen-muted uppercase tracking-widest border-b border-kitchen-border pb-4">Endpoints</h3>
            
            {endpoints.map((endpoint, idx) => (
              <div key={idx} className="space-y-6 bg-white border border-kitchen-border p-8 rounded-2xl shadow-md">
                <div className="flex items-center gap-4">
                  <span className={cn(
                    "px-3 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider",
                    endpoint.method === 'POST' ? "bg-green-50 text-green-600 border border-green-100" : "bg-blue-50 text-blue-600 border border-blue-100"
                  )}>
                    {endpoint.method}
                  </span>
                  <code className="text-lg font-mono font-bold text-kitchen-text">{endpoint.path}</code>
                </div>
                
                <p className="text-kitchen-muted text-sm leading-relaxed">{endpoint.description}</p>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-kitchen-muted uppercase tracking-widest">Parameters</h4>
                    {endpoint.params.length > 0 ? (
                      <div className="border border-kitchen-border rounded-xl overflow-hidden divide-y divide-kitchen-border">
                        {endpoint.params.map((param, pIdx) => (
                          <div key={pIdx} className="p-4 flex justify-between items-start gap-4 bg-stone-50/30">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-bold text-kitchen-text">{param.name}</span>
                                {param.required && <span className="text-[10px] text-red-500 font-bold uppercase">Required</span>}
                              </div>
                              <p className="text-xs text-kitchen-muted mt-1">{param.description}</p>
                            </div>
                            <span className="text-[10px] font-mono text-kitchen-muted bg-stone-100 px-2 py-1 rounded-lg">{param.type}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-kitchen-muted italic">No parameters required.</p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-kitchen-muted uppercase tracking-widest">Response Body</h4>
                    <div className="bg-stone-50 p-4 rounded-xl border border-kitchen-border font-mono text-xs text-kitchen-muted relative group">
                      <pre className="overflow-x-auto">{endpoint.response}</pre>
                      <button 
                        onClick={() => copyToClipboard(endpoint.response, `resp-${idx}`)}
                        className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity hover:text-kitchen-primary"
                      >
                        {copied === `resp-${idx}` ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer CTA */}
          <div className="pt-12 border-t border-kitchen-border flex flex-col items-center text-center gap-6">
            <div className="p-5 bg-orange-50 rounded-full">
              <Code className="text-kitchen-primary" size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-serif font-bold text-kitchen-text">Need help integrating?</h3>
              <p className="text-kitchen-muted max-w-md">
                Check our guides for high-level documentation or reach out to our community.
              </p>
            </div>
            <Link to="/docs" className="text-kitchen-primary hover:underline font-bold uppercase tracking-widest text-sm">
              View Documentation
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
