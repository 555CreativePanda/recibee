import { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { updateUserProfile, getUserProfile } from '../services/userService';
import { X, User, Mail, FileText, Save, Loader2, Check, Star } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface UserProfileModalProps {
  uid: string;
  currentUserId: string | null;
  mode: 'view' | 'edit';
  onClose: () => void;
  onProfileUpdate?: (profile: UserProfile) => void;
}

const AVATAR_SEEDS = ['Felix', 'Aneka', 'Max', 'Luna', 'Oliver', 'Sophie', 'Leo', 'Milo'];

export function UserProfileModal({ uid, currentUserId, mode, onClose, onProfileUpdate }: UserProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editPhoto, setEditPhoto] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const data = await getUserProfile(uid);
        if (data) {
          setProfile(data);
          setEditName(data.displayName || '');
          setEditBio(data.bio || '');
          setEditPhoto(data.photoURL || '');
        }
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [uid]);

  const handleSave = async () => {
    if (!currentUserId || currentUserId !== uid) return;
    setSaving(true);
    try {
      const updates = {
        displayName: editName,
        bio: editBio,
        photoURL: editPhoto
      };
      await updateUserProfile(uid, updates);
      const updatedProfile = { ...profile!, ...updates };
      setProfile(updatedProfile);
      if (onProfileUpdate) onProfileUpdate(updatedProfile);
      onClose();
    } catch (err) {
      setError('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const isEditable = mode === 'edit' && currentUserId === uid;
  const hasChanges = profile && (
    editName !== (profile.displayName || '') ||
    editBio !== (profile.bio || '') ||
    editPhoto !== (profile.photoURL || '')
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white border border-kitchen-border w-full max-w-md overflow-hidden rounded-3xl shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-kitchen-border bg-stone-50/50">
          <h2 className="text-xl font-serif font-bold flex items-center gap-3 text-kitchen-text">
            <div className="bg-kitchen-primary/10 p-2 rounded-xl">
              <User size={20} className="text-kitchen-primary" />
            </div>
            {isEditable ? 'Edit Your Profile' : 'User Profile'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-stone-100 transition-colors text-stone-400 hover:text-kitchen-primary rounded-full"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <Loader2 className="animate-spin text-kitchen-primary" size={40} />
              <p className="text-sm text-kitchen-muted font-bold uppercase tracking-widest">Fetching profile data...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 bg-red-50 rounded-2xl border border-red-100">
              <p className="text-red-600 font-medium">{error}</p>
              <button onClick={onClose} className="mt-4 text-kitchen-primary font-bold hover:underline text-sm uppercase tracking-widest">Close</button>
            </div>
          ) : (
            <>
              {/* Avatar Section */}
              <div className="flex flex-col items-center space-y-6">
                <div className="relative group">
                  <div className="w-28 h-28 rounded-full border-4 border-white shadow-xl p-1 bg-stone-50 overflow-hidden ring-1 ring-kitchen-border">
                    <img 
                      src={editPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.uid}`} 
                      alt="Avatar"
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                </div>

                {isEditable && (
                  <div className="w-full space-y-4">
                    <p className="text-[10px] uppercase tracking-widest text-kitchen-muted font-bold text-center">Choose an Avatar</p>
                    <div className="flex flex-wrap justify-center gap-3">
                      {AVATAR_SEEDS.map((seed) => {
                        const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
                        return (
                          <button
                            key={seed}
                            onClick={() => setEditPhoto(url)}
                            className={cn(
                              "w-12 h-12 rounded-full border-2 transition-all p-1 bg-stone-50 shadow-sm",
                              editPhoto === url 
                                ? "border-kitchen-primary scale-110 shadow-lg shadow-orange-100" 
                                : "border-transparent hover:border-stone-200 hover:scale-105"
                            )}
                          >
                            <img src={url} alt={seed} className="w-full h-full rounded-full" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Stats Section */}
              <div className="flex justify-center gap-12 bg-stone-50/50 border border-kitchen-border py-6 rounded-3xl">
                <div className="text-center group">
                  <div className="flex items-center gap-2 mb-1 justify-center transition-transform group-hover:scale-110">
                    <Star size={16} className="text-orange-600 fill-orange-600" />
                    <p className="text-2xl font-serif font-bold text-kitchen-text">{profile?.star_count || 0}</p>
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-kitchen-muted font-bold">Total Stars</p>
                </div>
              </div>

              {/* Info Section */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-kitchen-muted font-bold flex items-center gap-2">
                    <User size={14} /> Display Name
                  </label>
                  {isEditable ? (
                    <input 
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-stone-50 border border-kitchen-border rounded-2xl p-4 text-sm text-kitchen-text focus:border-kitchen-primary focus:ring-4 focus:ring-orange-50 outline-none transition-all placeholder:text-stone-300"
                      placeholder="Your name"
                    />
                  ) : (
                    <p className="text-sm font-bold text-kitchen-text p-4 bg-stone-50 rounded-2xl border border-kitchen-border/50">
                      {profile?.displayName || 'Anonymous Chef'}
                    </p>
                  )}
                </div>

                {profile?.email && currentUserId === uid && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase tracking-widest text-kitchen-muted font-bold flex items-center gap-2">
                        <Mail size={14} /> Email Address
                      </label>
                      <span className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Read-only</span>
                    </div>
                    <p className="text-sm text-kitchen-muted p-4 bg-stone-50 rounded-2xl border border-kitchen-border/50 font-mono">
                      {profile.email}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-kitchen-muted font-bold flex items-center gap-2">
                    <FileText size={14} /> Bio
                  </label>
                  {isEditable ? (
                    <textarea 
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      rows={4}
                      className="w-full bg-stone-50 border border-kitchen-border rounded-2xl p-4 text-sm text-kitchen-text focus:border-kitchen-primary focus:ring-4 focus:ring-orange-50 outline-none transition-all resize-none placeholder:text-stone-300"
                      placeholder="Tell us about your culinary journey..."
                    />
                  ) : (
                    <div className="text-sm text-kitchen-muted p-4 bg-stone-50 rounded-2xl border border-kitchen-border/50 min-h-[80px] whitespace-pre-wrap italic leading-relaxed">
                      {profile?.bio || 'No bio provided yet.'}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              {isEditable && (
                <div className="pt-6 border-t border-kitchen-border">
                  <button
                    onClick={handleSave}
                    disabled={saving || !hasChanges}
                    className="w-full flex items-center justify-center gap-3 bg-kitchen-primary hover:bg-orange-700 disabled:opacity-30 disabled:cursor-not-allowed text-white py-4 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-orange-100 uppercase tracking-widest active:scale-95"
                  >
                    {saving ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <Save size={20} />
                    )}
                    {!hasChanges ? 'No Changes to Save' : 'Save Profile Changes'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
