import { useEffect, useState, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { db, auth, googleProvider, signOut, onAuthStateChanged, User, isConfigValid } from './lib/firebase';
import { collection, query, where, getDocs, getDoc, addDoc, updateDoc, doc, orderBy, onSnapshot, setDoc, serverTimestamp, limit, deleteField } from 'firebase/firestore';
import { Recipe } from './types';
import { GoogleGenAI } from '@google/genai';
import { RecipeEditor } from './components/RecipeEditor';
import { AuthModal } from './components/AuthModal';
import { cn, safeStringify } from './lib/utils';
import { Plus, ChefHat, Search, Filter, Download, X, Loader2, LogIn, LogOut, User as UserIcon, Database, AlertCircle, Copy, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HomePage } from './pages/HomePage';
import { RecipePage } from './pages/RecipePage';
import { LandingPage } from './pages/LandingPage';
import { DocumentationPage } from './pages/DocumentationPage';
import { ApiReferencePage } from './pages/ApiReferencePage';
import { StatusPage } from './pages/StatusPage';
import { FeatureRequestPage } from './pages/FeatureRequestPage';
import { ScrollToTop } from './components/ScrollToTop';
import { Footer } from './components/Footer';
import { UserProfileModal } from './components/UserProfileModal';
import { saveRecipe, forkRecipe, clearRecipeCache, clearTabCache } from './services/recipeService';
import { getUserProfile } from './services/userService';
import { UserProfile } from './types';

function ConfigurationMissingScreen() {
  const [copied, setCopied] = useState<string | null>(null);

  const envVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
    'VITE_FIREBASE_DATABASE_ID'
  ];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center p-6 font-sans antialiased text-[#292524]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full bg-white border border-[#e7e5e4] rounded-[32px] shadow-2xl overflow-hidden"
      >
        <div className="p-8 md:p-12">
          <div className="flex items-center gap-6 mb-10">
            <div className="bg-orange-50 p-5 rounded-2xl">
              <Database className="text-orange-600 animate-pulse" size={40} />
            </div>
            <div>
              <h1 className="text-3xl font-serif font-bold text-stone-900 mb-2">Configuration Required</h1>
              <p className="text-stone-500 font-medium">Your ReciBee deployment is almost ready.</p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="text-red-600" size={20} />
                <h2 className="text-sm font-bold uppercase tracking-widest text-red-600">Action Required: Vercel Setup</h2>
              </div>
              <p className="text-sm text-red-800 leading-relaxed font-medium">
                To keep your app secure, Firebase keys are hidden from the code. You must add them as <strong>Environment Variables</strong> in your Vercel Dashboard to continue.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-stone-400">Missing Variables</h3>
              <div className="grid gap-2">
                {envVars.map(v => (
                  <div key={v} className="group flex items-center justify-between p-4 bg-stone-50 border border-stone-200 rounded-xl hover:border-orange-600 transition-all">
                    <code className="text-[11px] font-mono font-medium text-stone-600 group-hover:text-orange-600">{v}</code>
                    <button 
                      onClick={() => handleCopy(v)}
                      className="text-stone-400 hover:text-orange-600 transition-colors"
                    >
                      {copied === v ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} />}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-stone-100">
              <p className="text-xs text-stone-400 font-medium mb-6 flex items-center gap-2">
                <ChefHat size={14} />
                After adding these keys in Vercel settings, you <strong>must redeploy</strong> your app.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href="https://vercel.com/dashboard" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-stone-900 hover:bg-black text-white px-6 py-4 rounded-2xl text-xs font-bold transition-all uppercase tracking-widest active:scale-95"
                >
                  Go to Vercel Dashboard
                </a>
                <button 
                  onClick={() => window.location.reload()}
                  className="flex-1 border border-stone-200 hover:bg-stone-50 text-stone-600 px-6 py-4 rounded-2xl text-xs font-bold transition-all uppercase tracking-widest"
                >
                  I've Done This, Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-stone-50 border-t border-stone-100 px-12 py-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 text-center">
            ReciBee v0.0.1 • Security Handshake State
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'success' | 'error'>('success');
  const [activeTab, setActiveTab] = useState<'all' | 'mine' | 'favorites'>('all');
  const [starredRecipeIds, setStarredRecipeIds] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Fallback UI if Firebase is not correctly configured
  if (!isConfigValid) {
    return <ConfigurationMissingScreen />;
  }
  
  // Notification Modal State
  const [notification, setNotification] = useState<{ title: string, message: string } | null>(null);
  
  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authAction, setAuthAction] = useState('');

  // Profile Modal State
  const [profileModal, setProfileModal] = useState<{ uid: string, mode: 'view' | 'edit' } | null>(null);
  
  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importTab, setImportTab] = useState<'url' | 'text'>('url');
  const [importUrl, setImportUrl] = useState('');
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string>('Analyzing...');
  const [importError, setImportError] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isImportModalOpen) {
      // Small timeout to ensure the animation has started and the element is in the DOM
      setTimeout(() => {
        importInputRef.current?.focus();
      }, 100);
    }
  }, [isImportModalOpen]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      if (currentUser) {
        try {
          // Fetch full profile (uses cache if available)
          let profile = await getUserProfile(currentUser.uid);
          setUserProfile(profile);

          // Only sync if data has changed or document doesn't exist
          const publicData = {
            uid: currentUser.uid,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            updated_at: serverTimestamp()
          };
          const privateData = {
            email: currentUser.email
          };

          const hasChanged = !profile || 
              (profile.displayName !== publicData.displayName || 
               profile.photoURL !== publicData.photoURL);

          if (hasChanged) {
            await setDoc(doc(db, 'users', currentUser.uid), {
              ...publicData,
              email: deleteField()
            }, { merge: true });
            
            // Refresh local profile after sync
            profile = await getUserProfile(currentUser.uid, true);
            setUserProfile(profile);
          }

          // Always sync email to private subcollection (this is a write, but we only do it if we have an email)
          // To save reads, we could check if profile.email matches, but profile.email is already fetched
          if (currentUser.email && profile?.email !== currentUser.email) {
            await setDoc(doc(db, 'users', currentUser.uid, 'private', 'data'), privateData, { merge: true });
          }
        } catch (err) {
          console.error('Error syncing user:', err);
        }
      } else {
        setUserProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setStarredRecipeIds(new Set());
      return;
    }

    const starsRef = collection(db, 'stars');
    const q = query(starsRef, where('user_id', '==', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ids = new Set(snapshot.docs.map(doc => doc.data().recipe_id));
      setStarredRecipeIds(ids);
    }, (error) => {
      console.error('Error fetching starred recipes:', error);
      if (error.code === 'permission-denied') {
        console.error('Detailed Star Fetch Error:', safeStringify({
          error: error.message,
          operationType: 'list',
          path: 'stars',
          authInfo: {
            userId: user.uid,
            email: user.email,
          }
        }));
      }
    });

    // Listen to the user document for real-time profile updates (like star_count)
    const profileUnsubscribe = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setUserProfile(prev => ({
          ...prev,
          ...data,
          uid: snapshot.id
        } as UserProfile));
      }
    });

    return () => {
      unsubscribe();
      profileUnsubscribe();
    };
  }, [user]);

  // Background healing for admin
  useEffect(() => {
    const runAutoHeal = async () => {
      if (user && user.email === 'chandra.mayur@gmail.com') {
        try {
          const { healRecipes } = await import('./services/recipeService');
          const repaired = await healRecipes();
          if (repaired > 0) {
            console.log(`[AutoHeal] Background metadata repair complete. Repaired ${repaired} recipes.`);
            setNotification({
              title: 'Library Repaired',
              message: `Successfully updated metadata for ${repaired} recipes to ensure they are visible to public users and correctly sorted.`
            });
            clearTabCache();
          }
        } catch (err) {
          console.error('[AutoHeal] Failed:', err);
        }
      }
    };
    if (user) runAutoHeal();
  }, [user?.uid]);

  const handleLogin = () => {
    setAuthAction('');
    setIsAuthModalOpen(true);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Redirect to "All Recipes" (Explore) and refresh page state
      window.location.href = '/explore';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const ensureAuth = (action: string) => {
    if (!user) {
      setAuthAction(action);
      setIsAuthModalOpen(true);
      return false;
    }
    return true;
  };

  const handleImport = async () => {
    if (importTab === 'url' && !importUrl) return;
    if (importTab === 'text' && !importText) return;
    if (!ensureAuth('import recipes')) return;
    
    setIsImporting(true);
    setImportStatus('Contacting server...');
    setImportError(null);

    try {
      let data: any = null;
      let sourceUrl = null;

      if (importTab === 'url') {
        // Normalize URL on client side too
        let normalizedUrl = importUrl.trim();
        if (!/^https?:\/\//i.test(normalizedUrl)) {
          normalizedUrl = 'https://' + normalizedUrl;
        }
        sourceUrl = normalizedUrl;

        const response = await fetch('/api/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: normalizedUrl })
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Non-JSON response:', text);
          throw new Error(`Server returned an unexpected response format. It might be experiencing high load or blocking the request.`);
        }

        data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to import');
      } else {
        // Manual text import - skip backend and go straight to AI
        data = { needsAI: true, rawText: importText, title: 'Imported from Text' };
      }

      // Use Gemini AI for extraction if needed
      if (data.needsAI) {
        setImportStatus(data.useUrlContext ? 'Bypassing protection with Gemini AI...' : 'Extracting ingredients with AI...');
        try {
          const apiKey = process.env.GEMINI_API_KEY;
          if (!apiKey || apiKey === 'undefined' || apiKey === 'null') {
            console.error('Gemini API Key is missing from the environment.');
            throw new Error('Gemini API Key is not configured. Please add GEMINI_API_KEY to your Secrets in the AI Studio settings.');
          }
          const ai = new GoogleGenAI({ apiKey });
          
          let contents = '';
          let tools: any[] = [];
          
          if (data.useUrlContext) {
            contents = `Extract the recipe from this URL: ${data.url}`;
            tools = [{ urlContext: {} }];
          } else {
            contents = `Extract the recipe from the following text:\n\n${data.rawText}`;
          }

          const prompt = `
            ${contents}
            
            Return ONLY a JSON object with this structure:
            {
              "title": "string",
              "ingredients": [{"item": "string", "amount": "string", "unit": "string", "isHeader": boolean}],
              "steps": [{"text": "string", "isSubheading": boolean}],
              "prep_time": "string or null",
              "cook_time": "string or null",
              "servings": "string or null",
              "cuisine": "string or null",
              "course": "string or null",
              "keywords": ["string"]
            }
            
            Note: "isHeader" in ingredients should be true if the item is a section title (e.g. "For the marinade").
            "isSubheading" in steps should be true if the text is a section title.
          `;

          const aiResponse = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
              tools: tools.length > 0 ? tools : undefined
            }
          });

          const text = aiResponse.text;
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const aiData = JSON.parse(jsonMatch[0]);
            data = { ...aiData, notes: null };
          } else {
            throw new Error('AI failed to parse recipe data');
          }
        } catch (aiError: any) {
          console.error('Gemini extraction failed:', aiError);
          throw new Error('Could not extract recipe automatically. Please try pasting the text differently or enter manually.');
        }
      }

      const newRecipe: Recipe = {
        id: 'temp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9),
        title: data.title || 'Untitled Recipe',
        ingredients: data.ingredients || [],
        original_ingredients: [...(data.ingredients || [])],
        steps: data.steps || [],
        original_steps: [...(data.steps || [])],
        prep_time: data.prep_time || '',
        cook_time: data.cook_time || '',
        servings: data.servings || '',
        cuisine: data.cuisine || '',
        course: data.course || '',
        equipment: data.equipment || [],
        keywords: data.keywords || [],
        notes: data.notes || '',
        parent_id: null,
        user_id: user!.uid,
        is_public: true,
        source_url: sourceUrl,
        created_at: new Date().toISOString(),
      };

      setEditingRecipe(newRecipe);
      setIsImportModalOpen(false);
      setImportUrl('');
      setImportText('');
      if (location.pathname !== '/explore') navigate('/explore');
    } catch (error: any) {
      setImportError(error.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleFork = (recipe: Recipe) => {
    console.log('handleFork triggered in App.tsx for recipe:', recipe.id);
    if (!ensureAuth('save and tweak recipes')) return;

    if (!user) return;

    const forkedRecipe: Recipe = {
      id: 'temp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9),
      title: recipe.title,
      ingredients: recipe.ingredients ? [...recipe.ingredients] : [],
      original_ingredients: recipe.ingredients ? [...recipe.ingredients] : [],
      steps: recipe.steps ? [...recipe.steps] : [],
      original_steps: recipe.steps ? [...recipe.steps] : [],
      prep_time: recipe.prep_time || '',
      cook_time: recipe.cook_time || '',
      servings: recipe.servings || '',
      cuisine: recipe.cuisine || '',
      course: recipe.course || '',
      equipment: recipe.equipment ? [...recipe.equipment] : [],
      keywords: recipe.keywords ? [...recipe.keywords] : [],
      notes: recipe.notes || '',
      parent_id: recipe.id,
      parent_title: recipe.title,
      parent_user_id: recipe.user_id,
      user_id: user.uid,
      is_public: true,
      source_url: recipe.source_url || null,
      created_at: new Date().toISOString(),
    };

    setEditingRecipe(forkedRecipe);
    clearTabCache();
    if (location.pathname !== '/explore') navigate('/explore');
  };

  const handleSave = async (updatedRecipe: Recipe) => {
    if (!ensureAuth('save changes')) return;

    try {
      const isNew = updatedRecipe.id.startsWith('temp-');
      
      if (!isNew && updatedRecipe.user_id !== user!.uid) {
        setNotification({
          title: 'Ownership Required',
          message: 'You can only save changes to recipes you own. Please save a copy of this recipe to make your own version.'
        });
        return;
      }

      const savedId = await saveRecipe(updatedRecipe, user!.uid);
      setEditingRecipe(null);

      // Clear caches
      clearRecipeCache(savedId);
      clearTabCache();

      if (isNew) {
        setNotification({
          title: 'Recipe Saved',
          message: updatedRecipe.parent_id ? 'Copy created successfully!' : 'New recipe created successfully!'
        });
        // Navigate to the new recipe page
        navigate(`/recipe/${savedId}`);
      }
    } catch (error: any) {
      console.error('Error saving recipe:', error);
      setNotification({
        title: 'Save Failed',
        message: `Failed to save recipe: ${error.message || 'Unknown error'}`
      });
    }
  };

  const handleCreate = () => {
    if (!ensureAuth('create new recipes')) return;

    const newRecipe: Recipe = {
      id: 'temp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9),
      title: '',
      ingredients: [],
      steps: [],
      parent_id: null,
      user_id: user!.uid,
      is_public: true,
      created_at: new Date().toISOString(),
    };
    setEditingRecipe(newRecipe);
    if (location.pathname !== '/explore') navigate('/explore');
  };

  const handleSeed = async () => {
    if (!ensureAuth('seed the recipe box')) return;
    setIsLoading(true);
    try {
      const recipesToSeed = [
        {
          title: 'Classic Carbonara',
          ingredients: [
            { item: 'Spaghetti', amount: '400', unit: 'g' },
            { item: 'Guanciale', amount: '150', unit: 'g' },
            { item: 'Pecorino Romano', amount: '50', unit: 'g' },
            { item: 'Eggs', amount: '4', unit: 'large' },
          ],
          steps: [
            'Boil salted water in a large pot.',
            'Crisp the guanciale in a pan until fat renders.',
            'Whisk eggs and cheese in a bowl.',
            'Toss pasta with guanciale, then remove from heat and stir in egg mixture quickly.',
          ],
          parent_id: null,
          user_id: user.uid,
          is_public: true,
          star_count: 5,
          fork_count: 2,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        },
        {
          title: 'Spicy Thai Basil Chicken',
          ingredients: [
            { item: 'Chicken Thighs', amount: '500', unit: 'g' },
            { item: 'Holy Basil', amount: '1', unit: 'cup' },
            { item: 'Thai Bird Eye Chilies', amount: '5', unit: '' },
            { item: 'Garlic', amount: '4', unit: 'cloves' },
            { item: 'Soy Sauce', amount: '2', unit: 'tbsp' },
            { item: 'Fish Sauce', amount: '1', unit: 'tbsp' },
          ],
          steps: [
            'Pound garlic and chilies into a paste.',
            'Stir-fry the chicken until cooked through.',
            'Add the paste and sauces, stir well.',
            'Toss in basil leaves at the end until just wilted.',
          ],
          parent_id: null,
          user_id: user.uid,
          is_public: true,
          star_count: 12,
          fork_count: 8,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        },
        {
          title: 'Authentic Guacamole',
          ingredients: [
            { item: 'Avocados', amount: '3', unit: 'ripe' },
            { item: 'Lime', amount: '1', unit: '' },
            { item: 'Onion', amount: '1/2', unit: 'small' },
            { item: 'Cilantro', amount: '1/4', unit: 'cup' },
            { item: 'Jalapeño', amount: '1', unit: '' },
          ],
          steps: [
            'Mash avocados in a bowl, leaving some chunks.',
            'Stir in finely chopped onion, cilantro, and jalapeño.',
            'Squeeze in lime juice and season with salt.',
          ],
          parent_id: null,
          user_id: user.uid,
          is_public: true,
          star_count: 8,
          fork_count: 3,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        }
      ];

      for (const recipe of recipesToSeed) {
        await addDoc(collection(db, 'recipes'), recipe);
      }
      
      setNotification({
        title: 'Database Seeded',
        message: 'Successfully added starter recipes to the box.'
      });
      clearTabCache();
    } catch (error) {
      console.error('Error seeding database:', error);
      setNotification({
        title: 'Seeding Failed',
        message: 'An error occurred while seeding the database.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserClick = (uid: string) => {
    setProfileModal({ uid, mode: 'view' });
  };

  const [isHealing, setIsHealing] = useState(false);
  const handleHeal = async () => {
    if (!user || user.email !== 'chandra.mayur@gmail.com') return;
    setIsHealing(true);
    try {
      const { healRecipes } = await import('./services/recipeService');
      const count = await healRecipes();
      setNotification({
        title: 'Heal Complete',
        message: `Database healing finished. ${count} recipes were updated with public status. Please refresh the page.`
      });
      clearTabCache();
    } catch (err: any) {
      setNotification({
        title: 'Heal Failed',
        message: err.message || 'Error occurred during healing.'
      });
    } finally {
      setIsHealing(false);
    }
  };

  const handleEditOwnProfile = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (user) {
      setProfileModal({ uid: user.uid, mode: 'edit' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      {location.pathname !== '/' && location.pathname !== '/docs' && location.pathname !== '/api-docs' && location.pathname !== '/status' && location.pathname !== '/features' && (
        <header className="bg-white border-b border-stone-200 px-4 py-3 lg:px-6 lg:py-4 sticky top-0 z-10 shadow-sm">
          <div className="container mx-auto max-w-5xl flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center justify-between w-full lg:w-auto">
              <Link to="/explore" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="bg-orange-600 p-2 rounded-xl">
                  <ChefHat size={24} className="text-white" />
                </div>
                <div className="flex flex-col">
                  <h1 className="text-2xl font-serif font-bold tracking-tight text-stone-900">ReciBee</h1>
                  <div className="flex items-center gap-1.5">
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      connectionStatus === 'success' ? "bg-green-500" : 
                      connectionStatus === 'error' ? "bg-red-500" : "bg-yellow-500 animate-pulse"
                    )} />
                    <span className="text-[10px] uppercase font-sans font-semibold text-stone-400">
                      {connectionStatus === 'success' ? "Online" : 
                       connectionStatus === 'error' ? "Offline" : "Connecting..."}
                    </span>
                  </div>
                </div>
              </Link>

              {/* Mobile/Tablet Actions */}
              <div className="flex lg:hidden items-center gap-2">
                <button
                  onClick={() => {
                    if (ensureAuth('import recipes')) {
                      setIsImportModalOpen(true);
                    }
                  }}
                  className="p-2 text-stone-500 hover:text-orange-600 transition-colors border border-stone-200 rounded-xl"
                  title="Import from URL"
                >
                  <Download size={18} />
                </button>
                <button
                  onClick={handleCreate}
                  className="p-2 bg-orange-600 hover:bg-orange-700 text-white transition-colors rounded-xl"
                  title="New Recipe"
                >
                  <Plus size={18} />
                </button>
                <div className="w-[1px] h-6 bg-stone-200 mx-1" />
                {user ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleEditOwnProfile(e)}
                      className="flex items-center gap-2 group cursor-pointer"
                      title="Your Profile"
                      type="button"
                    >
                      {userProfile?.photoURL || user.photoURL ? (
                        <img 
                          src={userProfile?.photoURL || user.photoURL!} 
                          alt="" 
                          className="w-8 h-8 rounded-full border border-stone-200 group-hover:border-orange-600 transition-colors" 
                          referrerPolicy="no-referrer" 
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center group-hover:bg-stone-200 transition-colors">
                          <UserIcon size={14} className="text-stone-400" />
                        </div>
                      )}
                    </button>
                    <button
                      onClick={handleLogout}
                      className="p-2 text-stone-500 hover:text-red-600 transition-colors"
                      title="Logout"
                    >
                      <LogOut size={18} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleLogin}
                    className="p-2 text-orange-600 hover:text-orange-700 transition-colors"
                    title="Login"
                  >
                    <LogIn size={18} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:flex-1 lg:max-w-2xl lg:mx-12">
              <div className="relative w-full">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search your recipes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 pl-10 pr-4 py-2.5 text-sm rounded-2xl outline-none focus:border-orange-600 focus:ring-1 focus:ring-orange-600 transition-all"
                />
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-4">
                  <button
                    onClick={(e) => handleEditOwnProfile(e)}
                    className="flex items-center gap-2 group cursor-pointer"
                    type="button"
                  >
                    {userProfile?.photoURL || user.photoURL ? (
                      <img 
                        src={userProfile?.photoURL || user.photoURL!} 
                        alt="" 
                        className="w-9 h-9 rounded-full border border-stone-200 group-hover:border-orange-600 transition-colors" 
                        referrerPolicy="no-referrer" 
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center group-hover:bg-stone-200 transition-colors">
                        <UserIcon size={16} className="text-stone-400" />
                      </div>
                    )}
                    <span className="text-sm font-medium hidden xl:inline text-stone-600 group-hover:text-stone-900 transition-colors">
                      {userProfile?.displayName || user.displayName || user.email}
                    </span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 border border-stone-200 hover:bg-stone-50 text-stone-600 px-4 py-2 rounded-2xl text-sm font-medium transition-colors"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className="flex items-center gap-2 border border-stone-200 hover:bg-stone-50 text-stone-600 px-5 py-2.5 rounded-2xl text-sm font-medium transition-colors"
                >
                  <LogIn size={16} />
                  Login
                </button>
              )}
              <div className="h-6 w-[1px] bg-stone-200 mx-2" />
              <button
                onClick={() => {
                  if (ensureAuth('import recipes')) {
                    setIsImportModalOpen(true);
                  }
                }}
                className="flex items-center gap-2 border border-stone-200 hover:bg-stone-50 text-stone-600 px-4 py-2 rounded-2xl text-sm font-medium transition-colors"
              >
                <Download size={16} />
                Import
              </button>
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-2xl text-sm font-medium transition-colors shadow-md hover:shadow-lg"
              >
                <Plus size={16} />
                New Recipe
              </button>
            </div>
          </div>
        </header>
      )}

      <main className={cn("flex-1", (location.pathname === '/' || location.pathname === '/docs' || location.pathname === '/api-docs' || location.pathname === '/status') ? "" : "container mx-auto max-w-5xl p-6 space-y-6")}>
        <AnimatePresence>
          {notification && (
            <motion.div
              key="notification-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            >
              <motion.div
                key="notification-modal"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white border border-kitchen-border w-full max-w-md p-10 rounded-3xl shadow-2xl"
              >
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-serif font-bold text-kitchen-text">{notification.title}</h3>
                  <button onClick={() => setNotification(null)} className="text-stone-300 hover:text-kitchen-primary transition-colors p-1">
                    <X size={28} />
                  </button>
                </div>
                <div className="space-y-8">
                  <p className="text-kitchen-muted leading-relaxed font-medium">
                    {notification.message}
                  </p>
                  <button
                    onClick={() => setNotification(null)}
                    className="w-full bg-kitchen-primary hover:bg-orange-700 text-white px-6 py-4 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-orange-100 uppercase tracking-widest active:scale-95"
                  >
                    Got it
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {isAuthModalOpen && (
            <AuthModal 
              key="auth-modal"
              isOpen={isAuthModalOpen} 
              onClose={() => setIsAuthModalOpen(false)} 
              initialAction={authAction} 
            />
          )}

          {isImportModalOpen && (
            <motion.div
              key="import-modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            >
              <motion.div
                key="import-modal-content"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white border border-kitchen-border w-full max-w-md p-10 rounded-3xl shadow-2xl"
              >
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-serif font-bold text-kitchen-text">Import from URL</h3>
                  <button onClick={() => setIsImportModalOpen(false)} className="text-stone-300 hover:text-kitchen-primary transition-colors p-1">
                    <X size={28} />
                  </button>
                </div>
                
                <div className="space-y-8">
                  <div className="flex gap-4 border-b border-kitchen-border">
                    <button
                      onClick={() => setImportTab('url')}
                      className={cn(
                        "pb-3 text-xs font-bold uppercase tracking-widest transition-all relative",
                        importTab === 'url' ? "text-kitchen-primary" : "text-stone-400 hover:text-kitchen-muted"
                      )}
                    >
                      URL Import
                      {importTab === 'url' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-kitchen-primary" />}
                    </button>
                    <button
                      onClick={() => setImportTab('text')}
                      className={cn(
                        "pb-3 text-xs font-bold uppercase tracking-widest transition-all relative",
                        importTab === 'text' ? "text-kitchen-primary" : "text-stone-400 hover:text-kitchen-muted"
                      )}
                    >
                      Paste Text
                      {importTab === 'text' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-kitchen-primary" />}
                    </button>
                  </div>

                  {importTab === 'url' ? (
                    <div className="space-y-6">
                      <p className="text-kitchen-muted font-medium text-sm leading-relaxed">
                        Paste a recipe URL from any food blog. Note: Some sites with strong bot protection may block automated imports.
                      </p>
                      <div className="space-y-2">
                        <input
                          ref={importInputRef}
                          autoFocus
                          type="url"
                          placeholder="https://example.com/best-pasta-ever"
                          value={importUrl}
                          onChange={(e) => setImportUrl(e.target.value)}
                          className="w-full bg-stone-50 border border-kitchen-border p-5 rounded-2xl text-sm outline-none focus:border-kitchen-primary focus:ring-1 focus:ring-kitchen-primary transition-all font-medium"
                        />
                        {importError && (
                          <div className="bg-red-50 border border-red-100 rounded-xl p-4 mt-2">
                            <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest mb-1">Import Error</p>
                            <p className="text-xs text-red-600 leading-relaxed mb-3">{importError}</p>
                            <button 
                              onClick={() => {
                                setImportTab('text');
                                setImportError(null);
                              }}
                              className="text-[10px] font-bold text-red-700 uppercase tracking-widest bg-red-100 px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors"
                            >
                              Try "Paste Text" instead
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <p className="text-kitchen-muted font-medium text-sm leading-relaxed">
                        Select all text on the recipe page (Ctrl+A), paste it here, and our AI will extract the ingredients and steps for you.
                      </p>
                      <div className="space-y-2">
                        <textarea
                          placeholder="Paste recipe text here..."
                          value={importText}
                          onChange={(e) => setImportText(e.target.value)}
                          className="w-full h-48 bg-stone-50 border border-kitchen-border p-5 rounded-2xl text-sm outline-none focus:border-kitchen-primary focus:ring-1 focus:ring-kitchen-primary transition-all font-medium resize-none"
                        />
                        {importError && (
                          <div className="bg-red-50 border border-red-100 rounded-xl p-4 mt-2">
                            <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest mb-1">Extraction Error</p>
                            <p className="text-xs text-red-600 leading-relaxed">{importError}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleImport}
                    disabled={isImporting || (importTab === 'url' ? !importUrl : !importText)}
                    className="w-full flex items-center justify-center gap-3 bg-kitchen-primary hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-5 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-orange-100 uppercase tracking-widest active:scale-95"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        {importStatus}
                      </>
                    ) : (
                      <>
                        <Download size={20} />
                        {importTab === 'url' ? 'Import to My Recipes' : 'Extract Recipe'}
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div 
            key={location.pathname + (editingRecipe ? `-editing-${editingRecipe.id}` : '')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col"
          >
            <Routes location={location}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/explore" element={
                editingRecipe ? (
                  <motion.div
                    key={`editor-${editingRecipe.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <RecipeEditor
                      recipe={editingRecipe}
                      onSave={handleSave}
                      onCancel={() => setEditingRecipe(null)}
                    />
                  </motion.div>
                ) : (
                  <HomePage
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    starredRecipeIds={starredRecipeIds}
                    handleCreate={handleCreate}
                    handleSeed={handleSeed}
                    handleFork={handleFork}
                    setEditingRecipe={setEditingRecipe}
                    ensureAuth={ensureAuth}
                    user={user}
                    onUserClick={handleUserClick}
                  />
                )
              } />
              <Route path="/recipe/:id" element={
                <RecipePage 
                  user={user} 
                  ensureAuth={ensureAuth} 
                  setNotification={setNotification}
                  starredRecipeIds={starredRecipeIds}
                  onUserClick={handleUserClick}
                />
              } />
              <Route path="/docs" element={<DocumentationPage />} />
              <Route path="/api-docs" element={<ApiReferencePage />} />
              <Route path="/features" element={<FeatureRequestPage ensureAuth={ensureAuth} />} />
              <Route path="/status" element={<StatusPage />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {profileModal && (
          <UserProfileModal
            uid={profileModal.uid}
            currentUserId={user?.uid || null}
            mode={profileModal.mode}
            onClose={() => setProfileModal(null)}
            onProfileUpdate={(updated) => {
              if (user && updated.uid === user.uid) {
                setUserProfile(updated);
              }
            }}
          />
        )}
      </AnimatePresence>

      <Footer user={user} onHeal={handleHeal} isHealing={isHealing} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppContent />
    </BrowserRouter>
  );
}
