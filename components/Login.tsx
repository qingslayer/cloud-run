import React from 'react';
import { LogInIcon } from './icons/LogInIcon';
import { HealthVaultLogo } from './icons/HealthVaultLogo';
import { WelcomeIllustration } from './illustrations/WelcomeIllustration';
import { LockClosedIcon } from './icons/LockClosedIcon';

interface LoginProps {
  onLogin: () => void;
}

const GoogleIcon = () => (
    <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path>
        <path fill="#FF3D00" d="M6.306 14.691c-1.645 3.283-2.645 7.022-2.645 11.029C3.661 32.613 8.112 39.29 14.691 43.694l-5.657-5.657C5.535 34.596 3.661 29.613 3.661 24c0-2.479.432-4.844 1.205-7.029l-5.657-5.657z"></path>
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path>
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path>
    </svg>
);


const Login: React.FC<LoginProps> = ({ onLogin }) => {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-4 overflow-hidden bg-stone-50 dark:bg-[#0B1120]">
       <div className="w-full max-w-sm mx-auto text-center z-10">
        <div className="flex justify-center mb-6">
            <WelcomeIllustration className="w-full max-w-[280px]" />
        </div>
        
        <div className="flex items-center justify-center space-x-3 mb-2">
            <HealthVaultLogo className="h-9 w-9 text-teal-500 dark:text-teal-400" />
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
              Health Vault
            </h1>
        </div>

        <p className="text-base text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
          Your secure and intelligent space for understanding your health records.
        </p>

        <div className="mt-8 space-y-4">
          <button
            onClick={() => alert("This would trigger a Google OAuth flow in a real application.")}
            className="w-full flex items-center justify-center px-6 py-3 text-base font-semibold bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-stone-100 dark:hover:bg-slate-800 transition-all duration-200 border border-stone-300 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-teal-500/50 shadow-sm"
          >
            <GoogleIcon />
            Sign in with Google
          </button>
          <button
            onClick={onLogin}
            className="w-full flex items-center justify-center px-6 py-3 text-base font-semibold bg-stone-200 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-stone-300 dark:hover:bg-slate-700 transition-all duration-200 border border-stone-300 dark:border-slate-600 focus:outline-none focus:ring-4 focus:ring-teal-500/50 shadow-sm"
          >
            <LogInIcon className="h-5 w-5 mr-3" />
            Continue as Demo User
          </button>
        </div>
        
        <div className="mt-8 flex items-center justify-center space-x-2">
            <LockClosedIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your data is encrypted and securely stored.
            </p>
        </div>

        <p className="mt-6 text-xs text-slate-400 dark:text-slate-600">
          This is a demo. Please do not upload real medical records.
        </p>
      </div>
    </div>
  );
};

export default Login;