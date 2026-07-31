/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Student, ExamSession, Room, StudentStatus } from '../types';
import supabaseConfig from '../supabase-config.json';

// Initialize Supabase Client
const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || supabaseConfig.supabaseUrl || "https://example.supabase.co";
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || supabaseConfig.supabaseAnonKey || "dummy-anon-key";

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface SupabaseErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
}

// Global active offline fallback status flag
let isOfflineFallbackActive = false;

export const checkIsOfflineFallbackActive = (): boolean => {
  return isOfflineFallbackActive;
};

export const setOfflineFallbackActive = (active: boolean) => {
  isOfflineFallbackActive = active;
  if (typeof window !== 'undefined') {
    if (active) {
      localStorage.setItem("examsy_quota_exceeded", "true");
    } else {
      localStorage.removeItem("examsy_quota_exceeded");
    }
  }
};

export function handleSupabaseError(error: unknown, operationType: OperationType, path: string | null) {
  const errMsg = error instanceof Error ? error.message : String(error);
  if (errMsg.includes("FetchError") || errMsg.includes("Failed to fetch") || errMsg.includes("invalid key")) {
    setOfflineFallbackActive(true);
  }
  
  const errInfo: SupabaseErrorInfo = {
    error: errMsg,
    operationType,
    path
  };
  console.warn('Supabase Handled Error: ', JSON.stringify(errInfo));
}

// PREMIUM DEMO FALLBACK DATA
export const DEFAULT_FALLBACK_ROOMS: Room[] = [
  { id: "ruang_01", name: "Laboratorium Komputer 1", capacity: 36, username: "proktor01", password: "password01" },
  { id: "ruang_02", name: "Laboratorium Komputer 2", capacity: 36, username: "proktor02", password: "password02" },
  { id: "ruang_03", name: "Laboratorium Bahasa", capacity: 30, username: "proktor03", password: "password03" }
];

export const DEFAULT_FALLBACK_SESSIONS: ExamSession[] = [
  {
    id: "session_01",
    name: "Penilaian Akhir Semester - Matematika",
    class: "XII-IPA-1",
    pin: "MATE12",
    durationMinutes: 90,
    isActive: true,
    date: "2026-06-15",
    questions: [
      {
        id: "q1",
        text: "Jika f(x) = 2x + 3 dan g(x) = x^2 - 1, tentukan nilai dari (f o g)(2)!",
        options: ["11", "9", "15", "7", "13"],
        correctAnswer: 1
      },
      {
        id: "q2",
        text: "Hitunglah nilai limit x mendekati 3 dari (x^2 - 9)/(x - 3)!",
        options: ["3", "6", "9", "12", "0"],
        correctAnswer: 1
      },
      {
        id: "q3",
        text: "Tentukan turunan pertama dari y = sin(2x)!",
        options: ["cos(2x)", "2 cos(2x)", "-2 cos(2x)", "-cos(2x)", "2 sin(2x)"],
        correctAnswer: 1
      },
      {
        id: "q4",
        text: "Sebuah dadu dilempar sekali. Peluang munculnya mata dadu prima ganjil adalah...",
        options: ["1/6", "1/3", "1/2", "2/3", "5/6"],
        correctAnswer: 1
      },
      {
        id: "q5",
        text: "Berapa banyak susunan kata berbeda yang dapat dibentuk dari kata 'BATU'?",
        options: ["12", "24", "48", "6", "18"],
        correctAnswer: 1
      }
    ]
  },
  {
    id: "session_02",
    name: "Penilaian Akhir Semester - Bahasa Inggris",
    class: "XII-IPS-2",
    pin: "ENGL12",
    durationMinutes: 120,
    isActive: true,
    date: "2026-06-16",
    questions: [
      {
        id: "eq1",
        text: "What is the synonym of the word 'BENEFICIAL'?",
        options: ["Harmful", "Useless", "Helpful", "Damaging", "Costly"],
        correctAnswer: 2
      },
      {
        id: "eq2",
        text: "Complete the sentence: 'If I ___ you, I would take the offer.'",
        options: ["am", "was", "were", "been", "would be"],
        correctAnswer: 2
      }
    ]
  }
];

