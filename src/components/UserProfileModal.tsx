import { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { updateUserProfile, getUserProfile } from '../services/userService';
import { X, User, Mail, FileText, Save, Loader2, Check } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-carbon-gray-90 border border-carbon-gray-80 w-full max-w-md overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-carbon-gray-80 bg-carbon-gray-100">
          <h2 className="text-lg font-medium flex items-center gap-2">
            <User size={18} className="text-carbon-blue-60" />
            {isEditable ? 'Edit Your Profile' : 'User Profile'}
          </h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-carbon-gray-80 transition-colors text-carbon-gray-30 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="animate-spin text-carbon-blue-60" size={32} />
              <p className="text-sm text-carbon-gray-30 font-mono">Fetching profile data...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 text-sm">{error}</p>
              <button onClick={onClose} className="mt-4 text-carbon-blue-60 hover:underline text-sm">Close</button>
            </div>
          ) : (
            <>
              {/* Avatar Section */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full border-2 border-carbon-blue-60/30 p-1 bg-carbon-gray-100 overflow-hidden">
                    <img 
                      src={editPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.uid}`} 
                      alt="Avatar"
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                </div>

                {isEditable && (
                  <div className="w-full space-y-3">
                    <p className="text-[10px] uppercase tracking-widest text-carbon-gray-30 font-bold text-center">Choose an Avatar</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {AVATAR_SEEDS.map((seed) => {
                        const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
                        return (
                          <button
                            key={seed}
                            onClick={() => setEditPhoto(url)}
                            className={cn(
                              "w-10 h-10 rounded-full border-2 transition-all p-0.5 bg-carbon-gray-100",
                              editPhoto === url ? "border-carbon-blue-60 scale-110" : "border-transparent hover:border-carbon-gray-70"
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

              {/* Info Section */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-carbon-gray-30 font-bold flex items-center gap-2">
                    <User size={12} /> Display Name
                  </label>
                  {isEditable ? (
                    <input 
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-carbon-gray-100 border border-carbon-gray-80 p-2 text-sm text-white focus:border-carbon-blue-60 outline-none transition-colors"
                      placeholder="Your name"
                    />
                  ) : (
                    <p className="text-sm font-medium text-white p-2 bg-carbon-gray-100/50 border border-transparent">
                      {profile?.displayName || 'Anonymous Chef'}
                    </p>
                  )}
                </div>

                {profile?.email && currentUserId === uid && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase tracking-widest text-carbon-gray-30 font-bold flex items-center gap-2">
                        <Mail size={12} /> Email Address
                      </label>
                      <span className="text-[9px] uppercase tracking-tighter text-carbon-gray-50 font-mono">Read-only</span>
                    </div>
                    <p className="text-sm text-carbon-gray-30 p-2 bg-carbon-gray-100/50 border border-transparent font-mono rounded-sm">
                      {profile.email}
                    </p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-carbon-gray-30 font-bold flex items-center gap-2">
                    <FileText size={12} /> Bio
                  </label>
                  {isEditable ? (
                    <textarea 
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      rows={4}
                      className="w-full bg-carbon-gray-100 border border-carbon-gray-80 p-2 text-sm text-white focus:border-carbon-blue-60 outline-none transition-colors resize-none"
                      placeholder="Tell us about your culinary journey..."
                    />
                  ) : (
                    <div className="text-sm text-carbon-gray-20 p-2 bg-carbon-gray-100/50 border border-transparent min-h-[60px] whitespace-pre-wrap italic">
                      {profile?.bio || 'No bio provided yet.'}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              {isEditable && (
                <div className="pt-4 border-t border-carbon-gray-80">
                  <button
                    onClick={handleSave}
                    disabled={saving || !hasChanges}
                    className="w-full flex items-center justify-center gap-2 bg-carbon-blue-60 hover:bg-carbon-blue-70 disabled:opacity-30 disabled:cursor-not-allowed text-white py-2.5 text-sm font-medium transition-colors shadow-lg shadow-carbon-blue-60/10"
                  >
                    {saving ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <Save size={18} />
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
