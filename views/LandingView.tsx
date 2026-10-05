
import React from 'react';
import { ViewState } from '../types';
import { APP_LOGO_URL, APP_LOGO_FALLBACK } from '../constants';

interface LandingViewProps {
  onNavigate: (view: ViewState) => void;
}

const LandingView: React.FC<LandingViewProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center max-w-4xl mx-auto">
      <div className="mb-12 flex flex-col items-center">
        <div className="mb-6 px-5 py-2.5 bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center justify-center h-20 max-w-[280px]">
          <img 
            src={APP_LOGO_URL} 
            alt="Logo Al-Irsyad Al-Islamiyyah" 
            className="max-h-full max-w-full object-contain"
            onError={(e) => { (e.target as HTMLImageElement).src = APP_LOGO_FALLBACK; }}
          />
        </div>
        <span className="text-xs font-black uppercase tracking-[0.25em] text-indigo-500 mb-3 block">
          Platform Evaluasi Akademik
        </span>
        <h1 className="text-6xl text-slate-900 mb-4 font-extrabold tracking-tight">
          Examsy<span className="text-indigo-600">.</span>
        </h1>
        <p className="text-base text-slate-500 max-w-md mx-auto leading-relaxed">
          Sistem penilaian semi-online yang dirancang dengan presisi, kesederhanaan, dan standar formalitas tinggi.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl px-4">
        <button
          onClick={() => onNavigate('STUDENT_LOGIN')}
          className="group relative flex flex-col items-center p-8 bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-200/80 hover:border-indigo-500/50 hover:shadow-[0_8px_30px_rgba(30,41,59,0.06)] transition-all duration-300 cursor-pointer"
        >
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-5 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-950 mb-1.5 tracking-tight">Portal Siswa</h2>
          <p className="text-xs text-slate-400">Masuk ke ruang ujian menggunakan NIS dan PIN Sesi resmi.</p>
        </button>

        <button
          onClick={() => onNavigate('ADMIN_LOGIN')}
          className="group relative flex flex-col items-center p-8 bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-200/80 hover:border-indigo-500/50 hover:shadow-[0_8px_30px_rgba(30,41,59,0.06)] transition-all duration-300 cursor-pointer"
        >
          <div className="w-14 h-14 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center mb-5 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-950 mb-1.5 tracking-tight">Portal Admin & Proktor</h2>
          <p className="text-xs text-slate-400">Pengawasan real-time, manajemen bank soal, dan hasil analitik.</p>
        </button>
      </div>

      <footer className="mt-28 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => {
            localStorage.clear();
            sessionStorage.clear();
            if (typeof navigator !== 'undefined' && navigator.serviceWorker) {
              navigator.serviceWorker.getRegistrations().then(registrations => {
                for (let registration of registrations) {
                  registration.unregister();
                }
              });
            }
            alert("Cache berhasil dibersihkan! Halaman akan dimuat ulang.");
            window.location.reload();
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-amber-500 hover:text-white border border-slate-200 text-slate-500 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all duration-200 active:scale-95 shadow-sm cursor-pointer hover:shadow-md"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Bersihkan Cache Aplikasi
        </button>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">
          &copy; 2026 HUMAS SMP AL IRSYAD SURAKARTA
        </span>
      </footer>
    </div>
  );
};

export default LandingView;