export const DEFAULT_FALLBACK_STUDENTS: Student[] = [
  { nis: "12345", name: "Ahmad Fauzi", class: "XII-IPA-1", password: "password123", status: StudentStatus.BELUM_MASUK, roomId: "ruang_01", violations: 0 },
  { nis: "54215", name: "Budi Santoso", class: "XII-IPA-1", password: "password123", status: StudentStatus.BELUM_MASUK, roomId: "ruang_01", violations: 0 },
  { nis: "11223", name: "Citra Lestari", class: "XII-IPA-1", password: "password123", status: StudentStatus.BELUM_MASUK, roomId: "ruang_01", violations: 0 },
  { nis: "67890", name: "Dewi Anggraini", class: "XII-IPS-2", password: "password123", status: StudentStatus.BELUM_MASUK, roomId: "ruang_02", violations: 0 },
  { nis: "98765", name: "Eko Prasetyo", class: "XII-IPS-2", password: "password123", status: StudentStatus.BELUM_MASUK, roomId: "ruang_02", violations: 0 }
];

// Helper to pre-populate cache empty state
const initCacheIfEmpty = () => {
  if (typeof window !== 'undefined') {
    if (!localStorage.getItem("examsy_cache_students")) {
      localStorage.setItem("examsy_cache_students", JSON.stringify(DEFAULT_FALLBACK_STUDENTS));
    }
    if (!localStorage.getItem("examsy_cache_sessions")) {
      localStorage.setItem("examsy_cache_sessions", JSON.stringify(DEFAULT_FALLBACK_SESSIONS));
    }
    if (!localStorage.getItem("examsy_cache_rooms")) {
      localStorage.setItem("examsy_cache_rooms", JSON.stringify(DEFAULT_FALLBACK_ROOMS));
    }
  }
};
initCacheIfEmpty();

const getDeletedIds = (key: string): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
};

const addDeletedId = (key: string, id: string | string[]) => {
  if (typeof window === 'undefined') return;
  const current = getDeletedIds(key);
  const toAdd = Array.isArray(id) ? id.map(String) : [String(id)];
  const updated = Array.from(new Set([...current, ...toAdd]));
  localStorage.setItem(key, JSON.stringify(updated));
};

const removeDeletedId = (key: string, id: string | string[]) => {
  if (typeof window === 'undefined') return;
  const current = getDeletedIds(key);
  const toRemove = Array.isArray(id) ? id.map(String) : [String(id)];
  const updated = current.filter(d => !toRemove.includes(String(d)));
  localStorage.setItem(key, JSON.stringify(updated));
};

export const updateLocalCacheList = (action: string, payload: any) => {
  if (typeof window === 'undefined') return;
  
  const getHelper = (key: string): any[] => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  };

  const cachedStudents = getHelper("examsy_cache_students");
  const cachedSessions = getHelper("examsy_cache_sessions");
  const cachedRooms = getHelper("examsy_cache_rooms");

  if (action === 'ADD_STUDENT' || action === 'UPDATE_STUDENT') {
    removeDeletedId("examsy_deleted_students", payload.nis);
    const list = [...cachedStudents];
    const idx = list.findIndex(s => String(s.nis) === String(payload.nis));
    if (idx > -1) {
      list[idx] = { ...list[idx], ...payload };
    } else {
      list.push(payload);
    }
    localStorage.setItem("examsy_cache_students", JSON.stringify(list));
  } else if (action === 'DELETE_STUDENT') {
    addDeletedId("examsy_deleted_students", payload.nis);
    const list = cachedStudents.filter(s => String(s.nis) !== String(payload.nis));
    localStorage.setItem("examsy_cache_students", JSON.stringify(list));
  } else if (action === 'BULK_DELETE_STUDENTS') {
    addDeletedId("examsy_deleted_students", payload);
    const list = cachedStudents.filter(s => !payload.includes(String(s.nis)));
    localStorage.setItem("examsy_cache_students", JSON.stringify(list));
  } else if (action === 'BULK_UPDATE_STUDENTS') {
    const list = cachedStudents.map(s => {
      if (payload.selectedNis.includes(String(s.nis))) {
        return { ...s, ...payload.updates };
      }
      return s;
    });
    localStorage.setItem("examsy_cache_students", JSON.stringify(list));
  } else if (action === 'ADD_SESSION' || action === 'UPDATE_SESSION') {
    removeDeletedId("examsy_deleted_sessions", payload.id);
    const list = [...cachedSessions];
    const idx = list.findIndex(s => String(s.id) === String(payload.id));
    if (idx > -1) {
      list[idx] = { ...list[idx], ...payload };
    } else {
      list.push(payload);
    }
    localStorage.setItem("examsy_cache_sessions", JSON.stringify(list));
  } else if (action === 'DELETE_SESSION') {
    addDeletedId("examsy_deleted_sessions", payload.id);
    const list = cachedSessions.filter(s => String(s.id) !== String(payload.id));
    localStorage.setItem("examsy_cache_sessions", JSON.stringify(list));
  } else if (action === 'BULK_DELETE_SESSIONS') {
    addDeletedId("examsy_deleted_sessions", payload);
    const list = cachedSessions.filter(s => !payload.includes(String(s.id)));
    localStorage.setItem("examsy_cache_sessions", JSON.stringify(list));
  } else if (action === 'ADD_ROOM' || action === 'UPDATE_ROOM') {
    removeDeletedId("examsy_deleted_rooms", payload.id);
    const list = [...cachedRooms];
    const idx = list.findIndex(r => String(r.id) === String(payload.id));
    if (idx > -1) {
      list[idx] = { ...list[idx], ...payload };
    } else {
      list.push(payload);
    }
    localStorage.setItem("examsy_cache_rooms", JSON.stringify(list));
  } else if (action === 'DELETE_ROOM') {
    addDeletedId("examsy_deleted_rooms", payload.id);
    const list = cachedRooms.filter(r => String(r.id) !== String(payload.id));
    localStorage.setItem("examsy_cache_rooms", JSON.stringify(list));
  }
};

