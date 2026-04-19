import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, LogIn, Mail, Lock, User as UserIcon, AlertCircle, CheckCircle2, Loader2, Eye, EyeOff, ShieldCheck, ArrowLeft, Globe, Copy, Check } from 'lucide-react';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile
} from '../lib/firebase';
import { cn, safeStringify } from '../lib/utils';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAction?: string;
}

type AuthMode = 'login' | 'signup' | 'forgot-password';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialAction }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<React.ReactNode | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);
  
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Password validation state
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  useEffect(() => {
    if (isOpen) {
      // Small timeout to ensure the modal animation has started and input is rendered
      const timer = setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, mode]);

  useEffect(() => {
    if (mode === 'signup') {
      setPasswordRequirements({
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password)
      });
    }
  }, [password, mode]);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setError(null);
    setSuccess(null);
    setShowPassword(false);
  };

  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [showDebug, setShowDebug] = useState(false);
  const [rawError, setRawError] = useState<any>(null);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    setRawError(null);
    console.log('Starting Google Login with provider:', googleProvider);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Google Login Success:', result.user.email);
      onClose();
    } catch (err: any) {
      setRawError(err);
      console.error('Google Auth Error Object:', err);
      console.error('Error Code:', err.code);
      console.error('Error Message:', err.message);
      
      let message = 'Failed to login with Google';
      if (err.code === 'auth/internal-error' || err.code === 'auth/network-request-failed') {
        const hostname = window.location.hostname;
        const isIframe = window.self !== window.top;

        setError(
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-2 text-red-500 font-bold">
              <AlertCircle size={18} />
              <span>Authentication Blocked</span>
            </div>
            
            <p className="text-xs leading-relaxed text-kitchen-muted">
              {isIframe 
                ? "This error usually occurs because the preview iframe restricts cross-origin communication."
                : "The authentication is still failing. This usually points to a configuration issue in your Firebase Console."}
            </p>

            {isIframe && (
              <div className="space-y-3 bg-stone-50 p-4 border border-kitchen-border rounded-2xl">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-widest text-kitchen-primary font-bold">Recommended Solution:</p>
                  <span className="bg-orange-100 text-kitchen-primary text-[8px] px-2 py-1 rounded-lg font-bold uppercase tracking-wider">Iframe Bypass</span>
                </div>
                <button 
                  onClick={() => window.open(window.location.href, '_blank')}
                  className="w-full bg-kitchen-primary hover:bg-orange-700 text-white py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg group"
                >
                  <Globe size={16} className="group-hover:rotate-12 transition-transform" />
                  Open in New Tab to Login
                </button>
              </div>
            )}

            <div className="space-y-3 pt-3 border-t border-kitchen-border">
              <p className="text-[10px] uppercase tracking-widest text-kitchen-muted font-bold">Required Firebase Setup:</p>
              
              <div className="bg-stone-50 p-3 rounded-xl border border-kitchen-border space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <code className="text-[10px] text-kitchen-text break-all font-mono bg-stone-100 px-1.5 py-0.5 rounded">{hostname}</code>
                  <button 
                    onClick={() => copyToClipboard(hostname)}
                    className="shrink-0 p-1.5 hover:bg-stone-200 rounded-lg transition-colors text-stone-400 hover:text-kitchen-primary"
                    title="Copy Domain"
                  >
                    {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </button>
                </div>
                <p className="text-[9px] text-kitchen-muted leading-tight">
                  1. Go to <span className="text-kitchen-text font-bold">Firebase Console</span> &gt; <span className="text-kitchen-text font-bold">Authentication</span> &gt; <span className="text-kitchen-text font-bold">Settings</span><br/>
                  2. Add the domain above to <span className="text-kitchen-text font-bold">"Authorized Domains"</span><br/>
                  3. Ensure <span className="text-kitchen-text font-bold">Google Provider</span> is enabled.
                </p>
              </div>

              <div className="pt-2">
                <button 
                  onClick={() => setShowDebug(!showDebug)}
                  className="text-[9px] text-stone-400 hover:text-kitchen-primary underline underline-offset-2 uppercase tracking-widest font-bold"
                >
                  {showDebug ? 'Hide Technical Details' : 'Show Technical Details'}
                </button>
                
                {showDebug && (
                  <div className="mt-3 p-3 bg-stone-50 rounded-xl border border-kitchen-border font-mono text-[9px] text-kitchen-muted overflow-x-auto">
                    <p className="text-kitchen-text font-bold mb-1">RAW ERROR:</p>
                    <pre className="whitespace-pre-wrap">{safeStringify(rawError)}</pre>
                    <p className="text-kitchen-text font-bold mt-3 mb-1">CONFIG STATE:</p>
                    <p>Auth Ready: {auth ? 'YES' : 'NO'}</p>
                    <p>Provider: {googleProvider ? 'INITIALIZED' : 'MISSING'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
        setIsLoading(false);
        return;
      }
 else if (err.code === 'auth/popup-closed-by-user') {
        message = 'Login popup was closed before completion.';
      } else if (err.code === 'auth/cancelled-popup-request') {
        message = 'Only one login popup can be open at a time.';
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const validateSignup = () => {
    if (!name.trim()) return 'Please enter your full name';
    if (!email.trim()) return 'Please enter your email address';
    
    const isPasswordValid = Object.values(passwordRequirements).every(Boolean);
    if (!isPasswordValid) return 'Password does not meet all requirements';
    
    if (password !== confirmPassword) return 'Passwords do not match';
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (mode === 'signup') {
      const validationError = validateSignup();
      if (validationError) {
        setError(validationError);
        setIsLoading(false);
        return;
      }
    }

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        onClose();
      } else if (mode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        onClose();
      } else if (mode === 'forgot-password') {
        await sendPasswordResetEmail(auth, email);
        setSuccess('Password reset email sent! Please check your inbox.');
      }
    } catch (err: any) {
      console.error('Auth Error:', err);
      let message = 'An error occurred during authentication';
      
      if (err.code === 'auth/operation-not-allowed') {
        message = 'Email/Password login is not enabled in the Firebase Console.';
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = 'Invalid email or password. Please try again.';
      } else if (err.code === 'auth/email-already-in-use') {
        message = 'This email is already registered. Please sign in instead.';
      } else if (err.code === 'auth/weak-password') {
        message = 'Password is too weak. Please choose a stronger password.';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Too many failed attempts. Please try again later.';
      }
      
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-stone-900/40 backdrop-blur-md p-4 pt-12 md:pt-24 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: -20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white border border-kitchen-border w-full max-w-md overflow-hidden rounded-3xl shadow-2xl mb-12"
      >
        {/* Header */}
        <div className="p-8 border-b border-kitchen-border flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-5">
            <div className="bg-kitchen-primary p-3 rounded-2xl shadow-lg shadow-orange-100">
              <LogIn size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-serif font-bold tracking-tight text-kitchen-text">
                {mode === 'login' && 'Welcome Back'}
                {mode === 'signup' && 'Join ReciBee'}
                {mode === 'forgot-password' && 'Reset Access'}
              </h3>
              <p className="text-[10px] text-kitchen-muted uppercase tracking-widest font-bold mt-1">
                {mode === 'login' && (initialAction ? `Required to ${initialAction}` : 'Sign in to your recipe box')}
                {mode === 'signup' && 'Create your culinary identity'}
                {mode === 'forgot-password' && 'Recover your account credentials'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-kitchen-primary transition-colors p-2 hover:bg-stone-100 rounded-full">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* Status Messages */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-50 border border-red-100 p-5 rounded-2xl flex items-start gap-4 text-red-600 text-sm"
              >
                {typeof error === 'string' ? (
                  <>
                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                    <div className="leading-relaxed flex-1 font-medium">{error}</div>
                  </>
                ) : (
                  <div className="flex-1">{error}</div>
                )}
              </motion.div>
            )}

            {success && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-green-50 border border-green-100 p-5 rounded-2xl flex items-start gap-4 text-green-600 text-sm"
              >
                <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
                <p className="leading-relaxed font-medium">{success}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {mode === 'forgot-password' ? (
            <div className="space-y-8">
              <button 
                onClick={() => setMode('login')}
                className="flex items-center gap-2 text-xs font-bold text-kitchen-muted hover:text-kitchen-primary transition-colors group uppercase tracking-widest"
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Back to Login
              </button>
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-kitchen-muted uppercase tracking-widest">Email Address</label>
                  <div className="relative group">
                    <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-kitchen-primary transition-colors" />
                    <input
                      ref={firstInputRef}
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-stone-50 border border-kitchen-border rounded-2xl pl-12 pr-4 py-4 text-sm text-kitchen-text outline-none focus:border-kitchen-primary focus:ring-4 focus:ring-orange-50 transition-all placeholder:text-stone-300"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-kitchen-primary hover:bg-orange-700 text-white py-5 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-orange-100 uppercase tracking-widest"
                >
                  {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Send Reset Link'}
                </button>
              </form>
            </div>
          ) : (
            <>
              <div className="space-y-8">
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full bg-white border border-kitchen-border hover:bg-stone-50 text-kitchen-text py-4 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-4 shadow-sm hover:shadow-md active:scale-95"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {mode === 'login' ? 'Login via Google' : 'Sign up via Google'}
                </button>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-kitchen-border"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-6 text-[10px] font-bold uppercase tracking-[0.3em] text-stone-300">Authentication Bridge</span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {mode === 'signup' && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-kitchen-muted uppercase tracking-widest">Full Name</label>
                      <div className="relative group">
                        <UserIcon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-kitchen-primary transition-colors" />
                        <input
                          ref={firstInputRef}
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Linus Torvalds"
                          className="w-full bg-stone-50 border border-kitchen-border rounded-2xl pl-12 pr-4 py-4 text-sm text-kitchen-text outline-none focus:border-kitchen-primary focus:ring-4 focus:ring-orange-50 transition-all placeholder:text-stone-300"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-kitchen-muted uppercase tracking-widest">Email Address</label>
                    <div className="relative group">
                      <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-kitchen-primary transition-colors" />
                      <input
                        ref={mode === 'login' ? firstInputRef : undefined}
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full bg-stone-50 border border-kitchen-border rounded-2xl pl-12 pr-4 py-4 text-sm text-kitchen-text outline-none focus:border-kitchen-primary focus:ring-4 focus:ring-orange-50 transition-all placeholder:text-stone-300"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-kitchen-muted uppercase tracking-widest">Password</label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          onClick={() => setMode('forgot-password')}
                          className="text-[10px] text-kitchen-primary hover:text-orange-700 transition-colors font-bold uppercase tracking-widest"
                        >
                          Forgot?
                        </button>
                      )}
                    </div>
                    <div className="relative group">
                      <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-kitchen-primary transition-colors" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-stone-50 border border-kitchen-border rounded-2xl pl-12 pr-12 py-4 text-sm text-kitchen-text outline-none focus:border-kitchen-primary focus:ring-4 focus:ring-orange-50 transition-all placeholder:text-stone-300"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-kitchen-primary transition-colors"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    
                    {/* Password Strength Indicator for Signup */}
                    {mode === 'signup' && password.length > 0 && (
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-3">
                        {[
                          { key: 'length', label: '8+ Characters' },
                          { key: 'uppercase', label: 'Uppercase' },
                          { key: 'lowercase', label: 'Lowercase' },
                          { key: 'number', label: 'Number' },
                          { key: 'special', label: 'Special Char' }
                        ].map((req) => (
                          <div key={req.key} className="flex items-center gap-2">
                            <div className={cn(
                              "w-2 h-2 rounded-full transition-colors",
                              passwordRequirements[req.key as keyof typeof passwordRequirements] ? "bg-green-500 shadow-lg shadow-green-100" : "bg-stone-200"
                            )} />
                            <span className={cn(
                              "text-[10px] font-bold tracking-wider uppercase",
                              passwordRequirements[req.key as keyof typeof passwordRequirements] ? "text-green-600" : "text-stone-400"
                            )}>
                              {req.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {mode === 'signup' && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-kitchen-muted uppercase tracking-widest">Confirm Password</label>
                      <div className="relative group">
                        <ShieldCheck size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-kitchen-primary transition-colors" />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className={cn(
                            "w-full bg-stone-50 border rounded-2xl pl-12 pr-4 py-4 text-sm text-kitchen-text outline-none transition-all placeholder:text-stone-300",
                            confirmPassword && password !== confirmPassword 
                              ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-50" 
                              : "border-kitchen-border focus:border-kitchen-primary focus:ring-4 focus:ring-orange-50"
                          )}
                        />
                      </div>
                      {confirmPassword && password !== confirmPassword && (
                        <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider italic">Passwords do not match</p>
                      )}
                    </div>
                  )}

                  {mode === 'login' && (
                    <label className="flex items-center gap-3 cursor-pointer group w-fit">
                      <div className={cn(
                        "w-5 h-5 border-2 border-kitchen-border rounded-lg flex items-center justify-center transition-all",
                        rememberMe ? "bg-kitchen-primary border-kitchen-primary shadow-lg shadow-orange-100" : "group-hover:border-stone-400"
                      )} onClick={() => setRememberMe(!rememberMe)}>
                        {rememberMe && <div className="w-2 h-2 bg-white rounded-sm" />}
                      </div>
                      <span className="text-xs font-bold text-kitchen-muted group-hover:text-kitchen-text transition-colors uppercase tracking-widest">Remember me</span>
                    </label>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-kitchen-primary hover:bg-orange-700 text-white py-5 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-orange-100 uppercase tracking-widest active:scale-95"
                  >
                    {isLoading ? (
                      <Loader2 size={24} className="animate-spin" />
                    ) : (
                      <>
                        {mode === 'login' && 'Login'}
                        {mode === 'signup' && 'Create Account'}
                      </>
                    )}
                  </button>
                </form>

                <div className="text-center pt-4">
                  <button
                    onClick={() => {
                      setMode(mode === 'login' ? 'signup' : 'login');
                      resetForm();
                    }}
                    className="text-xs font-bold text-kitchen-muted hover:text-kitchen-primary transition-colors uppercase tracking-widest"
                  >
                    {mode === 'login' ? "New to ReciBee? Create Account" : "Existing user? Return to Login"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};
