
import React, { useState, useEffect } from 'react';
import { ViewState, Student, ExamSession, StudentStatus, Room } from './types';
import { dbAction, supabase, fetchStaticData, checkIsOfflineFallbackActive, setOfflineFallbackActive, DEFAULT_FALLBACK_STUDENTS, DEFAULT_FALLBACK_SESSIONS, DEFAULT_FALLBACK_ROOMS, getDirectStudentAndSession, subscribeStudent, subscribeAllStudents } from './services/supabaseService';

import StudentLogin from './views/StudentLogin';
import AdminLogin from './views/AdminLogin';
import AdminDashboard from './views/AdminDashboard';
import ProctorDashboard from './views/ProctorDashboard';
import ExamRoom from './views/ExamRoom';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AppErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("AppErrorBoundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-white">
          <div className="p-4 bg-red-500/10 text-red-400 rounded-2xl mb-4 border border-red-500/20 max-w-md">
            <h2 className="text-lg font-black uppercase tracking-wider mb-2">Terjadi Kendala Tampilan</h2>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Aplikasi mengalami kesalahan saat merender halaman. Klik tombol di bawah untuk membersihkan cache & memuat ulang.
            </p>
            <p className="text-[10px] font-mono bg-slate-950/50 p-2 rounded text-red-300 truncate max-w-sm mb-4">
              {this.state.error?.message || "Unknown error"}
            </p>
            <button
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
              }}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg"
            >
              Reset Cache & Muat Ulang
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('STUDENT_LOGIN');
  const [currentUser, setCurrentUser] = useState<Student | null>(null);
  const [currentSession, setCurrentSession] = useState<ExamSession | null>(null);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false); 
  const [isSyncing, setIsSyncing] = useState(true);
  const [showIdleLogoutNotice, setShowIdleLogoutNotice] = useState(false);

  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  const handleLogout = () => {
    localStorage.removeItem('examsy_auth');
    setActiveRoom(null);
    setCurrentUser(null);
    setCurrentSession(null);
    setView('STUDENT_LOGIN');
  };

  // Monitor aktivitas admin & proktor untuk auto-logout jika tidak aktif selama 15 menit
  useEffect(() => {
    if (view !== 'ADMIN_DASHBOARD' && view !== 'PROCTOR_DASHBOARD') {
      return;
    }

    const TIMEOUT_DURATION = 15 * 60 * 1000; // 15 menit
    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        handleLogout();
        setShowIdleLogoutNotice(true);
      }, TIMEOUT_DURATION);
    };

    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart', 'click'];
    
    // Mulai timer awal
    resetTimer();

    // Daftarkan listener aktivitas
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [view]);

  // Effect untuk mengecek session yang tersimpan di localStorage
  useEffect(() => {
    const savedAuth = localStorage.getItem('examsy_auth');
    if (savedAuth) {
      try {
        const auth = JSON.parse(savedAuth);
        if (auth.role === 'ADMIN') {
          setView('ADMIN_DASHBOARD');
          setIsLoading(false);
          setIsSyncing(false);
        } else if (auth.role === 'PROCTOR' && auth.roomId) {
          const cachedRoomsRaw = localStorage.getItem("examsy_cache_rooms");
          const cachedRooms = cachedRoomsRaw ? JSON.parse(cachedRoomsRaw) : DEFAULT_FALLBACK_ROOMS;
          const matchedRoom = cachedRooms.find((r: Room) => String(r.id) === String(auth.roomId));
          if (matchedRoom) {
            setActiveRoom(matchedRoom);
            setView('PROCTOR_DASHBOARD');
          } else {
            localStorage.removeItem('examsy_auth');
            setView('STUDENT_LOGIN');
          }
          setIsLoading(false);
          setIsSyncing(false);
        } else if (auth.role === 'STUDENT' && auth.nis && auth.sessionId) {
          // Muat data murid dan sesi secara langsung dan hemat pemakaian kuota
          const loadDirectData = async () => {
            try {
              if (checkIsOfflineFallbackActive()) {
                throw new Error("Quota Exceeded Mode");
              }
              const { student, session } = await getDirectStudentAndSession(String(auth.nis), String(auth.sessionId));

              if (student && session) {
                setCurrentUser(student);
                setCurrentSession(session);
                setView('EXAM_ROOM');
              } else {
                localStorage.removeItem('examsy_auth');
                setView('STUDENT_LOGIN');
              }
            } catch (err) {
              console.warn("Direct fetch error on mount, attempting local cached load:", err);
              const cachedStudentsRaw = localStorage.getItem("examsy_cache_students");
              const cachedSessionsRaw = localStorage.getItem("examsy_cache_sessions");
              
              const cachedStudents = cachedStudentsRaw ? JSON.parse(cachedStudentsRaw) : DEFAULT_FALLBACK_STUDENTS;
              const cachedSessions = cachedSessionsRaw ? JSON.parse(cachedSessionsRaw) : DEFAULT_FALLBACK_SESSIONS;
              
              const matchedStudent = cachedStudents.find((s: Student) => String(s.nis) === String(auth.nis));
              const matchedSession = cachedSessions.find((s: ExamSession) => String(s.id) === String(auth.sessionId));

              if (matchedStudent && matchedSession) {
                setCurrentUser(matchedStudent);
                setCurrentSession(matchedSession);
                setView('EXAM_ROOM');
              } else {
                localStorage.removeItem('examsy_auth');
                setView('STUDENT_LOGIN');
              }
            } finally {
              setIsLoading(false);
              setIsSyncing(false);
            }
          };
          loadDirectData();
        } else {
          localStorage.removeItem('examsy_auth');
          setView('STUDENT_LOGIN');
          setIsLoading(false);
          setIsSyncing(false);
        }
      } catch (e) {
        console.error("Error parsing saved auth", e);
        localStorage.removeItem('examsy_auth');
        setView('STUDENT_LOGIN');
        setIsLoading(false);
        setIsSyncing(false);
      }
    } else {
      setView('STUDENT_LOGIN');
      setIsLoading(false);
      setIsSyncing(false);
    }
  }, []);

  const refreshData = async () => {
    setIsSyncing(true);
    try {
      const data = await fetchStaticData();
      setStudents(data.students);
      setSessions(data.sessions);
      setRooms(data.rooms);
    } catch (e) {
      console.error("Gagal memuat data dari database:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Hanya lakukan load data jika user berada di menu Admin / Proktor
  useEffect(() => {
    if (view !== 'ADMIN_DASHBOARD' && view !== 'PROCTOR_DASHBOARD' && view !== 'ADMIN_LOGIN') {
      return;
    }
    refreshData();
  }, [view]);

  // Sangat penting: Listener real-time single-doc untuk murid yang sedang ujian lewat Supabase
  useEffect(() => {
    if (view !== 'EXAM_ROOM' || !currentUser?.nis) {
      return;
    }

    const unsub = subscribeStudent(String(currentUser.nis), (updatedStudent) => {
      if (updatedStudent) {
        setCurrentUser(updatedStudent);
        setStudents(prev => {
          const idx = prev.findIndex(s => String(s.nis) === String(updatedStudent.nis));
          if (idx > -1) {
            const nextList = [...prev];
            nextList[idx] = updatedStudent;
            return nextList;
          }
          return [...prev, updatedStudent];
        });
      }
    });

    return () => unsub();
  }, [view, currentUser?.nis]);

  // Listener Real-time WebSocket Supabase untuk Admin & Proktor
  // Menerima update status siswa secara instant tanpa polling/read berulang (hemat kuota database)
  useEffect(() => {
    if (view !== 'ADMIN_DASHBOARD' && view !== 'PROCTOR_DASHBOARD') {
      return;
    }

    const unsub = subscribeAllStudents((eventType, student, oldNis) => {
      setStudents(prev => {
        if (eventType === 'DELETE' && oldNis) {
          return prev.filter(s => String(s.nis) !== String(oldNis));
        }
        const targetNis = String(student.nis);
        const idx = prev.findIndex(s => String(s.nis) === targetNis);
        if (idx > -1) {
          const nextList = [...prev];
          nextList[idx] = { ...nextList[idx], ...student };
          return nextList;
        } else {
          return [...prev, student];
        }
      });
    });

    return () => unsub();
  }, [view]);

  // Sync cache lokal & antar-tab untuk mode offline/simulasi
  useEffect(() => {
    const handleLocalCacheUpdate = () => {
      const cachedStudentsRaw = localStorage.getItem("examsy_cache_students");
      if (cachedStudentsRaw) {
        try {
          const parsed = JSON.parse(cachedStudentsRaw) as Student[];
          setStudents(parsed);
          if (currentUser) {
            const updated = parsed.find(s => String(s.nis) === String(currentUser.nis));
            if (updated) setCurrentUser(updated);
          }
        } catch (_) {}
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'examsy_cache_students' && e.newValue) {
        handleLocalCacheUpdate();
      }
    };

    window.addEventListener('examsy_local_cache_updated', handleLocalCacheUpdate);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('examsy_local_cache_updated', handleLocalCacheUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [currentUser]);

  const handleAction = async (action: string, payload: any) => {
    setIsProcessing(true);
    const success = await dbAction(action, payload);
    if (success) {
      if (view === 'ADMIN_DASHBOARD' || view === 'PROCTOR_DASHBOARD' || view === 'ADMIN_LOGIN') {
        await refreshData();
      }
    }
    setIsProcessing(false);
    return success;
  };

  const handleStudentLogin = async (student: Student, session: ExamSession) => {
    setIsProcessing(true);
    
    // Simpan auth ke localStorage agar tidak logout saat refresh
    localStorage.setItem('examsy_auth', JSON.stringify({ 
      role: 'STUDENT', 
      nis: student.nis, 
      sessionId: session.id 
    }));

    // Update status siswa menjadi sedang ujian di database
    // Gunakan latest data dari state jika mungkin
    const latestStudent = students.find(s => String(s.nis) === String(student.nis)) || student;

    const success = await handleAction('UPDATE_STUDENT', { 
      ...latestStudent, 
      status: StudentStatus.SEDANG_UJIAN 
    });
    
    if (success) {
      setCurrentUser(latestStudent);
      setCurrentSession(session);
      setView('EXAM_ROOM');
    } else {
      localStorage.removeItem('examsy_auth'); // Reset jika gagal
      alert("Gagal memproses login. Silakan cek koneksi Anda.");
    }
    setIsProcessing(false);
  };

  const isSimulated = checkIsOfflineFallbackActive();

  // Storage event listener to sync state across tabs during offline/quota-exceeded simulation
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'examsy_cache_students' && e.newValue && currentUser) {
        try {
          const parsed = JSON.parse(e.newValue) as Student[];
          const updated = parsed.find(s => String(s.nis) === String(currentUser.nis));
          if (updated && JSON.stringify(updated) !== JSON.stringify(currentUser)) {
            setCurrentUser(updated);
          }
        } catch (_) {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [currentUser]);



  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-10 text-center">
        <div className="w-12 h-12 border-4 border-white/10 border-t-indigo-500 rounded-full animate-spin mb-6"></div>
        <h2 className="text-white font-black uppercase tracking-[0.2em] text-xs">Examsy Cloud Sync...</h2>
        <p className="text-slate-500 text-[10px] mt-2 uppercase font-bold">Mempersiapkan Database Real-time</p>
      </div>
    );
  }

  return (
    <AppErrorBoundary>
      <div className="min-h-screen bg-slate-50 overflow-x-hidden relative">
        {/* Simulation/Quota mode indicator */}
        {isSimulated && (
          <div id="simulated-quota-alert" className="bg-amber-500 text-slate-950 px-4 py-3 text-center text-[10px] md:text-xs font-black uppercase tracking-wider flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 border-b border-amber-600/30 shrink-0 z-50 relative">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 shrink-0 animate-pulse text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Mode Simulasi Lokal Aktif (Quota Basis Data Penuh) — Seluruh Fitur Berjalan Menggunakan Penyimpanan Lokal.</span>
            </div>
            <button
              id="exit-simulation-btn"
              onClick={() => {
                setOfflineFallbackActive(false);
                window.location.reload();
              }}
              className="px-3 py-1 bg-slate-950 hover:bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all shadow-md shrink-0 flex items-center gap-1 active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Keluar Simulasi (Hubungkan Database)
            </button>
          </div>
        )}

        {(view === 'STUDENT_LOGIN' || (view === 'PROCTOR_DASHBOARD' && !activeRoom) || (view === 'EXAM_ROOM' && (!currentUser || !currentSession))) && (
          <StudentLogin 
            sessions={sessions} 
            students={students} 
            onLogin={handleStudentLogin} 
            onAdminClick={() => setView('ADMIN_LOGIN')} 
            isProcessing={isProcessing} 
          />
        )}
        
        {view === 'ADMIN_LOGIN' && (
          <AdminLogin 
            rooms={rooms} 
            onLogin={(role, r) => { 
              setShowIdleLogoutNotice(false);
              if(role === 'ADMIN') {
                localStorage.setItem('examsy_auth', JSON.stringify({ role: 'ADMIN' }));
                setView('ADMIN_DASHBOARD'); 
              } else if (r) { 
                localStorage.setItem('examsy_auth', JSON.stringify({ role: 'PROCTOR', roomId: r.id }));
                setActiveRoom(r); 
                setView('PROCTOR_DASHBOARD'); 
              } 
            }} 
            onBack={() => setView('STUDENT_LOGIN')} 
          />
        )}
        
        {view === 'ADMIN_DASHBOARD' && (
          <AdminDashboard 
            sessions={sessions} 
            students={students} 
            rooms={rooms} 
            isSyncing={isSyncing} 
            isProcessing={isProcessing} 
            onLogout={handleLogout} 
            onAction={handleAction} 
            onRefresh={refreshData}
          />
        )}
        
        {view === 'PROCTOR_DASHBOARD' && activeRoom && (
          <ProctorDashboard 
            room={activeRoom} 
            students={students} 
            isSyncing={isSyncing} 
            isProcessing={isProcessing} 
            onLogout={handleLogout} 
            onAction={handleAction} 
            onRefresh={refreshData}
            gasUrl="" 
          />
        )}
        
        {view === 'EXAM_ROOM' && currentUser && currentSession && (
          <ExamRoom 
            student={currentUser} 
            students={students} 
            session={currentSession} 
            onAction={handleAction}
            onFinish={async () => { 
              if (currentUser) {
                const isCurrentlyBlocked = currentUser.status === StudentStatus.BLOKIR;
                await handleAction('UPDATE_STUDENT', {
                  ...currentUser,
                  status: isCurrentlyBlocked ? StudentStatus.BLOKIR : StudentStatus.SELESAI,
                  violations: isCurrentlyBlocked ? (currentUser.violations || 0) : 0
                });
              }
              setCurrentUser(null); 
              setCurrentSession(null); 
              setView('STUDENT_LOGIN'); 
            }} 
          />
        )}

        {/* Auto-logout Toast Notification for Admin / Proctor */}
        {showIdleLogoutNotice && (
          <div 
            id="idle-logout-toast"
            className="fixed bottom-5 right-5 z-50 max-w-sm bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800 p-4 shrink-0 transition-all duration-300 md:bottom-8 md:right-8 flex items-start gap-3.5 backdrop-blur-sm bg-opacity-95 animate-in fade-in slide-in-from-bottom-5"
          >
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 id="idle-logout-toast-title" className="text-sm font-black text-slate-100 uppercase tracking-wider">Sesi Berakhir</h4>
              <p id="idle-logout-toast-desc" className="text-xs text-slate-400 mt-1 leading-relaxed">Sesi Admin/Proktor ditutup otomatis demi keamanan karena tidak ada aktivitas selama 15 menit.</p>
              <button 
                id="idle-logout-toast-close"
                onClick={() => setShowIdleLogoutNotice(false)} 
                className="mt-3 text-[10px] text-slate-200 hover:text-white font-black uppercase tracking-widest bg-slate-850 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-850 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </div>
    </AppErrorBoundary>
  );
};

export default App;