export const normalizeSession = (s: any): ExamSession => ({
  id: String(s.id),
  name: String(s.name || ''),
  class: String(s.class || ''),
  pin: String(s.pin || ''),
  durationMinutes: Number(s.durationMinutes ?? s.duration_minutes ?? s.durationminutes ?? 90),
  pdfUrl: String(s.pdfUrl || s.pdf_url || s.pdfurl || ''),
  date: String(s.date || new Date().toISOString().split('T')[0]),
  isActive: s.isActive !== undefined ? Boolean(s.isActive) : (s.is_active !== undefined ? Boolean(s.is_active) : true),
  questions: Array.isArray(s.questions) ? s.questions : (typeof s.questions === 'string' ? (s.questions ? JSON.parse(s.questions) : []) : [])
});

export const normalizeStudent = (s: any): Student => ({
  nis: String(s.nis),
  name: String(s.name || ''),
  class: String(s.class || ''),
  password: String(s.password || ''),
  status: s.status || StudentStatus.BELUM_MASUK,
  roomId: String(s.roomId || s.room_id || s.roomid || ''),
  violations: Number(s.violations || 0)
});

export const normalizeRoom = (r: any): Room => ({
  id: String(r.id),
  name: String(r.name || ''),
  capacity: Number(r.capacity || 0),
  username: String(r.username || ''),
  password: String(r.password || '')
});

export const fetchStudents = async (): Promise<Student[]> => {
  const getCached = (): Student[] => {
    const raw = localStorage.getItem("examsy_cache_students");
    return raw ? JSON.parse(raw) : DEFAULT_FALLBACK_STUDENTS;
  };

  const cachedStudents = getCached();
  const deletedNis = getDeletedIds("examsy_deleted_students");

  try {
    if (checkIsOfflineFallbackActive()) {
      return cachedStudents.filter(s => !deletedNis.includes(String(s.nis)));
    }
    const { data, error } = await supabase.from('students').select('*');
    if (error) {
      console.warn("Fetch students error from Supabase:", error.message);
      return cachedStudents.filter(s => !deletedNis.includes(String(s.nis)));
    }
    if (data) {
      const normalizedList = data.map(normalizeStudent).filter(s => !deletedNis.includes(String(s.nis)));
      localStorage.setItem("examsy_cache_students", JSON.stringify(normalizedList));
      return normalizedList;
    }
    return cachedStudents.filter(s => !deletedNis.includes(String(s.nis)));
  } catch (error) {
    handleSupabaseError(error, OperationType.LIST, "students");
    return cachedStudents.filter(s => !deletedNis.includes(String(s.nis)));
  }
};

