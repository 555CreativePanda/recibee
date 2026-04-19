import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  ThumbsUp, 
  Plus, 
  MessageSquare, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  X,
  ChefHat,
  Zap,
  Clock
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { FeatureRequest } from '../types';
import { 
  getFeatureRequests, 
  createFeatureRequest, 
  voteOnFeature, 
  getUserVote,
  getUserVotesForFeatures
} from '../services/featureService';
import { cn } from '../lib/utils';
import { SEO } from '../components/SEO';

export function FeatureRequestPage({ ensureAuth }: { ensureAuth: (action: string) => boolean }) {
  const [features, setFeatures] = useState<FeatureRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userVotes, setUserVotes] = useState<Record<string, 'up' | null>>({});
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const user = auth.currentUser;

  useEffect(() => {
    loadFeatures();
  }, [user]); // Reload when user changes to get votes

  const loadFeatures = async (loadMore = false) => {
    try {
      setIsLoading(true);
      const result = await getFeatureRequests(loadMore ? lastVisible : null);
      
      if (loadMore) {
        setFeatures(prev => [...prev, ...result.features]);
      } else {
        setFeatures(result.features);
      }
      
      setLastVisible(result.lastVisible);
      setHasMore(result.features.length === 10);

      // Load user votes if logged in
      if (user) {
        const featureIds = result.features.map(f => f.id);
        const votesResult = await getUserVotesForFeatures(featureIds, user.uid);
        
        const votes: Record<string, 'up' | null> = { ...userVotes };
        featureIds.forEach(id => {
          votes[id] = votesResult[id] && votesResult[id].type === 'up' ? 'up' : null;
        });
        setUserVotes(votes);
      }
    } catch (err) {
      console.error('Error loading features:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!ensureAuth('request a feature')) return;
    if (!title.trim() || !description.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await createFeatureRequest(title, description, user!.uid, user!.email || '');
      setSuccess('Feature request submitted successfully!');
      setTitle('');
      setDescription('');
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccess(null);
        loadFeatures(); // Refresh list
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (featureId: string) => {
    if (!ensureAuth('vote on features')) return;

    const currentVote = userVotes[featureId];
    const newVote = currentVote === 'up' ? null : 'up';

    // Optimistic update
    setUserVotes(prev => ({ ...prev, [featureId]: newVote }));
    setFeatures(prev => prev.map(f => {
      if (f.id === featureId) {
        let upDiff = 0;

        // Remove old vote
        if (currentVote === 'up') upDiff--;

        // Add new vote
        if (newVote === 'up') upDiff++;

        const newUp = f.upvotes + upDiff;
        return {
          ...f,
          upvotes: newUp,
          score: newUp
        };
      }
      return f;
    }).sort((a, b) => b.score - a.score));

    try {
      await voteOnFeature(featureId, user!.uid, newVote);
    } catch (err) {
      console.error('Error voting:', err);
      // Revert optimistic update on error
      loadFeatures();
    }
  };

  return (
    <div className="min-h-screen bg-kitchen-bg text-kitchen-text pb-20 font-sans">
      <SEO 
        title="Feature Requests" 
        description="Help us shape the future of ReciBee. Request new features and vote on community suggestions."
      />
      
      {/* Header */}
      <header className="bg-white border-b border-kitchen-border px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto max-w-5xl flex items-center justify-between">
          <Link to="/explore" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="bg-kitchen-primary p-1.5 rounded-xl">
              <ChefHat size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-serif font-bold tracking-tight text-kitchen-text">ReciBee<span className="text-kitchen-primary font-sans ml-1 text-sm">/features</span></h1>
          </Link>
          <Link to="/" className="text-sm font-bold text-kitchen-muted hover:text-kitchen-primary transition-colors uppercase tracking-widest">
            Back to Home
          </Link>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-6 pt-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-kitchen-text mb-2">Feature Requests</h2>
            <p className="text-kitchen-muted text-lg max-w-2xl">
              Help us shape the future of ReciBee.
            </p>
          </div>
          
          <button
            onClick={() => {
              if (ensureAuth('request a feature')) {
                setIsModalOpen(true);
              }
            }}
            className="flex items-center gap-2 bg-kitchen-primary hover:bg-orange-700 text-white px-8 py-4 rounded-2xl shadow-lg shadow-orange-200 text-sm font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
          >
            <Plus size={18} />
            Request Feature
          </button>
        </div>

        <div className="space-y-6">
          {features.map((feature) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-kitchen-border p-8 rounded-3xl shadow-md flex gap-8 group hover:border-kitchen-primary/30 transition-colors"
            >
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => handleVote(feature.id)}
                  className={cn(
                    "p-4 transition-all rounded-2xl shadow-sm",
                    userVotes[feature.id] === 'up' 
                      ? "text-white bg-kitchen-primary shadow-orange-200" 
                      : "text-kitchen-muted bg-stone-50 hover:bg-stone-100 hover:text-kitchen-primary"
                  )}
                >
                  <ThumbsUp size={24} />
                </button>
                <span className="font-mono font-bold text-lg text-kitchen-text">
                  {feature.upvotes}
                </span>
              </div>

              <div className="flex-1">
                <h3 className="text-2xl font-serif font-bold text-kitchen-text mb-3">{feature.title}</h3>
                <p className="text-kitchen-muted text-sm leading-relaxed mb-6">
                  {feature.description}
                </p>
                <div className="flex items-center gap-6 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                  <span className="flex items-center gap-2">
                    <MessageSquare size={14} className="text-kitchen-primary" />
                    {feature.user_email || 'Anonymous'}
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock size={14} className="text-kitchen-primary" />
                    {new Date(feature.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <div className="flex justify-center py-12">
              <Loader2 className="text-kitchen-primary animate-spin" size={32} />
            </div>
          )}

          {!isLoading && features.length === 0 && (
            <div className="text-center py-20 bg-white border border-kitchen-border border-dashed rounded-3xl">
              <p className="text-kitchen-muted font-bold text-sm uppercase tracking-widest">No feature requests yet</p>
            </div>
          )}

          {hasMore && !isLoading && (
            <button
              onClick={() => loadFeatures(true)}
              className="w-full py-6 text-[10px] font-bold uppercase tracking-[0.3em] text-kitchen-muted hover:text-kitchen-primary transition-colors bg-white border border-kitchen-border rounded-2xl shadow-sm hover:shadow-md"
            >
              Load More Features
            </button>
          )}
        </div>
      </main>

      {/* Request Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-stone-900/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-kitchen-border w-full max-w-lg p-10 rounded-3xl shadow-2xl relative"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 text-stone-400 hover:text-kitchen-primary transition-colors"
              >
                <X size={24} />
              </button>

              <h2 className="text-3xl font-serif font-bold text-kitchen-text mb-8">New Feature Request</h2>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-3">
                  <label className="block text-[10px] uppercase tracking-widest text-kitchen-muted font-bold">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Brief summary of the feature"
                    className="w-full bg-stone-50 border border-kitchen-border rounded-2xl p-4 text-sm text-kitchen-text outline-none focus:border-kitchen-primary focus:ring-4 focus:ring-orange-50 transition-all"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] uppercase tracking-widest text-kitchen-muted font-bold">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Explain why this feature would be useful..."
                    rows={5}
                    className="w-full bg-stone-50 border border-kitchen-border rounded-2xl p-4 text-sm text-kitchen-text outline-none focus:border-kitchen-primary focus:ring-4 focus:ring-orange-50 transition-all resize-none"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-500 text-xs font-bold uppercase tracking-wider">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                {success && (
                  <div className="flex items-center gap-2 text-green-600 text-xs font-bold uppercase tracking-wider">
                    <CheckCircle2 size={16} />
                    {success}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-kitchen-primary hover:bg-orange-700 disabled:opacity-50 text-white py-5 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all shadow-lg shadow-orange-200 flex items-center justify-center gap-3"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (
                    <>
                      <Zap size={20} />
                      Submit Request
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
