import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { SignIn } from '@clerk/clerk-react';
import { AdminContext } from '../context/AdminContext';

export default function AdminLoginPage() {
  const { isAuthenticated, loading } = useContext(AdminContext);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#05040a]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-gray-500 font-black uppercase text-[10px] tracking-widest">Verifying Identity</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen grid place-items-center bg-[#05040a] px-4 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]" />
        </div>

      <div className="silk-card w-full max-w-md p-10 relative z-10 animate-in fade-in zoom-in duration-700">
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-[2rem] bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 mb-6 shadow-2xl shadow-indigo-500/20">
            <Sparkles size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight uppercase">Terminal Access</h1>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2 px-3 py-1 bg-white/5 rounded-full inline-block border border-white/5">
                SriKumaranSilks Admin Operations
            </p>
          </div>
        </div>
        
        <div className="overflow-hidden rounded-[2.5rem] border border-white/5 bg-[#0c0b14]/50 backdrop-blur-xl shadow-2xl">
          <SignIn routing="path" path="/login" signUpUrl="/login" forceRedirectUrl="/" />
        </div>
        
        <p className="mt-8 text-center text-[10px] font-bold text-gray-700 uppercase tracking-[0.2em]">
            Secure Encrypted Environment
        </p>
      </div>
    </div>
  );
}