export const fetchSessions = async (): Promise<ExamSession[]> => {
  const getCached = (): ExamSession[] => {
    const raw = localStorage.getItem("examsy_cache_sessions");
    return raw ? JSON.parse(raw) : DEFAULT_FALLBACK_SESSIONS;
  };

  const cachedSessions = getCached();
  const deletedIds = getDeletedIds("examsy_deleted_sessions");

  try {
    if (checkIsOfflineFallbackActive()) {
      return cachedSessions.filter(s => !deletedIds.includes(String(s.id)));
    }
    const { data, error } = await supabase.from('sessions').select('*');
    if (error) {
      console.warn("Fetch sessions error from Supabase:", error.message);
      return cachedSessions.filter(s => !deletedIds.includes(String(s.id)));
    }
    if (data) {
      const normalizedList = data.map(normalizeSession).filter(s => !deletedIds.includes(String(s.id)));
      localStorage.setItem("examsy_cache_sessions", JSON.stringify(normalizedList));
      return normalizedList;
    }
    return cachedSessions.filter(s => !deletedIds.includes(String(s.id)));
  } catch (error) {
    handleSupabaseError(error, OperationType.LIST, "sessions");
    return cachedSessions.filter(s => !deletedIds.includes(String(s.id)));
  }
};

export const fetchRooms = async (): Promise<Room[]> => {
  const getCached = (): Room[] => {
    const raw = localStorage.getItem("examsy_cache_rooms");
    return raw ? JSON.parse(raw) : DEFAULT_FALLBACK_ROOMS;
  };

  const cachedRooms = getCached();
  const deletedIds = getDeletedIds("examsy_deleted_rooms");

  try {
    if (checkIsOfflineFallbackActive()) {
      return cachedRooms.filter(r => !deletedIds.includes(String(r.id)));
    }
    const { data, error } = await supabase.from('rooms').select('*');
    if (error) {
      console.warn("Fetch rooms error from Supabase:", error.message);
      return cachedRooms.filter(r => !deletedIds.includes(String(r.id)));
    }
    if (data) {
      const normalizedList = data.map(normalizeRoom).filter(r => !deletedIds.includes(String(r.id)));
      localStorage.setItem("examsy_cache_rooms", JSON.stringify(normalizedList));
      return normalizedList;
    }
    return cachedRooms.filter(r => !deletedIds.includes(String(r.id)));
  } catch (error) {
    handleSupabaseError(error, OperationType.LIST, "rooms");
    return cachedRooms.filter(r => !deletedIds.includes(String(r.id)));
  }
};

export const fetchStaticData = async (): Promise<{ students: Student[]; sessions: ExamSession[]; rooms: Room[] }> => {
  try {
    const [students, sessions, rooms] = await Promise.all([
      fetchStudents(),
      fetchSessions(),
      fetchRooms()
    ]);
    return { students, sessions, rooms };
  } catch (error) {
    console.error("Combined static data fetch failed:", error);
    const cachedStudents = localStorage.getItem("examsy_cache_students");
    const cachedSessions = localStorage.getItem("examsy_cache_sessions");
    const cachedRooms = localStorage.getItem("examsy_cache_rooms");
    return {
      students: cachedStudents ? JSON.parse(cachedStudents) : DEFAULT_FALLBACK_STUDENTS,
      sessions: cachedSessions ? JSON.parse(cachedSessions) : DEFAULT_FALLBACK_SESSIONS,
      rooms: cachedRooms ? JSON.parse(cachedRooms) : DEFAULT_FALLBACK_ROOMS
    };
  }
};

export const syncData = (
  onStudentsUpdate: (data: Student[]) => void,
  onSessionsUpdate: (data: ExamSession[]) => void,
  onRoomsUpdate: (data: Room[]) => void
) => {
  fetchStaticData().then(data => {
    onStudentsUpdate(data.students);
    onSessionsUpdate(data.sessions);
    onRoomsUpdate(data.rooms);
  });

  return () => {};
};

export const getDirectStudentAndSession = async (nis: string, sessionId: string): Promise<{ student: Student | null; session: ExamSession | null }> => {
  try {
    if (checkIsOfflineFallbackActive()) {
      throw new Error("Offline mode");
    }
    const [studentRes, sessionRes] = await Promise.all([
      supabase.from('students').select('*').eq('nis', nis).single(),
      supabase.from('sessions').select('*').eq('id', sessionId).single()
    ]);

    return {
      student: studentRes.data ? (studentRes.data as Student) : null,
      session: sessionRes.data ? (sessionRes.data as ExamSession) : null
    };
  } catch (err) {
    console.warn("Direct Supabase fetch failed:", err);
    return { student: null, session: null };
  }
};

