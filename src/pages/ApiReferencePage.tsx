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
    <div className="min-h-screen bg-carbon-gray-100 text-white pb-20 font-sans">
      <SEO 
        title="API Reference" 
        description="Technical documentation for the ReciBee API. Learn how to programmatically import recipes and integrate with our repository."
      />
      
      {/* Header */}
      <header className="bg-carbon-gray-90 border-b border-carbon-gray-80 px-6 py-4 sticky top-0 z-10">
        <div className="container mx-auto max-w-5xl flex items-center justify-between">
          <Link to="/explore" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="bg-carbon-blue-60 p-1.5">
              <ChefHat size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">ReciBee<span className="text-carbon-blue-60">/api</span></h1>
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
            <div className="flex items-center gap-2 text-carbon-blue-60 font-mono text-xs uppercase tracking-widest">
              <Terminal size={14} />
              <span>Developer Interface</span>
            </div>
            <h2 className="text-4xl font-bold tracking-tight">API Reference</h2>
            <p className="text-carbon-gray-30 text-lg max-w-2xl">
              Integrate ReciBee's powerful recipe extraction and repository features into your own tools and workflows.
            </p>
          </div>

          {/* Authentication Section */}
          <section className="bg-carbon-gray-90 border border-carbon-gray-80 p-8 space-y-4">
            <div className="flex items-center gap-3 text-white">
              <Shield className="text-carbon-blue-60" size={20} />
              <h3 className="text-xl font-semibold">Authentication</h3>
            </div>
            <p className="text-carbon-gray-30 text-sm leading-relaxed">
              All write operations require a valid Firebase ID Token passed in the <code className="bg-carbon-gray-100 px-1.5 py-0.5 rounded text-carbon-blue-60">Authorization</code> header as a Bearer token.
            </p>
            <div className="bg-carbon-gray-100 p-4 rounded border border-carbon-gray-80 font-mono text-xs text-carbon-gray-30 relative group">
              <pre>Authorization: Bearer {'<your_id_token>'}</pre>
              <button 
                onClick={() => copyToClipboard('Authorization: Bearer <your_id_token>', 'auth')}
                className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity hover:text-white"
              >
                {copied === 'auth' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              </button>
            </div>
          </section>

          {/* Endpoints */}
          <div className="space-y-12">
            <h3 className="text-sm font-mono text-carbon-gray-30 uppercase tracking-widest border-b border-carbon-gray-80 pb-4">Endpoints</h3>
            
            {endpoints.map((endpoint, idx) => (
              <div key={idx} className="space-y-6">
                <div className="flex items-center gap-4">
                  <span className={cn(
                    "px-2 py-1 text-[10px] font-bold rounded",
                    endpoint.method === 'POST' ? "bg-green-500/10 text-green-500" : "bg-blue-500/10 text-blue-500"
                  )}>
                    {endpoint.method}
                  </span>
                  <code className="text-lg font-mono font-semibold">{endpoint.path}</code>
                </div>
                
                <p className="text-carbon-gray-30 text-sm">{endpoint.description}</p>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-xs font-mono text-carbon-gray-30 uppercase">Parameters</h4>
                    {endpoint.params.length > 0 ? (
                      <div className="border border-carbon-gray-80 divide-y divide-carbon-gray-80">
                        {endpoint.params.map((param, pIdx) => (
                          <div key={pIdx} className="p-3 flex justify-between items-start gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm text-white">{param.name}</span>
                                {param.required && <span className="text-[10px] text-red-500 uppercase">Required</span>}
                              </div>
                              <p className="text-xs text-carbon-gray-30 mt-1">{param.description}</p>
                            </div>
                            <span className="text-[10px] font-mono text-carbon-gray-30 bg-carbon-gray-100 px-1.5 py-0.5 rounded">{param.type}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-carbon-gray-30 italic">No parameters required.</p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-mono text-carbon-gray-30 uppercase">Response Body</h4>
                    <div className="bg-carbon-gray-100 p-4 rounded border border-carbon-gray-80 font-mono text-xs text-carbon-gray-30 relative group">
                      <pre className="overflow-x-auto">{endpoint.response}</pre>
                      <button 
                        onClick={() => copyToClipboard(endpoint.response, `resp-${idx}`)}
                        className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity hover:text-white"
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
          <div className="pt-12 border-t border-carbon-gray-80 flex flex-col items-center text-center gap-6">
            <div className="p-4 bg-carbon-blue-60/10 rounded-full">
              <Code className="text-carbon-blue-60" size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">Need help integrating?</h3>
              <p className="text-carbon-gray-30 max-w-md">
                Check our documentation for high-level guides or reach out to our developer support team.
              </p>
            </div>
            <Link to="/docs" className="text-carbon-blue-60 hover:underline font-medium">
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
