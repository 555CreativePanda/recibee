import { useEffect, useState, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { db, auth, googleProvider, signOut, onAuthStateChanged, User } from './lib/firebase';
import { collection, query, where, getDocs, getDoc, addDoc, updateDoc, doc, orderBy, onSnapshot, setDoc, serverTimestamp, limit, deleteField } from 'firebase/firestore';
import { Recipe } from './types';
import { GoogleGenAI } from '@google/genai';
import { RecipeEditor } from './components/RecipeEditor';
import { AuthModal } from './components/AuthModal';
import { cn, safeStringify } from './lib/utils';
import { Plus, ChefHat, Search, Filter, GitBranch, Download, X, Loader2, LogIn, LogOut, User as UserIcon, Database } from 'lucide-react';
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
import { saveRecipe, forkRecipe } from './services/recipeService';
import { getUserProfile } from './services/userService';
import { UserProfile } from './types';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'success' | 'error'>('testing');
  const [activeTab, setActiveTab] = useState<'all' | 'mine' | 'favorites'>('all');
  const [starredRecipeIds, setStarredRecipeIds] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  // Notification Modal State
  const [notification, setNotification] = useState<{ title: string, message: string } | null>(null);
  
  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authAction, setAuthAction] = useState('');

  // Profile Modal State
  const [profileModal, setProfileModal] = useState<{ uid: string, mode: 'view' | 'edit' } | null>(null);
  
  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
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
          // Fetch full profile
          const profile = await getUserProfile(currentUser.uid);
          setUserProfile(profile);

          // Only sync if data has changed or document doesn't exist
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          const userData = userDoc.data();
          
          const publicData = {
            uid: currentUser.uid,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            updated_at: serverTimestamp()
          };
          const privateData = {
            email: currentUser.email
          };

          const hasChanged = !userDoc.exists() || 
              (userData && (
                userData.displayName !== publicData.displayName || 
                userData.photoURL !== publicData.photoURL
              ));

          if (hasChanged) {
            await setDoc(doc(db, 'users', currentUser.uid), {
              ...publicData,
              email: deleteField()
            }, { merge: true });
          }

          // Always sync email to private subcollection
          if (currentUser.email) {
            await setDoc(doc(db, 'users', currentUser.uid, 'private', 'data'), privateData, { merge: true });
          }

          if (hasChanged) {
            // Refresh local profile after sync
            const updatedProfile = await getUserProfile(currentUser.uid);
            setUserProfile(updatedProfile);
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

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const recipesRef = collection(db, 'recipes');
    const q = query(recipesRef, orderBy('created_at', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedRecipes = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at || new Date().toISOString(),
          updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at || data.created_at?.toDate?.()?.toISOString() || data.created_at || new Date().toISOString()
        };
      }) as Recipe[];
      
      // Ensure unique recipes by ID to avoid duplicate key errors
      const uniqueRecipes = fetchedRecipes.filter((recipe, index, self) =>
        index === self.findIndex((t) => t.id === recipe.id)
      );
      setRecipes(uniqueRecipes);
      setIsLoading(false);
      setConnectionStatus('success');
    }, (error) => {
      console.error('Firestore error:', error);
      setConnectionStatus('error');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (editingRecipe) {
      window.scrollTo(0, 0);
    }
  }, [editingRecipe]);

  const handleLogin = () => {
    setAuthAction('');
    setIsAuthModalOpen(true);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
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
    if (!importUrl) return;
    if (!ensureAuth('import recipes')) return;
    
    setIsImporting(true);
    setImportError(null);

    // Normalize URL on client side too
    let normalizedUrl = importUrl.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    try {
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalizedUrl })
      });

      let data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to import');

      // If standard extraction failed, use Gemini AI
      if (data.needsAI) {
        try {
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
          const prompt = `
            Extract the recipe from the following text. 
            Return ONLY a JSON object with this structure:
            {
              "title": "string",
              "ingredients": [{"item": "string", "amount": "string", "unit": "string"}],
              "steps": ["string"],
              "prep_time": "string or null",
              "cook_time": "string or null",
              "servings": "string or null",
              "cuisine": "string or null",
              "course": "string or null",
              "keywords": ["string"]
            }
            
            Text:
            ${data.rawText}
          `;

          const aiResponse = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
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
          console.error('Frontend Gemini extraction failed:', aiError);
          throw new Error('Could not extract recipe automatically. Please try a different URL or enter manually.');
        }
      }

      const newRecipe: Recipe = {
        id: 'temp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9),
        title: data.title,
        ingredients: data.ingredients,
        original_ingredients: [...data.ingredients],
        steps: data.steps,
        original_steps: [...data.steps],
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
        source_url: normalizedUrl,
        created_at: new Date().toISOString(),
      };

      setEditingRecipe(newRecipe);
      setIsImportModalOpen(false);
      setImportUrl('');
      if (location.pathname !== '/explore') navigate('/explore');
    } catch (error: any) {
      setImportError(error.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleFork = (recipe: Recipe) => {
    console.log('handleFork triggered in App.tsx for recipe:', recipe.id);
    if (!ensureAuth('fork and modify recipes')) return;

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
      user_id: user.uid,
      source_url: recipe.source_url || null,
      created_at: new Date().toISOString(),
    };

    setEditingRecipe(forkedRecipe);
    if (location.pathname !== '/explore') navigate('/explore');
  };

  const handleSave = async (updatedRecipe: Recipe) => {
    if (!ensureAuth('save changes')) return;

    try {
      const isNew = updatedRecipe.id.startsWith('temp-');
      
      if (!isNew && updatedRecipe.user_id !== user!.uid) {
        setNotification({
          title: 'Ownership Required',
          message: 'You can only save changes to recipes you own. Please fork this recipe to make your own version.'
        });
        return;
      }

      const savedId = await saveRecipe(updatedRecipe, user!.uid);
      setEditingRecipe(null);

      if (isNew) {
        setNotification({
          title: 'Recipe Saved',
          message: updatedRecipe.parent_id ? 'Fork created successfully!' : 'New recipe created successfully!'
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
      created_at: new Date().toISOString(),
    };
    setEditingRecipe(newRecipe);
    if (location.pathname !== '/explore') navigate('/explore');
  };

  const handleSeed = async () => {
    if (!ensureAuth('seed the repository')) return;
    setIsLoading(true);
    try {
      const starterRecipe = {
        title: 'Classic Carbonara.js',
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
        created_at: serverTimestamp(),
      };
      await addDoc(collection(db, 'recipes'), starterRecipe);
    } catch (error) {
      console.error('Error seeding database:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserClick = (uid: string) => {
    setProfileModal({ uid, mode: 'view' });
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
        <header className="bg-carbon-gray-90 border-b border-carbon-gray-80 px-4 py-3 lg:px-6 lg:py-4 sticky top-0 z-10">
          <div className="container mx-auto max-w-5xl flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center justify-between w-full lg:w-auto">
              <Link to="/explore" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="bg-carbon-blue-60 p-1.5">
                  <ChefHat size={20} className="text-white" />
                </div>
                <div className="flex flex-col">
                  <h1 className="text-xl font-semibold tracking-tight">ReciBee<span className="text-carbon-blue-60">/_</span></h1>
                  <div className="flex items-center gap-1.5">
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      connectionStatus === 'success' ? "bg-green-500" : 
                      connectionStatus === 'error' ? "bg-red-500" : "bg-yellow-500 animate-pulse"
                    )} />
                    <span className="text-[10px] uppercase font-mono text-carbon-gray-30">
                      {connectionStatus === 'success' ? "DB Connected" : 
                       connectionStatus === 'error' ? "DB Offline" : "Connecting..."}
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
                  className="p-2 text-carbon-gray-30 hover:text-white transition-colors border border-carbon-gray-80"
                  title="Import from URL"
                >
                  <Download size={18} />
                </button>
                <button
                  onClick={handleCreate}
                  className="p-2 bg-carbon-blue-60 hover:bg-carbon-blue-70 text-white transition-colors"
                  title="New Recipe"
                >
                  <Plus size={18} />
                </button>
                <div className="w-[1px] h-6 bg-carbon-gray-80 mx-1" />
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
                          className="w-7 h-7 rounded-full border border-carbon-gray-80 group-hover:border-carbon-blue-60 transition-colors" 
                          referrerPolicy="no-referrer" 
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-carbon-gray-80 flex items-center justify-center group-hover:bg-carbon-gray-70 transition-colors">
                          <UserIcon size={14} className="text-carbon-gray-30" />
                        </div>
                      )}
                    </button>
                    <button
                      onClick={handleLogout}
                      className="p-2 text-carbon-gray-30 hover:text-white transition-colors"
                      title="Logout"
                    >
                      <LogOut size={18} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleLogin}
                    className="p-2 text-carbon-blue-60 hover:text-carbon-blue-50 transition-colors"
                    title="Login"
                  >
                    <LogIn size={18} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:flex-1 lg:max-w-2xl lg:mx-12">
              <div className="relative w-full">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-carbon-gray-30" />
                <input
                  type="text"
                  placeholder="Search recipes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-carbon-gray-100 border border-carbon-gray-80 pl-10 pr-4 py-2 text-sm outline-none focus:border-carbon-blue-60 transition-colors"
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
                        className="w-8 h-8 rounded-full border border-carbon-gray-80 group-hover:border-carbon-blue-60 transition-colors" 
                        referrerPolicy="no-referrer" 
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-carbon-gray-80 flex items-center justify-center group-hover:bg-carbon-gray-70 transition-colors">
                        <UserIcon size={16} className="text-carbon-gray-30" />
                      </div>
                    )}
                    <span className="text-sm font-medium hidden xl:inline text-carbon-gray-30 group-hover:text-white transition-colors">
                      {userProfile?.displayName || user.displayName || user.email}
                    </span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 border border-carbon-gray-80 hover:bg-carbon-gray-80 text-white px-4 py-2 text-sm font-medium transition-colors"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className="flex items-center gap-2 bg-carbon-blue-60 hover:bg-carbon-blue-70 text-white px-4 py-2 text-sm font-medium transition-colors"
                >
                  <LogIn size={16} />
                  Login
                </button>
              )}
              <div className="h-6 w-[1px] bg-carbon-gray-80 mx-2" />
              <button
                onClick={() => {
                  if (ensureAuth('import recipes')) {
                    setIsImportModalOpen(true);
                  }
                }}
                className="flex items-center gap-2 border border-carbon-gray-80 hover:bg-carbon-gray-80 text-white px-4 py-2 text-sm font-medium transition-colors"
              >
                <Download size={16} />
                Import
              </button>
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 bg-carbon-blue-60 hover:bg-carbon-blue-70 text-white px-4 py-2 text-sm font-medium transition-colors"
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
                className="bg-carbon-gray-90 border border-carbon-gray-80 w-full max-w-md p-6 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium">{notification.title}</h3>
                  <button onClick={() => setNotification(null)} className="text-carbon-gray-30 hover:text-white">
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-6">
                  <p className="text-sm text-carbon-gray-30 leading-relaxed">
                    {notification.message}
                  </p>
                  <button
                    onClick={() => setNotification(null)}
                    className="w-full bg-carbon-blue-60 hover:bg-carbon-blue-70 text-white px-4 py-3 text-sm font-medium transition-colors"
                  >
                    Dismiss
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
                className="bg-carbon-gray-90 border border-carbon-gray-80 w-full max-w-md p-6 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium">Import from URL</h3>
                  <button onClick={() => setIsImportModalOpen(false)} className="text-carbon-gray-30 hover:text-white">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <p className="text-sm text-carbon-gray-30">
                    Paste a recipe URL (e.g. from a food blog) to extract ingredients and steps automatically.
                  </p>
                  <input
                    ref={importInputRef}
                    autoFocus
                    type="url"
                    placeholder="https://example.com/recipe"
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    className="w-full bg-carbon-gray-100 border border-carbon-gray-80 p-3 text-sm outline-none focus:border-carbon-blue-60"
                  />
                  {importError && (
                    <p className="text-xs text-red-500 font-mono">{importError}</p>
                  )}
                  <button
                    onClick={handleImport}
                    disabled={isImporting || !importUrl}
                    className="w-full flex items-center justify-center gap-2 bg-carbon-blue-60 hover:bg-carbon-blue-70 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 text-sm font-medium transition-colors"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Download size={16} />
                        Import Recipe
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
                    recipes={recipes}
                    isLoading={isLoading}
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

      <Footer />
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
