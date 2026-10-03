import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { 
  loginWithGoogle, 
  loginWithEmail, 
  registerWithEmail, 
  loginAnonymously, 
  logoutUser 
} from '../utils/firebase';

interface AuthBarProps {
  user: User | null;
  loading: boolean;
  syncing: boolean;
  onRefreshSync?: () => void;
}

export function AuthBar({ user, loading, syncing, onRefreshSync }: AuthBarProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'google' | 'email_login' | 'email_signup'>('google');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [stargazerName, setStargazerName] = useState('');

  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';

  const handleCopyDomain = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(currentDomain);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      setAuthError(null);
      await loginWithGoogle();
      setShowAuthModal(false);
    } catch (err: any) {
      console.error('Google Sign in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        return;
      }
      
      if (err.code === 'auth/unauthorized-domain') {
        setAuthError(
          `Domain "${currentDomain}" is not yet in your Firebase Authorized Domains list. Add it in Firebase Console → Authentication → Settings → Authorized domains, or use Email/Password sign-in below.`
        );
      } else if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/configuration-not-found') {
        setAuthError(
          'Google Sign-in is not enabled in Firebase Console. Enable Google under Authentication → Sign-in method, or use Email sign-in below.'
        );
      } else if (err.code === 'auth/popup-blocked') {
        setAuthError('Sign-in popup was blocked by your browser. Please allow popups or try Email sign-in.');
      } else {
        setAuthError(err.message || 'Failed to sign in with Google');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError('Please enter both email and password.');
      return;
    }

    try {
      setIsSigningIn(true);
      setAuthError(null);
      if (authMode === 'email_signup') {
        await registerWithEmail(email.trim(), password, stargazerName.trim() || 'Stargazer');
      } else {
        await loginWithEmail(email.trim(), password);
      }
      setShowAuthModal(false);
    } catch (err: any) {
      console.error('Email auth error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setAuthError('Invalid email or password. If you do not have an account yet, click "Create Stargazer Account".');
      } else if (err.code === 'auth/email-already-in-use') {
        setAuthError('An account with this email already exists. Please choose "Sign In".');
      } else if (err.code === 'auth/weak-password') {
        setAuthError('Password should be at least 6 characters.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setAuthError('Email/Password sign-in is not enabled in Firebase Console → Authentication → Sign-in method.');
      } else {
        setAuthError(err.message || 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    try {
      setIsSigningIn(true);
      setAuthError(null);
      await loginAnonymously();
      setShowAuthModal(false);
    } catch (err: any) {
      console.error('Anonymous auth error:', err);
      setAuthError(err.message || 'Failed to connect instant cloud account.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setShowMenu(false);
      await logoutUser();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <header className="absolute top-4 right-6 z-30 flex items-center gap-3 font-sans-manrope">
      
      {/* Cloud Sync Status indicator */}
      {user && (
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#080a1c]/80 border border-white/10 text-[11px] text-[#8890AE]">
          <span 
            className={`w-1.5 h-1.5 rounded-full ${
              syncing ? 'bg-[#F2C572] animate-ping' : 'bg-[#4A7C59]'
            }`} 
          />
          <span className="font-mono-dm text-[10px] text-[#8890AE]">
            {syncing ? 'syncing sky…' : 'cloud saved'}
          </span>
        </div>
      )}

      {/* User signed in vs Guest button */}
      {user ? (
        <div className="relative">
          <button
            onClick={() => setShowMenu((prev) => !prev)}
            className="flex items-center gap-2 p-1 pl-2.5 pr-1.5 rounded-full bg-[#080a1c]/90 border border-white/15 hover:border-[#F2C572]/50 transition-colors shadow-lg cursor-pointer"
          >
            <span className="text-xs text-[#EDEFF7] font-medium max-w-[120px] truncate hidden md:inline">
              {user.displayName || (user.isAnonymous ? 'Guest Stargazer' : user.email?.split('@')[0]) || 'Stargazer'}
            </span>
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-6 h-6 rounded-full border border-[#F2C572]/40"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-[#F2C572]/20 border border-[#F2C572]/40 flex items-center justify-center text-[10px] text-[#F2C572]">
                ★
              </div>
            )}
          </button>

          {/* User Dropdown Menu */}
          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowMenu(false)} 
              />
              <div className="absolute right-0 top-10 z-50 w-64 rounded-xl bg-[#0d1028]/95 backdrop-blur-xl border border-white/15 p-3.5 shadow-2xl space-y-3">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-white/10">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="avatar"
                      className="w-8 h-8 rounded-full border border-[#F2C572]"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#F2C572]/20 border border-[#F2C572] flex items-center justify-center text-xs text-[#F2C572]">
                      ★
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <div className="text-xs font-semibold text-[#EDEFF7] truncate">
                      {user.displayName || (user.isAnonymous ? 'Guest Stargazer' : 'Stargazer')}
                    </div>
                    <div className="text-[10px] text-[#8890AE] font-mono-dm truncate">
                      {user.email || (user.isAnonymous ? 'Temporary Cloud ID: ' + user.uid.slice(0, 6) : 'Connected')}
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="text-[11px] text-[#8890AE] font-serif-cormorant italic">
                    Your constellation, unlit stars, and buried thoughts are synced to your cloud database.
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                  {onRefreshSync && (
                    <button
                      onClick={() => {
                        onRefreshSync();
                        setShowMenu(false);
                      }}
                      className="text-[11px] text-[#A9C0F0] hover:text-[#EDEFF7] underline font-mono-dm cursor-pointer"
                    >
                      force sync
                    </button>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="px-3 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-[#E0654A] border border-red-500/20 text-xs transition-colors cursor-pointer"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <button
          onClick={() => {
            setAuthError(null);
            setShowAuthModal(true);
          }}
          disabled={isSigningIn || loading}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#080a1c]/80 hover:bg-[#0f1438]/90 border border-[#F2C572]/40 hover:border-[#F2C572] text-[#F2C572] text-xs transition-all duration-200 shadow-lg cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span className="font-serif-cormorant italic text-[13px]">
            {isSigningIn ? 'Connecting…' : 'Sign in to sync sky'}
          </span>
        </button>
      )}

      {/* Full Modal for Authentication & Setup */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-[#0a0d24] border border-[#F2C572]/30 rounded-2xl p-6 shadow-2xl text-[#EDEFF7] space-y-5">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-serif-cormorant text-xl font-medium text-[#F2C572]">
                  Stargazer Authentication
                </h3>
                <p className="text-[12px] text-[#8890AE]">
                  Sync your life horizon, tonight's stars, and thoughts
                </p>
              </div>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-[#8890AE] hover:text-white text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Error Banner */}
            {authError && (
              <div className="bg-[#2a0c10]/90 border border-red-500/40 text-red-200 text-xs p-3 rounded-xl space-y-2">
                <div className="font-semibold text-red-300 flex items-center gap-1.5">
                  <span>⚠️</span> Auth Notice
                </div>
                <div className="text-[12px] leading-relaxed">{authError}</div>
                {authError.includes('Authorized domains') && (
                  <div className="pt-1 flex items-center gap-2">
                    <button
                      onClick={handleCopyDomain}
                      className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30 rounded text-[11px] font-mono-dm transition-colors cursor-pointer"
                    >
                      {copiedDomain ? '✓ Copied hostname!' : 'Copy current hostname'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Google Sign-in Primary Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 hover:border-[#F2C572]/50 text-white font-medium text-sm transition-all duration-150 cursor-pointer shadow-md disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
              </svg>
              <span>{isSigningIn ? 'Signing in…' : 'Continue with Google'}</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[11px] text-[#8890AE] uppercase tracking-wider font-mono-dm">or with email</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailAuth} className="space-y-3">
              {authMode === 'email_signup' && (
                <div>
                  <label className="block text-[11px] text-[#8890AE] mb-1 font-mono-dm uppercase tracking-wider">
                    Stargazer Name
                  </label>
                  <input
                    type="text"
                    value={stargazerName}
                    onChange={(e) => setStargazerName(e.target.value)}
                    placeholder="e.g. Orion"
                    className="w-full bg-[#050714] border border-white/15 rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:border-[#F2C572] focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] text-[#8890AE] mb-1 font-mono-dm uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="stargazer@cosmos.com"
                  className="w-full bg-[#050714] border border-white/15 rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:border-[#F2C572] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#8890AE] mb-1 font-mono-dm uppercase tracking-wider">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#050714] border border-white/15 rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:border-[#F2C572] focus:outline-none"
                />
              </div>

              <div className="pt-1 flex items-center justify-between gap-3">
                <button
                  type="submit"
                  disabled={isSigningIn}
                  className="flex-1 py-2 rounded-lg bg-[#F2C572] hover:bg-[#ffe29a] text-[#080a1c] font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSigningIn 
                    ? 'Processing…' 
                    : authMode === 'email_signup' ? 'Create Stargazer Account' : 'Sign In with Email'}
                </button>
              </div>
            </form>

            <div className="flex items-center justify-between text-xs text-[#8890AE] pt-1">
              {authMode === 'email_signup' ? (
                <button
                  onClick={() => {
                    setAuthMode('email_login');
                    setAuthError(null);
                  }}
                  className="hover:text-[#F2C572] underline cursor-pointer"
                >
                  Already have an account? Sign In
                </button>
              ) : (
                <button
                  onClick={() => {
                    setAuthMode('email_signup');
                    setAuthError(null);
                  }}
                  className="hover:text-[#F2C572] underline cursor-pointer"
                >
                  Need an account? Create Stargazer Account
                </button>
              )}

              <button
                onClick={handleAnonymousSignIn}
                disabled={isSigningIn}
                className="hover:text-[#A9C0F0] underline font-mono-dm text-[11px] cursor-pointer"
              >
                Instant Guest Sync →
              </button>
            </div>

          </div>
        </div>
      )}

    </header>
  );
}
