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
  Zap
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { FeatureRequest } from '../types';
import { 
  getFeatureRequests, 
  createFeatureRequest, 
  voteOnFeature, 
  getUserVote 
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
        const votes: Record<string, 'up' | null> = { ...userVotes };
        for (const feature of result.features) {
          const vote = await getUserVote(feature.id, user.uid);
          votes[feature.id] = vote && vote.type === 'up' ? 'up' : null;
        }
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
    <div className="min-h-screen bg-carbon-gray-100 text-white pb-20 font-sans">
      <SEO 
        title="Feature Requests" 
        description="Help us shape the future of ReciBee. Request new features and vote on community suggestions."
      />
      
      {/* Header */}
      <header className="bg-carbon-gray-90 border-b border-carbon-gray-80 px-6 py-4 sticky top-0 z-10">
        <div className="container mx-auto max-w-5xl flex items-center justify-between">
          <Link to="/explore" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="bg-carbon-blue-60 p-1.5">
              <ChefHat size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">ReciBee<span className="text-carbon-blue-60">/features</span></h1>
          </Link>
          <Link to="/" className="text-sm font-medium text-carbon-gray-30 hover:text-white transition-colors">
            Back to Home
          </Link>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-6 pt-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">Feature Requests</h2>
            <p className="text-carbon-gray-30 text-lg max-w-2xl">
              Help us shape the future of ReciBee.
            </p>
          </div>
          
          <button
            onClick={() => {
              if (ensureAuth('request a feature')) {
                setIsModalOpen(true);
              }
            }}
            className="flex items-center gap-2 bg-carbon-blue-60 hover:bg-carbon-blue-70 text-white px-6 py-3 text-sm font-bold uppercase tracking-widest transition-all"
          >
            <Plus size={18} />
            Request Feature
          </button>
        </div>

        <div className="space-y-4">
          {features.map((feature) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-carbon-gray-90 border border-carbon-gray-80 p-6 flex gap-6"
            >
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => handleVote(feature.id)}
                  className={cn(
                    "p-3 transition-all rounded-full hover:bg-carbon-gray-80",
                    userVotes[feature.id] === 'up' ? "text-carbon-blue-60 bg-carbon-blue-60/10" : "text-carbon-gray-40 hover:text-white"
                  )}
                >
                  <ThumbsUp size={24} />
                </button>
                <span className="font-mono font-bold text-lg text-white">
                  {feature.upvotes}
                </span>
              </div>

              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-carbon-gray-30 text-sm leading-relaxed mb-4">
                  {feature.description}
                </p>
                <div className="flex items-center gap-4 text-[10px] font-mono text-carbon-gray-40 uppercase tracking-widest">
                  <span className="flex items-center gap-1">
                    <MessageSquare size={12} />
                    {feature.user_email || 'Anonymous'}
                  </span>
                  <span>
                    {new Date(feature.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <div className="flex justify-center py-12">
              <Loader2 className="text-carbon-blue-60 animate-spin" size={32} />
            </div>
          )}

          {!isLoading && features.length === 0 && (
            <div className="text-center py-20 bg-carbon-gray-90 border border-carbon-gray-80 border-dashed">
              <p className="text-carbon-gray-30 font-mono text-sm uppercase tracking-widest">No feature requests yet</p>
            </div>
          )}

          {hasMore && !isLoading && (
            <button
              onClick={() => loadFeatures(true)}
              className="w-full py-4 text-[10px] font-mono uppercase tracking-[0.3em] text-carbon-gray-40 hover:text-white transition-colors"
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
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-carbon-gray-90 border border-carbon-gray-80 w-full max-w-lg p-8 relative"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-carbon-gray-40 hover:text-white"
              >
                <X size={20} />
              </button>

              <h2 className="text-2xl font-bold text-white mb-6 uppercase tracking-tight">New Feature Request</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase tracking-widest text-carbon-gray-40 font-mono">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Brief summary of the feature"
                    className="w-full bg-carbon-gray-100 border border-carbon-gray-80 p-3 text-sm text-white outline-none focus:border-carbon-blue-60 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] uppercase tracking-widest text-carbon-gray-40 font-mono">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Explain why this feature would be useful..."
                    rows={5}
                    className="w-full bg-carbon-gray-100 border border-carbon-gray-80 p-3 text-sm text-white outline-none focus:border-carbon-blue-60 transition-colors resize-none"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-500 text-xs font-mono">
                    <AlertCircle size={14} />
                    {error}
                  </div>
                )}

                {success && (
                  <div className="flex items-center gap-2 text-carbon-blue-60 text-xs font-mono">
                    <CheckCircle2 size={14} />
                    {success}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-carbon-blue-60 hover:bg-carbon-blue-70 disabled:opacity-50 text-white py-4 text-sm font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Submit Request'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
