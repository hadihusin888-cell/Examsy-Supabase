
import React from 'react';
import { ViewState } from '../types';

interface LandingViewProps {
  onNavigate: (view: ViewState) => void;
}

const LandingView: React.FC<LandingViewProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center max-w-4xl mx-auto">
      <div className="mb-14">
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

      <footer className="mt-28 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
        &copy; 2026 HUMAS SMP AL IRSYAD SURAKARTA
      </footer>
    </div>
  );
};

export default LandingView;