export const subscribeStudent = (nis: string, callback: (student: Student | null) => void) => {
  try {
    const channel = supabase
      .channel(`student-${nis}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'students', filter: `nis=eq.${nis}` },
        (payload) => {
          if (payload.new) {
            callback(payload.new as Student);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (e) {
    console.warn("Realtime subscription failed:", e);
    return () => {};
  }
};

export const validateStudentLogin = async (
  nis: string,
  pass: string,
  studentClass: string,
  pin: string
): Promise<{ success: boolean; student?: Student; session?: ExamSession; error?: string }> => {
  const trimmedNis = String(nis).trim();
  const trimmedPass = String(pass).trim();
  const trimmedClass = String(studentClass).trim();
  const trimmedPin = String(pin).trim().toUpperCase();

  try {
    if (checkIsOfflineFallbackActive()) {
      throw new Error("Quota simulation active");
    }

    const { data: student, error: studentErr } = await supabase
      .from('students')
      .select('*')
      .eq('nis', trimmedNis)
      .single();

    if (studentErr || !student) {
      return { success: false, error: 'NIS atau Password Anda tidak terdaftar.' };
    }

    if (String(student.password || '').trim() !== trimmedPass) {
      return { success: false, error: 'NIS atau Password Anda tidak terdaftar.' };
    }

    if (student.status === StudentStatus.BLOKIR) {
      return { success: false, error: 'Akses ditolak. Akun Anda dalam status BLOKIR.' };
    }

    if (student.status === StudentStatus.SELESAI) {
      return { success: false, error: 'Anda telah menyelesaikan sesi ujian ini.' };
    }

    if (String(student.class).trim() !== trimmedClass) {
      return { success: false, error: `Sinkronisasi Gagal: Anda terdaftar di Kelas ${student.class}, bukan Kelas ${trimmedClass}.` };
    }

    const { data: rawSessions, error: sessionErr } = await supabase
      .from('sessions')
      .select('*')
      .eq('class', trimmedClass);

    if (sessionErr || !rawSessions) {
      return { success: false, error: 'PIN Sesi tidak aktif atau tidak ditemukan.' };
    }

    const sessions = rawSessions.map(normalizeSession);
    const matchedSession = sessions.find(
      sess => sess.isActive && String(sess.pin || '').trim().toUpperCase() === trimmedPin
    );

    if (!matchedSession) {
      return { success: false, error: 'PIN Sesi tidak aktif atau tidak ditemukan.' };
    }

    const normStudent = normalizeStudent(student);
    updateLocalCacheList('UPDATE_STUDENT', normStudent);
    updateLocalCacheList('UPDATE_SESSION', matchedSession);

    return { success: true, student: normStudent, session: matchedSession };
  } catch (err) {
    console.warn("Optimized DB Login failed, attempting cache verification as safe fallback:", err);
    setOfflineFallbackActive(true);

    const cachedStudentsRaw = localStorage.getItem("examsy_cache_students");
    const cachedStudents: Student[] = cachedStudentsRaw ? JSON.parse(cachedStudentsRaw) : DEFAULT_FALLBACK_STUDENTS;
    const student = cachedStudents.find(s => String(s.nis).trim() === trimmedNis);

    if (!student) {
      return { success: false, error: 'NIS atau Password tidak ditemukan dalam sistem lokal.' };
    }

    if (String(student.password || '').trim() !== trimmedPass) {
      return { success: false, error: 'NIS atau Password Anda salah (Verifikasi Offline).' };
    }

    if (student.status === StudentStatus.BLOKIR) {
      return { success: false, error: 'Akses ditolak. Akun Anda dalam status BLOKIR.' };
    }

    if (student.status === StudentStatus.SELESAI) {
      return { success: false, error: 'Anda telah menyelesaikan sesi ujian ini.' };
    }

    if (String(student.class).trim() !== trimmedClass) {
      return { success: false, error: `Sinkronisasi Gagal: Anda terdaftar di Kelas ${student.class}, bukan Kelas ${trimmedClass}.` };
    }

    const cachedSessionsRaw = localStorage.getItem("examsy_cache_sessions");
    const cachedSessions: ExamSession[] = cachedSessionsRaw ? JSON.parse(cachedSessionsRaw) : DEFAULT_FALLBACK_SESSIONS;
    const matchedSession = cachedSessions.find(sess => 
      sess.isActive && 
      String(sess.class).trim() === trimmedClass && 
      String(sess.pin || '').trim().toUpperCase() === trimmedPin
    );

    if (!matchedSession) {
      return { success: false, error: 'PIN Sesi tidak aktif atau tidak ditemukan.' };
    }

    return { success: true, student, session: matchedSession };
  }
};

export const dbAction = async (action: string, payload: any): Promise<boolean> => {
  updateLocalCacheList(action, payload);

  try {
    let result: { error: any } | null = null;
    switch (action) {
      case 'ADD_STUDENT':
      case 'UPDATE_STUDENT': {
        const snakePayload = {
          nis: String(payload.nis),
          name: payload.name,
          class: payload.class,
          password: payload.password || '',
          status: payload.status || StudentStatus.BELUM_MASUK,
          room_id: payload.roomId || payload.room_id || null,
          violations: Number(payload.violations || 0)
        };

        let res = await supabase.from('students').upsert(snakePayload);
        if (res.error) {
          console.warn("Supabase student snake_case upsert failed, trying camelCase:", res.error.message);
          const camelPayload = {
            nis: String(payload.nis),
            name: payload.name,
            class: payload.class,
            password: payload.password || '',
            status: payload.status || StudentStatus.BELUM_MASUK,
            roomId: payload.roomId || payload.room_id || null,
            violations: Number(payload.violations || 0)
          };
          res = await supabase.from('students').upsert(camelPayload);
          if (res.error) {
            console.warn("Supabase student camelCase upsert failed, trying raw:", res.error.message);
            res = await supabase.from('students').upsert(payload);
          }
        }
        result = res;
        break;
      }
      
      case 'DELETE_STUDENT':
        result = await supabase.from('students').delete().eq('nis', String(payload.nis));
        break;

      case 'BULK_DELETE_STUDENTS':
        result = await supabase.from('students').delete().in('nis', payload);
        break;

      case 'BULK_UPDATE_STUDENTS':
        result = await supabase.from('students').update(payload.updates).in('nis', payload.selectedNis);
        break;

      case 'ADD_SESSION':
      case 'UPDATE_SESSION': {
        const snakePayload = {
          id: String(payload.id),
          name: payload.name,
          class: payload.class,
          pin: payload.pin,
          duration_minutes: Number(payload.durationMinutes ?? payload.duration_minutes ?? 90),
          pdf_url: payload.pdfUrl || payload.pdf_url || '',
          date: payload.date || new Date().toISOString().split('T')[0],
          is_active: payload.isActive !== undefined ? payload.isActive : (payload.is_active !== undefined ? payload.is_active : true),
          questions: payload.questions || []
        };

        let res = await supabase.from('sessions').upsert(snakePayload);
        if (res.error) {
          console.warn("Supabase session snake_case upsert failed, trying camelCase:", res.error.message);
          const camelPayload = {
            id: String(payload.id),
            name: payload.name,
            class: payload.class,
            pin: payload.pin,
            durationMinutes: Number(payload.durationMinutes ?? payload.duration_minutes ?? 90),
            pdfUrl: payload.pdfUrl || payload.pdf_url || '',
            date: payload.date || new Date().toISOString().split('T')[0],
            isActive: payload.isActive !== undefined ? payload.isActive : (payload.is_active !== undefined ? payload.is_active : true),
            questions: payload.questions || []
          };
          res = await supabase.from('sessions').upsert(camelPayload);
          if (res.error) {
            console.warn("Supabase session camelCase upsert failed, trying raw:", res.error.message);
            res = await supabase.from('sessions').upsert(payload);
          }
        }
        result = res;
        break;
      }

      case 'DELETE_SESSION':
        result = await supabase.from('sessions').delete().eq('id', String(payload.id));
        break;

      case 'BULK_DELETE_SESSIONS':
        result = await supabase.from('sessions').delete().in('id', payload);
        break;

      case 'ADD_ROOM':
      case 'UPDATE_ROOM': {
        const roomPayload = {
          id: String(payload.id),
          name: payload.name,
          capacity: Number(payload.capacity || 0),
          username: payload.username || '',
          password: payload.password || ''
        };
        result = await supabase.from('rooms').upsert(roomPayload);
        break;
      }

      case 'DELETE_ROOM':
        result = await supabase.from('rooms').delete().eq('id', String(payload.id));
        break;

      default:
        return false;
    }

    if (result && result.error) {
      console.warn(`Supabase ${action} response error:`, result.error.message || result.error);
    }
    return true;
  } catch (err: any) {
    console.warn("Supabase action write error, seamlessly backed up locally: " + (err?.message || err));
    return true;
  }
};
