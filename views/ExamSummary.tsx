
import React from 'react';
import { ExamSubmission, ExamSession } from '../types';

interface ExamSummaryProps {
  submission: ExamSubmission;
  session: ExamSession;
  onBack: () => void;
}

const ExamSummary: React.FC<ExamSummaryProps> = ({ submission, session, onBack }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50/50">
      <div className="w-full max-w-xl bg-white p-10 md:p-12 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.02)] border border-slate-200/80 text-center animate-in fade-in duration-300">
        <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-4xl font-extrabold text-slate-900 mb-2">Ujian Selesai!</h1>
        <p className="text-slate-500 mb-8 text-sm leading-relaxed max-w-md mx-auto">Terima kasih telah mengerjakan {session.name}. Jawaban Anda telah berhasil direkam ke dalam sistem evaluasi akademik.</p>

        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="bg-slate-50/60 p-5 rounded-xl border border-slate-200/40">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1">Skor Akhir</p>
            <p className="text-3xl font-black text-indigo-600">{Math.round(submission.score)}</p>
          </div>
          <div className="bg-slate-50/60 p-5 rounded-xl border border-slate-200/40">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1">Status</p>
            <p className={`text-2xl font-black ${submission.score >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {submission.score >= 75 ? 'LULUS' : 'REMEDIAL'}
            </p>
          </div>
        </div>

        <button
          onClick={onBack}
          className="w-full bg-slate-950 hover:bg-slate-900 text-white font-black py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] uppercase text-[11px] tracking-widest cursor-pointer"
        >
          Kembali ke Beranda
        </button>
        
        <p className="mt-8 text-slate-400 text-[10px] font-black uppercase tracking-widest">
          Sinkronisasi Otomatis Cloud Berhasil
        </p>
      </div>
    </div>
  );
};

export default ExamSummary;
