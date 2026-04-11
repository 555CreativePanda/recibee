import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, LogIn, Mail, Lock, User as UserIcon, AlertCircle, CheckCircle2, Loader2, Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile
} from '../lib/firebase';
import { cn } from '../lib/utils';

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
  const [error, setError] = useState<string | null>(null);
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

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to login with Google');
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
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/80 backdrop-blur-md p-4 pt-12 md:pt-24 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: -20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="bg-carbon-gray-90 border border-carbon-gray-80 w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] mb-12"
      >
        {/* Header */}
        <div className="p-6 border-b border-carbon-gray-80 flex items-center justify-between bg-carbon-gray-100/30">
          <div className="flex items-center gap-4">
            <div className="bg-carbon-blue-60 p-2.5 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
              <LogIn size={22} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight">
                {mode === 'login' && 'Welcome Back'}
                {mode === 'signup' && 'Join ReciBee'}
                {mode === 'forgot-password' && 'Reset Access'}
              </h3>
              <p className="text-[10px] text-carbon-gray-30 uppercase tracking-[0.2em] mt-0.5">
                {mode === 'login' && (initialAction ? `Required to ${initialAction}` : 'Sign in to your repository')}
                {mode === 'signup' && 'Create your culinary identity'}
                {mode === 'forgot-password' && 'Recover your account credentials'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-carbon-gray-30 hover:text-white transition-colors p-2 hover:bg-carbon-gray-80 rounded-full">
            <X size={20} />
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
                className="bg-red-500/10 border border-red-500/20 p-4 flex items-start gap-3 text-red-400 text-sm"
              >
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p className="leading-relaxed">{error}</p>
              </motion.div>
            )}

            {success && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-green-500/10 border border-green-500/20 p-4 flex items-start gap-3 text-green-400 text-sm"
              >
                <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                <p className="leading-relaxed">{success}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {mode === 'forgot-password' ? (
            <div className="space-y-6">
              <button 
                onClick={() => setMode('login')}
                className="flex items-center gap-2 text-xs text-carbon-gray-30 hover:text-white transition-colors group"
              >
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                Back to Login
              </button>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-carbon-gray-30 uppercase tracking-[0.2em]">Email Address</label>
                  <div className="relative group">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-carbon-gray-30 group-focus-within:text-carbon-blue-60 transition-colors" />
                    <input
                      ref={firstInputRef}
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-carbon-gray-100 border border-carbon-gray-80 pl-12 pr-4 py-3 text-sm outline-none focus:border-carbon-blue-60 transition-all placeholder:text-carbon-gray-80"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-carbon-blue-60 hover:bg-carbon-blue-70 text-white py-3.5 text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_4px_15px_rgba(59,130,246,0.2)]"
                >
                  {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Send Reset Link'}
                </button>
              </form>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-6">
                {mode === 'signup' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-carbon-gray-30 uppercase tracking-[0.2em]">Full Name</label>
                    <div className="relative group">
                      <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-carbon-gray-30 group-focus-within:text-carbon-blue-60 transition-colors" />
                      <input
                        ref={firstInputRef}
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Linus Torvalds"
                        className="w-full bg-carbon-gray-100 border border-carbon-gray-80 pl-12 pr-4 py-3 text-sm outline-none focus:border-carbon-blue-60 transition-all placeholder:text-carbon-gray-80"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-carbon-gray-30 uppercase tracking-[0.2em]">Email Address</label>
                  <div className="relative group">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-carbon-gray-30 group-focus-within:text-carbon-blue-60 transition-colors" />
                    <input
                      ref={mode === 'login' ? firstInputRef : undefined}
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-carbon-gray-100 border border-carbon-gray-80 pl-12 pr-4 py-3 text-sm outline-none focus:border-carbon-blue-60 transition-all placeholder:text-carbon-gray-80"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono text-carbon-gray-30 uppercase tracking-[0.2em]">Password</label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => setMode('forgot-password')}
                        className="text-[10px] text-carbon-blue-60 hover:text-white transition-colors uppercase tracking-widest"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="relative group">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-carbon-gray-30 group-focus-within:text-carbon-blue-60 transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-carbon-gray-100 border border-carbon-gray-80 pl-12 pr-12 py-3 text-sm outline-none focus:border-carbon-blue-60 transition-all placeholder:text-carbon-gray-80"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-carbon-gray-30 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  
                  {/* Password Strength Indicator for Signup */}
                  {mode === 'signup' && password.length > 0 && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-2">
                      {[
                        { key: 'length', label: '8+ Characters' },
                        { key: 'uppercase', label: 'Uppercase' },
                        { key: 'lowercase', label: 'Lowercase' },
                        { key: 'number', label: 'Number' },
                        { key: 'special', label: 'Special Char' }
                      ].map((req) => (
                        <div key={req.key} className="flex items-center gap-2">
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full transition-colors",
                            passwordRequirements[req.key as keyof typeof passwordRequirements] ? "bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" : "bg-carbon-gray-80"
                          )} />
                          <span className={cn(
                            "text-[10px] font-mono tracking-wider",
                            passwordRequirements[req.key as keyof typeof passwordRequirements] ? "text-green-500" : "text-carbon-gray-30"
                          )}>
                            {req.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {mode === 'signup' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-carbon-gray-30 uppercase tracking-[0.2em]">Confirm Password</label>
                    <div className="relative group">
                      <ShieldCheck size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-carbon-gray-30 group-focus-within:text-carbon-blue-60 transition-colors" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className={cn(
                          "w-full bg-carbon-gray-100 border pl-12 pr-4 py-3 text-sm outline-none transition-all placeholder:text-carbon-gray-80",
                          confirmPassword && password !== confirmPassword ? "border-red-500/50 focus:border-red-500" : "border-carbon-gray-80 focus:border-carbon-blue-60"
                        )}
                      />
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-[10px] text-red-400 font-mono italic">Passwords do not match</p>
                    )}
                  </div>
                )}

                {mode === 'login' && (
                  <label className="flex items-center gap-3 cursor-pointer group w-fit">
                    <div className={cn(
                      "w-4 h-4 border border-carbon-gray-80 flex items-center justify-center transition-all",
                      rememberMe ? "bg-carbon-blue-60 border-carbon-blue-60 shadow-[0_0_8px_rgba(59,130,246,0.4)]" : "group-hover:border-carbon-gray-30"
                    )} onClick={() => setRememberMe(!rememberMe)}>
                      {rememberMe && <div className="w-1.5 h-1.5 bg-white" />}
                    </div>
                    <span className="text-xs text-carbon-gray-30 group-hover:text-white transition-colors">Remember me</span>
                  </label>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-carbon-blue-60 hover:bg-carbon-blue-70 text-white py-4 text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_4px_20px_rgba(59,130,246,0.25)] hover:shadow-[0_4px_25px_rgba(59,130,246,0.4)] active:scale-[0.98]"
                >
                  {isLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      {mode === 'login' && 'Login'}
                      {mode === 'signup' && 'Create Account'}
                    </>
                  )}
                </button>
              </form>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-carbon-gray-80"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-[0.3em]">
                  <span className="bg-carbon-gray-90 px-4 text-carbon-gray-30 font-mono">Authentication Bridge</span>
                </div>
              </div>

              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full border border-carbon-gray-80 hover:bg-carbon-gray-80/50 hover:border-white/20 text-white py-3.5 text-sm font-medium transition-all flex items-center justify-center gap-3 backdrop-blur-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                Login via Google
              </button>

              <div className="text-center pt-2">
                <button
                  onClick={() => {
                    setMode(mode === 'login' ? 'signup' : 'login');
                    resetForm();
                  }}
                  className="text-xs text-carbon-gray-30 hover:text-carbon-blue-60 transition-colors font-mono tracking-tight"
                >
                  {mode === 'login' ? "New to the repository? Create Account" : "Existing user? Return to Login"}
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};
