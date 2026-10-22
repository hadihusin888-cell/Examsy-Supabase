import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Student, ExamSession, StudentStatus, DevicePlatform, ViolationReason } from '../types';
import { logViolationServer, checkShouldBlockStudent } from '../services/supabaseService';

interface ExamRoomProps {
  student: Student;
  students: Student[]; 
  session: ExamSession;
  onAction: (action: string, payload: any) => Promise<boolean>;
  onFinish: () => void;
}

export interface DetailedDeviceInfo {
  platform: DevicePlatform;
  osName: string;
  isWindows: boolean;
  isMac: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isLinux: boolean;
  isChromeOS: boolean;
  isMobileOrTablet: boolean;
  hasTouch: boolean;
}

/**
 * Deteksi Platform Akurat (Windows, macOS, Android, iOS / iPadOS, Linux, ChromeOS)
 * Menggunakan kombinasi userAgent, userAgentData, platform, dan touch points.
 */
export const getDetailedDeviceInfo = (): DetailedDeviceInfo => {
  if (typeof navigator === 'undefined') {
    return {
      platform: 'UNKNOWN',
      osName: 'Unknown',
      isWindows: false,
      isMac: false,
      isIOS: false,
      isAndroid: false,
      isLinux: false,
      isChromeOS: false,
      isMobileOrTablet: false,
      hasTouch: false
    };
  }

  const ua = navigator.userAgent || '';
  const navPlatform = (navigator as any).userAgentData?.platform || navigator.platform || '';
  const maxTouch = navigator.maxTouchPoints || 0;
  const hasTouch = maxTouch > 0;

  // 1. Deteksi iOS & iPadOS (iPadOS 13+ melaporkan diri sebagai MacIntel dengan touch points > 1)
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navPlatform === 'MacIntel' && maxTouch > 1);

  // 2. Deteksi macOS Desktop (hanya jika bukan iPadOS)
  const isMac = !isIOS && (/Macintosh|MacIntel|MacPPC|Mac68K/i.test(ua) || /Mac/i.test(navPlatform));

  // 3. Deteksi Android
  const isAndroid = /Android/i.test(ua);

  // 4. Deteksi ChromeOS
  const isChromeOS = /CrOS/i.test(ua);

  // 5. Deteksi Windows
  const isWindows = /Windows|Win32|Win64|WOW64/i.test(ua) || /Win/i.test(navPlatform);

  // 6. Deteksi Linux Desktop (bukan Android, bukan ChromeOS)
  const isLinux = !isAndroid && !isChromeOS && (/Linux/i.test(ua) || /Linux/i.test(navPlatform));

  let platform: DevicePlatform = 'UNKNOWN';
  let osName = 'Desktop';

  if (isIOS) {
    platform = 'IOS';
    osName = /iPhone/i.test(ua) ? 'Apple iPhone (iOS)' : 'Apple iPad (iPadOS)';
  } else if (isMac) {
    platform = 'MACOS';
    osName = 'macOS';
  } else if (isAndroid) {
    platform = 'ANDROID';
    osName = 'Android';
  } else if (isWindows) {
    platform = 'WINDOWS';
    osName = 'Windows';
  } else if (isChromeOS) {
    platform = 'CHROMEOS';
    osName = 'ChromeOS';
  } else if (isLinux) {
    platform = 'LINUX';
    osName = 'Linux Desktop';
  }

  const isMobileOrTablet = isIOS || isAndroid || (hasTouch && window.innerWidth <= 1024);

  return {
    platform,
    osName,
    isWindows,
    isMac,
    isIOS,
    isAndroid,
    isLinux,
    isChromeOS,
    isMobileOrTablet,
    hasTouch
  };
};

const ExamRoom: React.FC<ExamRoomProps> = ({ student, students, session, onAction, onFinish }) => {
  const [timeLeft, setTimeLeft] = useState(session.durationMinutes * 60);
  const [hasConsented, setHasConsented] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  // Status Pelanggaran & Batas Dinamis Server (bukan hardcoded 3)
  const [violations, setViolations] = useState(Number(student.violations || 0));
  const [maxViolationsAllowed, setMaxViolationsAllowed] = useState(3);
  
  const [isFocusLost, setIsFocusLost] = useState(false);
  const [isKioskLocked, setIsKioskLocked] = useState(false);
  const [lockReason, setLockReason] = useState<string>('Pelanggaran Keamanan Kiosk');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [iframeKey, setIframeKey] = useState(0); 
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isZoomVisible, setIsZoomVisible] = useState(true);
  const zoomTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Konfirmasi wajib Guided Access untuk iOS/iPadOS
  const [guidedAccessAgreed, setGuidedAccessAgreed] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  
  const [isMobileLandscape, setIsMobileLandscape] = useState(false);
  const [isWakeLockActive, setIsWakeLockActive] = useState(false);
  const wakeLockRef = useRef<any>(null);
  const videoWakeLockRef = useRef<HTMLVideoElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastViolationTime = useRef(0);
  const alarmIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const CLIPPING_TOP = 120;      
  const CLIPPING_BOTTOM = 5000;   
  const CLIPPING_SIDE = 60;      

  // Deteksi Perangkat Lengkap
  const deviceInfo = React.useMemo(() => getDetailedDeviceInfo(), []);

  // iPad scroll hack otomatis
  const [isIpadScrollHackActive] = useState(() => deviceInfo.isIOS);

  // Status blokir dari prop / data lokal
  const currentStudentData = students.find(s => String(s.nis) === String(student.nis));
  const isBlocked = String(student?.status || '').toUpperCase() === 'BLOKIR' || String(currentStudentData?.status || '').toUpperCase() === 'BLOKIR';

  // Anti-Tamper: Bekukan snapshot status penting
  const frozenStateSnapshot = useRef<any>(null);
  useEffect(() => {
    frozenStateSnapshot.current = Object.freeze({
      nis: student.nis,
      sessionId: session.id,
      startedAt: Date.now()
    });
  }, [student.nis, session.id]);

  const resetZoomTimer = useCallback(() => {
    setIsZoomVisible(true);
    if (zoomTimerRef.current) clearTimeout(zoomTimerRef.current);
    zoomTimerRef.current = setTimeout(() => {
      setIsZoomVisible(false);
    }, 3000);
  }, []);

  useEffect(() => {
    if (hasConsented) resetZoomTimer();
    return () => { if (zoomTimerRef.current) clearTimeout(zoomTimerRef.current); };
  }, [hasConsented, resetZoomTimer]);

  const checkMobileLandscape = useCallback(() => {
    const isLandscape = window.innerWidth > window.innerHeight;
    const isMobileHeight = window.innerHeight <= 500;
    setIsMobileLandscape(isLandscape && isMobileHeight);
  }, []);

  useEffect(() => {
    checkMobileLandscape();
    window.addEventListener('resize', checkMobileLandscape);
    window.addEventListener('orientationchange', checkMobileLandscape);
    return () => {
      window.removeEventListener('resize', checkMobileLandscape);
      window.removeEventListener('orientationchange', checkMobileLandscape);
    };
  }, [checkMobileLandscape]);

  const sanitizePdfUrl = (url: string) => {
    if (!url) return '';
    let sanitized = url;
    if (url.includes('drive.google.com')) {
      sanitized = url.replace(/\/view(\?.*)?$/, '/preview');
      if (!sanitized.includes('/preview')) {
        sanitized = sanitized.replace(/\/edit(\?.*)?$/, '/preview');
      }
      const separator = sanitized.includes('?') ? '&' : '?';
      sanitized = `${sanitized}${separator}rm=minimal`;
    } else if (deviceInfo.isIOS) {
      sanitized = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;
    }
    return sanitized;
  };

  const handleZoom = (delta: number) => {
    setZoomLevel(prev => Math.min(Math.max(prev + delta, 0.5), 3.0));
    resetZoomTimer();
  };

  const handleAutoScroll = (direction: 'up' | 'down') => {
    if (scrollContainerRef.current) {
      const scrollAmount = Math.max(window.innerHeight * 0.45, 300);
      scrollContainerRef.current.scrollBy({
        top: direction === 'up' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
    resetZoomTimer();
  };

  // ----------------------------------------------------
  // SCREEN WAKE LOCK (SEMUA PLATFORM: Chrome, Safari 16.4+, Fallback Video Loop)
  // ----------------------------------------------------
  const requestWakeLock = useCallback(async () => {
    let success = false;
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator && (navigator as any).wakeLock) {
      try {
        if (!wakeLockRef.current || wakeLockRef.current.released) {
          const sentinel = await (navigator as any).wakeLock.request('screen');
          wakeLockRef.current = sentinel;
          setIsWakeLockActive(true);
          success = true;
          sentinel.addEventListener('release', () => {
            wakeLockRef.current = null;
            setIsWakeLockActive(false);
          });
        } else {
          setIsWakeLockActive(true);
          success = true;
        }
      } catch (err: any) {
        console.warn("Screen Wake Lock API error:", err);
      }
    }

    if (videoWakeLockRef.current) {
      try {
        if (videoWakeLockRef.current.paused) {
          const playPromise = videoWakeLockRef.current.play();
          if (playPromise !== undefined) {
            await playPromise;
          }
        }
        setIsWakeLockActive(true);
        success = true;
      } catch (err) {
        // Autoplay may need user gesture
      }
    }

    return success;
  }, []);

  const releaseWakeLock = useCallback(() => {
    try {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    } catch (_) {}
    try {
      if (videoWakeLockRef.current) {
        videoWakeLockRef.current.pause();
      }
    } catch (_) {}
    setIsWakeLockActive(false);
  }, []);

  useEffect(() => {
    requestWakeLock();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !isBlocked) {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const handleUserInteraction = () => {
      if (!wakeLockRef.current) {
        requestWakeLock();
      }
    };
    window.addEventListener('click', handleUserInteraction, { passive: true });
    window.addEventListener('touchstart', handleUserInteraction, { passive: true });
    window.addEventListener('pointerdown', handleUserInteraction, { passive: true });

    const heartbeatTimer = setInterval(() => {
      if (document.visibilityState === 'visible' && !isBlocked && !wakeLockRef.current) {
        requestWakeLock();
      }
    }, 10000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
      window.removeEventListener('pointerdown', handleUserInteraction);
      clearInterval(heartbeatTimer);
      releaseWakeLock();
    };
  }, [requestWakeLock, releaseWakeLock, isBlocked]);

  // ----------------------------------------------------
  // SPEAKER & VIBRATION (BEEP BERULANG TIAP 1 DETIK SELAMA OVERLAY AKTIF)
  // ----------------------------------------------------
  const playSingleChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (_) {}
  }, []);

  const startContinuousKioskAlarm = useCallback(() => {
    if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
    playSingleChime();
    alarmIntervalRef.current = setInterval(() => {
      playSingleChime();
    }, 1000);
  }, [playSingleChime]);

  const stopContinuousKioskAlarm = useCallback(() => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
  }, []);

  const triggerKioskVibration = useCallback(() => {
    try {
      // Pola getar berulang untuk Android [400, 200, 400, 200, 400]
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([400, 200, 400, 200, 400]);
      }
    } catch (_) {}
  }, []);

  // Anti-Pencurian Soal: Kosongkan clipboard secara paksa (Windows, macOS, Android, iOS)
  const wipeClipboard = useCallback(() => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText('').catch(() => {});
      }
    } catch (_) {}
  }, []);

  const handleFinalFinish = useCallback(() => {
    releaseWakeLock();
    stopContinuousKioskAlarm();
    if (zoomTimerRef.current) clearTimeout(zoomTimerRef.current);

    // Buka keyboard lock pada Windows / Chrome jika aktif
    if (deviceInfo.isWindows && (navigator as any).keyboard?.unlock) {
      try {
        (navigator as any).keyboard.unlock();
      } catch (_) {}
    }

    // Buka pointer lock pada desktop macOS jika aktif
    if (document.exitPointerLock) {
      try {
        document.exitPointerLock();
      } catch (_) {}
    }

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    onFinish();
  }, [releaseWakeLock, stopContinuousKioskAlarm, deviceInfo.isWindows, onFinish]);

  // ----------------------------------------------------
  // KRITIS: SERVER-SIDE VIOLATION SINKRON
  // Await response dari Supabase RPC log_violation()
  // ----------------------------------------------------
  const triggerViolation = useCallback(async (reason: string) => {
    if (isBlocked) return;
    const now = Date.now();
    // Debounce 1.5s untuk mencegah banjir request jika ada multi-event
    if (now - lastViolationTime.current < 1500) return; 
    lastViolationTime.current = now;

    setLockReason(reason);
    setIsFocusLost(true);
    setIsKioskLocked(true);

    // Nyalakan alarm berkala & getaran keras
    startContinuousKioskAlarm();
    triggerKioskVibration();

    try {
      // Panggil RPC Server-Side
      const res = await logViolationServer(
        student.nis,
        session.id,
        reason,
        deviceInfo.platform
      );

      if (res && res.success) {
        setViolations(res.violations);
        setMaxViolationsAllowed(res.maxViolations || 3);

        if (res.shouldBlock) {
          await onAction('UPDATE_STUDENT', {
            ...student,
            violations: res.violations,
            status: StudentStatus.BLOKIR
          });
          handleFinalFinish();
        }
      }
    } catch (err) {
      console.warn("Gagal sinkron pelanggaran ke server:", err);
    }
  }, [isBlocked, student, session.id, deviceInfo.platform, startContinuousKioskAlarm, triggerKioskVibration, onAction, handleFinalFinish]);

  // ----------------------------------------------------
  // FULLSCREEN RE-ENTRY LOOP (SEMUA PLATFORM)
  // Coba masuk kembali ke fullscreen setiap 2 detik jika terlepas
  // ----------------------------------------------------
  const reEnterKioskMode = useCallback(async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen({ navigationUI: 'hide' } as any);
      } else if ((elem as any).webkitRequestFullscreen) {
        await (elem as any).webkitRequestFullscreen();
      }

      // Kunci Pointer pada macOS desktop jika tersedia
      if (deviceInfo.isMac && document.documentElement.requestPointerLock) {
        document.documentElement.requestPointerLock();
      }

      // Kunci Keyboard pada Windows / ChromeOS
      if ((deviceInfo.isWindows || deviceInfo.isChromeOS) && (navigator as any).keyboard?.lock) {
        (navigator as any).keyboard.lock([
          'Escape', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
          'Tab', 'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight',
          'KeyW', 'KeyN', 'KeyT', 'KeyR', 'KeyP', 'KeyS', 'KeyU', 'KeyC', 'KeyV', 'KeyX', 'KeyJ', 'KeyK'
        ]).catch(() => {});
      }
    } catch (err) {
      console.warn("Fullscreen request error:", err);
    } finally {
      stopContinuousKioskAlarm();
      setIsFocusLost(false);
      setIsKioskLocked(false);
      resetZoomTimer();
    }
  }, [deviceInfo.isMac, deviceInfo.isWindows, deviceInfo.isChromeOS, stopContinuousKioskAlarm, resetZoomTimer]);

  // Interval otomatis mencoba masuk fullscreen setiap 2 detik saat overlay kunci aktif
  useEffect(() => {
    if (!hasConsented || isBlocked || !isKioskLocked) return;

    const retryFsTimer = setInterval(() => {
      if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
          elem.requestFullscreen({ navigationUI: 'hide' } as any).catch(() => {});
        } else if ((elem as any).webkitRequestFullscreen) {
          (elem as any).webkitRequestFullscreen().catch(() => {});
        }
      }
    }, 2000);

    return () => clearInterval(retryFsTimer);
  }, [hasConsented, isBlocked, isKioskLocked]);

  // ----------------------------------------------------
  // FULLSCREEN CHANGE DETECTOR
  // ----------------------------------------------------
  // ----------------------------------------------------
  // FULLSCREEN CHANGE DETECTOR
  // ----------------------------------------------------
  useEffect(() => {
    const handleFsChange = () => {
      const isFs = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
      setIsFullscreen(isFs);

      // Pada semua platform yang mendukung fullscreen (Windows, Mac, Android, Linux),
      // keluar dari fullscreen adalah pelanggaran.
      // (Pada iOS Safari yang tidak memiliki Fullscreen API elemen, deteksi dilakukan via visibility & pagehide).
      if (hasConsented && !isFs && !isBlocked && !deviceInfo.isIOS) {
        triggerViolation(ViolationReason.FULLSCREEN_EXIT);
      }
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, [hasConsented, isBlocked, deviceInfo.isIOS, triggerViolation]);

  // ----------------------------------------------------
  // KEYBOARD LOCKDOWN & SHORTCUT BLOCKER LENGKAP (WINDOWS, LINUX, MACOS, ANDROID, IOS)
  // ----------------------------------------------------
  useEffect(() => {
    if (!hasConsented || isBlocked) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      wipeClipboard();
      return false;
    };

    const handleSelectStart = (e: Event) => {
      e.preventDefault();
      return false;
    };

    const handleDragDrop = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    const handlePrint = (e: Event) => {
      e.preventDefault();
      wipeClipboard();
      triggerViolation(ViolationReason.UNAUTHORIZED_SHORTCUT + " (Print)");
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Tangkapan Layar Windows: Tombol PrintScreen
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen' || e.keyCode === 44) {
        e.preventDefault();
        e.stopPropagation();
        wipeClipboard();
        triggerViolation("Percobaan Cuplikan Layar (PrintScreen) Terdeteksi");
        return;
      }

      // 2. Tangkapan Layar macOS: Cmd + Shift + 3 / 4 / 5
      if (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        wipeClipboard();
        triggerViolation("Percobaan Cuplikan Layar macOS (Cmd+Shift) Terdeteksi");
        return;
      }

      // 3. Web Inspector & DevTools macOS: Cmd + Option + I / J / C / U
      if (e.metaKey && e.altKey && ['i', 'j', 'c', 'u'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        e.stopPropagation();
        triggerViolation("Web Inspector / DevTools macOS Terdeteksi");
        return;
      }

      // 4. Tombol Fungsi F1 - F12
      const isFKey = /^F[1-9]|F1[0-2]$/.test(e.key);

      // 5. Shortcut Ctrl / Meta (Windows logo key / Command Mac)
      const isModifier = e.ctrlKey || e.metaKey;
      const keyLower = e.key.toLowerCase();

      const isForbiddenAlpha = isModifier && [
        'r', 'u', 'p', 's', 'n', 't', 'w', 'h', 'j', 'k', 'c', 'v', 'x', 'a', 'd', 'l', 'm', 'q'
      ].includes(keyLower);

      // 6. DevTools Combinations (Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+Shift+K)
      const isDevToolsCombo = isModifier && e.shiftKey && ['i', 'j', 'c', 'k'].includes(keyLower);

      // 7. Alt Navigation (Alt+ArrowLeft, Alt+ArrowRight, Alt+Home, Alt+F4, Alt+Tab)
      const isAltNav = e.altKey && (
        e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Home' || e.key === 'F4' || e.key === 'Tab'
      );

      // 8. Meta Navigation (Meta+Tab, Meta+Space, Meta+D, Meta+L, Meta+H, Meta+M)
      const isMetaNav = e.metaKey && (
        e.key === 'Tab' || e.key === ' ' || keyLower === 'd' || keyLower === 'l' || keyLower === 'h' || keyLower === 'm'
      );

      // 9. Escape Key
      const isEscape = e.key === 'Escape';

      if (isFKey || isForbiddenAlpha || isDevToolsCombo || isAltNav || isMetaNav || isEscape) {
        e.preventDefault();
        e.stopPropagation();
        wipeClipboard();
        triggerViolation(`${ViolationReason.UNAUTHORIZED_SHORTCUT}: [${e.altKey ? 'Alt+' : ''}${isModifier ? 'Ctrl/Cmd+' : ''}${e.shiftKey ? 'Shift+' : ''}${e.key}]`);
      }
    };

    // Navigasi Back / Refresh guard
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasConsented && !isBlocked) {
        wipeClipboard();
        e.preventDefault();
        e.returnValue = 'Ujian sedang berlangsung! Keluar akan membatalkan sesi ujian Anda.';
        return e.returnValue;
      }
    };

    // Agresif Popstate guard
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
      triggerViolation(ViolationReason.UNAUTHORIZED_NAVIGATION);
    };

    // Reset history interval guard tiap 500ms
    const historyGuardTimer = setInterval(() => {
      window.history.pushState(null, '', window.location.href);
    }, 500);

    // Matikan window.open
    (window as any).open = () => null;

    window.addEventListener('contextmenu', handleContextMenu, true);
    window.addEventListener('copy', handleCopyPaste, true);
    window.addEventListener('cut', handleCopyPaste, true);
    window.addEventListener('paste', handleCopyPaste, true);
    window.addEventListener('dragstart', handleDragDrop, true);
    window.addEventListener('drop', handleDragDrop, true);
    window.addEventListener('beforeprint', handlePrint, true);
    window.addEventListener('afterprint', handlePrint, true);
    document.addEventListener('selectstart', handleSelectStart, true);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      clearInterval(historyGuardTimer);
      window.removeEventListener('contextmenu', handleContextMenu, true);
      window.removeEventListener('copy', handleCopyPaste, true);
      window.removeEventListener('cut', handleCopyPaste, true);
      window.removeEventListener('paste', handleCopyPaste, true);
      window.removeEventListener('dragstart', handleDragDrop, true);
      window.removeEventListener('drop', handleDragDrop, true);
      window.removeEventListener('beforeprint', handlePrint, true);
      window.removeEventListener('afterprint', handlePrint, true);
      document.removeEventListener('selectstart', handleSelectStart, true);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasConsented, isBlocked, triggerViolation, wipeClipboard]);

  // ----------------------------------------------------
  // HARDWARE-LEVEL & DEVTOOLS ANOMALY DETECTION (SEMUA PLATFORM)
  // ----------------------------------------------------
  useEffect(() => {
    if (!hasConsented || isBlocked) return;

    let blurTimer: ReturnType<typeof setTimeout> | null = null;

    // 1. Deteksi Visibility Change (iOS, Android, macOS, Windows)
    const handleVisibility = () => {
      const isHidden = document.hidden || (document as any).webkitHidden || (document as any).webkitVisibilityState === 'hidden';
      if (isHidden) {
        wipeClipboard();
        if (blurTimer) clearTimeout(blurTimer);
        blurTimer = setTimeout(() => {
          triggerViolation(ViolationReason.APP_SWITCHED);
        }, 800);
      }
    };

    // 2. Deteksi Window Blur (Pindah Aplikasi / Alt+Tab / Quick Settings)
    const handleBlur = () => {
      wipeClipboard();
      if (blurTimer) clearTimeout(blurTimer);
      blurTimer = setTimeout(() => {
        if (!document.hasFocus()) {
          triggerViolation(ViolationReason.WINDOW_BLUR);
        }
      }, 800);
    };

    const handleFocus = () => {
      if (blurTimer) {
        clearTimeout(blurTimer);
        blurTimer = null;
      }
    };

    // 3. Deteksi Ukuran Jendela Minimized & iPad Split-Screen
    const handleResize = () => {
      if (window.innerWidth < 200 || window.innerHeight < 200) {
        triggerViolation(ViolationReason.MINIMIZE_WINDOW);
      }

      // Deteksi iPad Split View / Slide Over (jika layar iPad dipisah menjadi 1/2 atau 1/3)
      if (deviceInfo.isIOS && window.screen.width >= 768 && window.innerWidth < 500) {
        triggerViolation("iPad Split View / Layar Belah Terdeteksi");
      }

      // Deteksi DevTools via delta ukuran viewport vs screen (Desktop Windows & Mac)
      if (!deviceInfo.isMobileOrTablet) {
        const widthDelta = window.outerWidth - window.innerWidth;
        const heightDelta = window.outerHeight - window.innerHeight;
        if (widthDelta > 160 || heightDelta > 160) {
          triggerViolation(ViolationReason.DEVTOOLS_OPEN + " (Size Delta)");
        }
      }
    };

    // 4. Deteksi PageHide khusus iOS Safari saat beralih aplikasi
    const handlePageHide = () => {
      wipeClipboard();
      triggerViolation("Aplikasi Ditinggalkan / Halaman Masuk Latar Belakang");
    };

    // 5. Cegah Multi-Touch Gesture / Pinch Zoom liar
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // 6. Deteksi DevTools Timing / Getter Trap (Desktop)
    const devToolsCheckTimer = setInterval(() => {
      if (!deviceInfo.isMobileOrTablet) {
        const widthDelta = window.outerWidth - window.innerWidth;
        const heightDelta = window.outerHeight - window.innerHeight;
        if (widthDelta > 160 || heightDelta > 160) {
          triggerViolation(ViolationReason.DEVTOOLS_OPEN);
        }
      }

      // Memory Heap Snapshot Jump (DevTools Performance Snapshot)
      if ((performance as any).memory && (performance as any).memory.usedJSHeapSize) {
        const heap = (performance as any).memory.usedJSHeapSize;
        if (heap > 500 * 1024 * 1024) {
          triggerViolation(ViolationReason.HARDWARE_ANOMALY + " (Memory Heap Jump)");
        }
      }
    }, 1000);

    // 7. Deteksi Swipe Area Atas (Android Status Bar Pull-down Guard)
    const handleTouchStart = (e: TouchEvent) => {
      if (deviceInfo.isAndroid && e.touches[0].clientY < 35) {
        resetZoomTimer();
        triggerViolation(ViolationReason.TOUCH_STATUS_BAR);
      }
    };

    window.addEventListener('visibilitychange', handleVisibility);
    document.addEventListener('webkitvisibilitychange', handleVisibility);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('resize', handleResize);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      if (blurTimer) clearTimeout(blurTimer);
      clearInterval(devToolsCheckTimer);
      window.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('webkitvisibilitychange', handleVisibility);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [hasConsented, isBlocked, deviceInfo.isMobileOrTablet, deviceInfo.isAndroid, deviceInfo.isIOS, triggerViolation, resetZoomTimer, wipeClipboard]);

  // ----------------------------------------------------
  // ANTI-TAMPER LAYER: STORAGE MODIFICATION & AUDIT SYNC (ZERO POLLING DB)
  // ----------------------------------------------------
  useEffect(() => {
    if (!hasConsented || isBlocked) return;

    // 1. Deteksi modifikasi localStorage dari tab lain
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'examsy_auth' || e.key === 'examsy_student_nis') {
        triggerViolation(ViolationReason.TAMPER_STORAGE);
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    // 2. Sinkronisasi status blokir dari WebSocket / BroadcastChannel secara in-memory (0 DB reads)
    const auditSyncTimer = setInterval(() => {
      const liveStudent = students.find(s => String(s.nis) === String(student.nis));
      if (liveStudent) {
        const serverViolations = Number(liveStudent.violations || 0);
        if (serverViolations > violations) {
          setViolations(serverViolations);
        }
        if (liveStudent.status === StudentStatus.BLOKIR) {
          handleFinalFinish();
        }
      }
    }, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageEvent);
      clearInterval(auditSyncTimer);
    };
  }, [hasConsented, isBlocked, student, students, violations, triggerViolation, handleFinalFinish]);

  // Countdown timer
  useEffect(() => {
    if (!hasConsented || isBlocked) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [hasConsented, isBlocked]);

  // Pastikan status siswa terdaftar sebagai SEDANG_UJIAN
  useEffect(() => {
    if (student && student.status !== StudentStatus.SEDANG_UJIAN && student.status !== StudentStatus.BLOKIR && student.status !== StudentStatus.SELESAI) {
      onAction('UPDATE_STUDENT', {
        ...student,
        status: StudentStatus.SEDANG_UJIAN
      });
    }
  }, []);

  // ----------------------------------------------------
  // MULAI KIOSK MODE (PERSISTENCE ENGAGEMENT)
  // ----------------------------------------------------
  const startPersistence = async () => {
    try {
      const elem = document.documentElement;

      // 1. Fullscreen request untuk semua browser yang mendukung
      if (elem.requestFullscreen) {
        await elem.requestFullscreen({ navigationUI: 'hide' } as any);
      } else if ((elem as any).webkitRequestFullscreen) {
        await (elem as any).webkitRequestFullscreen();
      }

      // 2. macOS Desktop: Kunci kursor di tengah layar (Pointer Lock)
      if (deviceInfo.isMac && document.documentElement.requestPointerLock) {
        try {
          document.documentElement.requestPointerLock();
        } catch (_) {}
      }

      // 3. Windows & ChromeOS: Keyboard Lock API
      if ((deviceInfo.isWindows || deviceInfo.isChromeOS) && (navigator as any).keyboard?.lock) {
        await (navigator as any).keyboard.lock([
          'Escape', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
          'Tab', 'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight',
          'KeyW', 'KeyN', 'KeyT', 'KeyR', 'KeyP', 'KeyS', 'KeyU', 'KeyC', 'KeyV', 'KeyX', 'KeyJ', 'KeyK'
        ]).catch(() => {});
      }
    } catch (err) {
      console.warn("Fullscreen persistence request notice:", err);
    } finally {
      await requestWakeLock();
      stopContinuousKioskAlarm();
      setHasConsented(true);
      setIsKioskLocked(false);
      onAction('UPDATE_STUDENT', {
        ...student,
        status: StudentStatus.SEDANG_UJIAN
      });
    }
  };

  // Efek otomatis keluar ketika siswa diblokir oleh proktor/admin
  useEffect(() => {
    if (isBlocked) {
      releaseWakeLock();
      stopContinuousKioskAlarm();
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      const kickTimer = setTimeout(() => {
        handleFinalFinish();
      }, 2000);
      return () => clearTimeout(kickTimer);
    }
  }, [isBlocked, releaseWakeLock, stopContinuousKioskAlarm, handleFinalFinish]);

  return (
    <div 
      className="flex flex-col h-[100dvh] w-screen overflow-hidden select-none bg-slate-950 font-sans relative"
      onClick={resetZoomTimer}
      onTouchStart={resetZoomTimer}
    >
      {/* ANTI PULL-DOWN ZONE (Android Security Guard) */}
      <div className="fixed top-0 left-0 right-0 h-2 z-[9999] touch-none pointer-events-none bg-transparent"></div>

      {/* Video keep-alive untuk wake lock fallback */}
      <video 
        ref={videoWakeLockRef} 
        style={{
          position: 'fixed',
          top: '-999px',
          left: '-999px',
          width: '1px',
          height: '1px',
          opacity: 0.001,
          pointerEvents: 'none'
        }}
        muted 
        playsInline 
        loop 
        autoPlay
        src="data:video/mp4;base64,AAAAHGZ0eXBtcDQyAAAAAG1wNDJpc29tYXZjMQAAAZptb292AAAAbG12aGQAAAAA3u7XdN7u13QAAAPoAAAAKAABAAABAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAGWlvZHMAAAAAEAAfQEAAAP8fAgACAAAAAAAFdHJhawAAAFx0a2hkAAAAAd7u13Te7u13AAAABQAAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAp1ZHRhAAAAImNoYXAAAAAaAAAAAEIARQBJAE4ARwAgAFMARQBYAFkAAAAAeW1kYXQAAAAI"
      />

      {/* MODAL DIBLOKIR */}
      {isBlocked && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/95 flex items-center justify-center p-6 backdrop-blur-xl">
          <div className="bg-white w-full max-w-[380px] p-8 md:p-10 rounded-2xl text-center shadow-2xl border-t-8 border-red-600 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m0-8V7m0 0a2 2 0 100-4 2 2 0 000 4zm-8.228 11h16.456c.959 0 1.56-1.04 1.08-1.861L13.08 4.14a1.25 1.25 0 00-2.16 0L2.692 16.14c-.48.821.121 1.861 1.08 1.861z" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-3 uppercase tracking-tighter">Akses Diblokir</h2>
            <p className="text-slate-600 text-xs font-bold uppercase mb-2 leading-relaxed">
              Ujian dihentikan secara sepihak oleh Proktor / Server Keamanan.
            </p>
            <p className="text-red-600 text-[10px] font-black uppercase tracking-wider mb-6 animate-pulse">
              Mengeluarkan Anda dari pengerjaan soal...
            </p>
            <button onClick={handleFinalFinish} className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 cursor-pointer">
              KONFIRMASI & KELUAR
            </button>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI MULAI UJIAN (KIOSK MODE SEMUA PLATFORM) */}
      {!hasConsented && !isBlocked && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/90 flex items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-white w-full max-w-[460px] p-8 md:p-10 rounded-[2.5rem] text-center shadow-2xl border-t-8 border-indigo-600 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase tracking-wider mb-2">
              <span>🛡️ KIOSK SECURITY AKTIF ({deviceInfo.osName.toUpperCase()})</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-3 uppercase tracking-tight leading-none">Ujian Kiosk Terkunci</h2>
            
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left space-y-2.5 mb-6">
              <div className="flex items-start gap-2 text-[11px] text-slate-700 font-bold">
                <span className="text-indigo-600 shrink-0 mt-0.5">🖥️</span>
                <span><strong>Layar Penuh Kiosk:</strong> Layar terkunci otomatis. Keluar layar / ganti aplikasi akan dicatat di server.</span>
              </div>
              <div className="flex items-start gap-2 text-[11px] text-slate-700 font-bold">
                <span className="text-indigo-600 shrink-0 mt-0.5">⚡</span>
                <span><strong>Standby On:</strong> Layar perangkat tidak akan redup atau mati selama ujian berlangsung.</span>
              </div>
              <div className="flex items-start gap-2 text-[11px] text-red-600 font-bold">
                <span className="shrink-0 mt-0.5">⚠️</span>
                <span><strong>Sanksi Server:</strong> Membuka tab/aplikasi lain, shortcut, atau DevTools langsung memblokir akun Anda!</span>
              </div>
            </div>

            {/* WAJIB PANDUAN GUIDED ACCESS UNTUK iOS / iPadOS */}
            {deviceInfo.isIOS && (
              <div className="mb-6 p-4 bg-amber-50 rounded-2xl border-2 border-amber-300 text-left space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-amber-900 uppercase flex items-center gap-1">
                    🍏 Wajib: Akses Terpandu (Guided Access)
                  </span>
                  <button 
                    type="button"
                    onClick={() => setShowIosGuide(true)}
                    className="text-[10px] font-black text-indigo-600 underline hover:text-indigo-800 cursor-pointer"
                  >
                    Lihat Cara Aktifkan
                  </button>
                </div>
                <p className="text-[11px] text-amber-800 leading-snug">
                  Apple mewajibkan penggunaan fitur <strong>Akses Terpandu</strong> (Tekan Power 3x) agar siswa tidak bisa membuka aplikasi lain atau melihat notifikasi.
                </p>
                <label className="flex items-start gap-2.5 pt-2 border-t border-amber-200/70 cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={guidedAccessAgreed}
                    onChange={(e) => setGuidedAccessAgreed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-amber-300"
                  />
                  <span className="text-[11px] font-bold text-slate-800 leading-tight">
                    Saya menyatakan telah mengaktifkan Akses Terpandu (Guided Access) di perangkat ini.
                  </span>
                </label>
              </div>
            )}

            <button 
              onClick={startPersistence} 
              disabled={deviceInfo.isIOS && !guidedAccessAgreed}
              className={`w-full py-4 md:py-5 rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                deviceInfo.isIOS && !guidedAccessAgreed 
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' 
                  : 'bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 text-white shadow-indigo-100'
              }`}
            >
              <span>🛡️ Aktifkan Kiosk & Mulai Ujian</span>
            </button>
            {deviceInfo.isIOS && !guidedAccessAgreed && (
              <p className="text-[10px] text-red-500 font-bold mt-2">
                * Harap centang konfirmasi Akses Terpandu terlebih dahulu.
              </p>
            )}
          </div>
        </div>
      )}

      {/* MODAL PANDUAN AKSES TERPANDU IOS */}
      {showIosGuide && (
        <div className="fixed inset-0 z-[2000] bg-slate-950/90 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white w-full max-w-[420px] p-6 md:p-8 rounded-2xl text-left shadow-2xl border-t-8 border-amber-500 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔒</span>
                <h3 className="text-sm md:text-base font-black text-slate-900 uppercase tracking-tight">Kunci Layar iOS (Akses Terpandu)</h3>
              </div>
              <button 
                onClick={() => setShowIosGuide(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Apple menyediakan fitur bawaan resmi bernama <strong>Akses Terpandu (Guided Access)</strong> untuk mengunci iPhone/iPad ke 1 aplikasi saja sehingga siswa tidak bisa membuka aplikasi lain atau melihat notifikasi.
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex gap-2.5 items-start bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">1</span>
                <div>
                  <h4 className="text-[11px] font-black text-slate-900 uppercase">Aktifkan Sekali di Pengaturan</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                    Buka <strong>Pengaturan &gt; Aksesibilitas &gt; Akses Terpandu (Guided Access)</strong>, lalu nyalakan toggle dan atur Kode Sandi.
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5 items-start bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">2</span>
                <div>
                  <h4 className="text-[11px] font-black text-slate-900 uppercase">Kunci Saat Mulai Ujian</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                    Buka halaman ujian ini, lalu <strong>tekan tombol samping / Power 3 kali</strong> cepat, lalu ketuk <strong>Mulai</strong> di pojok kanan atas.
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5 items-start bg-emerald-50 p-3 rounded-xl border border-emerald-200/80">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">3</span>
                <div>
                  <h4 className="text-[11px] font-black text-emerald-900 uppercase">100% Aman & Terkunci</h4>
                  <p className="text-[10px] text-emerald-700 mt-0.5 leading-snug">
                    Gestur keluar, panel notifikasi, dan tombol Home otomatis MATI TOTAL. Layar dijamin tetap menyala sampai ujian selesai.
                  </p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowIosGuide(false)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all"
            >
              Mengerti & Kembali
            </button>
          </div>
        </div>
      )}

      {/* HEADER RUANG UJIAN (Minimalis & Bebas Lencana Mengganggu) */}
      <header className={`shrink-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-2xl flex items-center px-4 md:px-10 transition-all duration-300 ${isMobileLandscape ? 'h-8 px-3' : 'h-14 md:h-16'}`}>
        <div className="flex-1 overflow-hidden">
          <h2 className={`text-white font-black uppercase truncate ${isMobileLandscape ? 'text-[8px]' : 'text-[10px] md:text-sm'}`}>{student.name}</h2>
          <span className={`text-indigo-400 font-bold uppercase tracking-widest ${isMobileLandscape ? 'text-[6px]' : 'text-[8px] md:text-[10px]'}`}>Kls {student.class} | {student.nis}</span>
        </div>
        <div className={`flex-1 text-center ${isMobileLandscape ? 'hidden' : 'hidden sm:block'}`}>
          <h1 className="text-white font-black uppercase tracking-tighter truncate text-xs md:text-lg">{session.name}</h1>
        </div>
        <div className={`flex-1 flex items-center justify-end transition-all ${isMobileLandscape ? 'gap-2' : 'gap-3 md:gap-4'}`}>
          <button 
            onClick={() => setIframeKey(prev => prev + 1)} 
            className={`text-indigo-400 hover:text-white transition-colors ${isMobileLandscape ? 'p-1' : 'p-2'}`}
            title="Reload Soal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`${isMobileLandscape ? 'h-3 w-3' : 'h-4 w-4 md:h-5 md:w-5'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          <div className={`font-mono font-black ${isMobileLandscape ? 'text-xs' : 'text-sm md:text-lg'} ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-indigo-400'}`}>
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
          <button onClick={() => setShowConfirm(true)} className={`bg-emerald-500 text-white rounded-xl font-black uppercase tracking-widest shadow-lg active:scale-90 transition-all ${isMobileLandscape ? 'px-3 py-1 text-[7px]' : 'px-4 md:px-8 py-2 md:py-3 text-[9px] md:text-xs'}`}>Selesai</button>
        </div>
      </header>

      {/* MAIN EXAM SHEET (BLUR & POINTER-EVENTS OFF JIKA KIOSK LOCKED) */}
      <main className={`flex-1 bg-slate-900 relative transition-all duration-300 overflow-hidden ${(isFocusLost || isKioskLocked || isBlocked || (hasConsented && !isFullscreen && !deviceInfo.isIOS)) ? 'blur-3xl pointer-events-none' : ''}`}>
        {/* ANTI-LEAK SECURITY WATERMARK OVERLAY (UNIVERSAL: WINDOWS, MACOS, ANDROID, IOS) */}
        <div className="absolute inset-0 pointer-events-none select-none z-[60] overflow-hidden opacity-[0.06] flex flex-wrap content-around justify-around gap-16 p-8 rotate-[-22deg] scale-125">
          {Array.from({ length: 32 }).map((_, idx) => (
            <div key={idx} className="text-white text-[10px] md:text-xs font-black tracking-widest uppercase whitespace-nowrap">
              {student.name} • {student.nis} • KLS {student.class}
            </div>
          ))}
        </div>

        <div 
          ref={scrollContainerRef}
          className="w-full h-full overflow-auto scrollbar-hide pb-40" 
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div 
            className={`w-full relative transition-transform duration-300 ease-out origin-top ${deviceInfo.isMobileOrTablet ? 'min-h-[100%]' : ''}`} 
            style={{ 
              transform: `scale(${zoomLevel})`,
              height: isIpadScrollHackActive ? '4000px' : '100%'
            }}
          >
            <div 
              className="relative w-full overflow-hidden" 
              style={{ 
                marginTop: `-${CLIPPING_TOP}px`, 
                marginLeft: `-${CLIPPING_SIDE}px`, 
                width: `calc(100% + ${CLIPPING_SIDE * 2}px)`, 
                height: isIpadScrollHackActive ? '4000px' : `calc(100% + ${CLIPPING_TOP + CLIPPING_BOTTOM}px)` 
              }}
            >
              {hasConsented && session.pdfUrl && (
                <iframe 
                  key={iframeKey} 
                  src={sanitizePdfUrl(session.pdfUrl)} 
                  className="w-full border-none" 
                  style={{
                    height: isIpadScrollHackActive ? '4000px' : '100%',
                    minHeight: isIpadScrollHackActive ? '4000px' : '100%'
                  }}
                  title="Soal PDF" 
                />
              )}
            </div>
          </div>
        </div>

        {/* KONTROL ZOOM */}
        <div className={`absolute transition-all duration-500 z-[200] items-center flex bg-black/40 backdrop-blur-xl border border-white/10 rounded-[1.5rem] shadow-2xl transition-opacity pointer-events-auto
          ${isZoomVisible ? 'opacity-40 hover:opacity-100' : 'opacity-[0.15] hover:opacity-100'}
          ${isMobileLandscape 
            ? 'bottom-2 left-1/2 -translate-x-1/2 flex-row scale-[0.75] p-1.5' 
            : 'bottom-6 right-4 flex-col md:bottom-10 md:left-1/2 md:right-auto md:translate-x-[-50%] md:flex-row md:scale-100 max-md:scale-[0.8] max-md:bottom-4 p-2'}`}>
           <button onClick={(e) => { e.stopPropagation(); handleZoom(0.1); }} className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center bg-white/5 hover:bg-indigo-600 text-white rounded-xl transition-all active:scale-90">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
           </button>
           <div className="px-1 min-w-[50px] md:min-w-[60px] text-center">
              <span className="text-[10px] md:text-xs font-black text-indigo-400 uppercase">{Math.round(zoomLevel * 100)}%</span>
           </div>
           <button onClick={(e) => { e.stopPropagation(); handleZoom(-0.1); }} className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center bg-white/5 hover:bg-indigo-600 text-white rounded-xl transition-all active:scale-90">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" /></svg>
           </button>
        </div>

        {/* TOMBOL SCROLL NAIK TURUN */}
        <div 
          className={`absolute top-1/2 -translate-y-1/2 z-[200] flex flex-col gap-3 transition-all duration-300 pointer-events-auto ${
            isZoomVisible ? 'opacity-40 hover:opacity-100' : 'opacity-20 hover:opacity-100'
          } ${isMobileLandscape ? 'scale-[0.75] right-2' : 'scale-100 right-3 md:right-5'}`}
        >
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); handleAutoScroll('up'); }}
            className="w-12 h-12 md:w-13 md:h-13 flex items-center justify-center bg-black/30 hover:bg-black/70 backdrop-blur-md border border-white/20 hover:border-white/40 text-white rounded-2xl shadow-2xl active:scale-90 transition-all cursor-pointer group"
            title="Gulir Naik (Scroll Up)"
            aria-label="Gulir Naik"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7 group-hover:-translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); handleAutoScroll('down'); }}
            className="w-12 h-12 md:w-13 md:h-13 flex items-center justify-center bg-black/30 hover:bg-black/70 backdrop-blur-md border border-white/20 hover:border-white/40 text-white rounded-2xl shadow-2xl active:scale-90 transition-all cursor-pointer group"
            title="Gulir Turun (Scroll Down)"
            aria-label="Gulir Turun"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7 group-hover:translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </main>

      {/* OVERLAY MERAH KIOSK TERKUNCI (FULLSCREEN RE-ENTRY LOOP & SANKSI SERVER) */}
      {(isFocusLost || isKioskLocked) && hasConsented && !isBlocked && (
        <div className="fixed inset-0 z-[5000] bg-slate-950/95 flex items-center justify-center p-6 md:p-8 backdrop-blur-2xl">
          <div className="bg-white w-full max-w-[430px] p-8 md:p-10 rounded-[2.5rem] text-center shadow-2xl border-b-8 border-red-600 animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-inner border border-red-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100/80 text-red-700 text-[10px] font-black uppercase tracking-wider mb-2">
              <span>🛡️ KIOSK TERKUNCI ({deviceInfo.osName})</span>
            </div>

            <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight leading-tight">
              Layar Ujian Terkunci
            </h3>

            <p className="text-slate-600 text-xs md:text-sm font-semibold mb-2 leading-relaxed">
              {lockReason}
            </p>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-6">
              Aktivitas ini telah diverifikasi dan dicatat oleh server keamanan.
            </p>

            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl mb-6">
              <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">
                Sisa Kesempatan Sebelum Auto-Blockir
              </p>
              <p className="text-3xl font-black text-red-600">
                {Math.max(0, maxViolationsAllowed - violations)} / {maxViolationsAllowed}
              </p>
            </div>

            <button 
              onClick={reEnterKioskMode} 
              className="w-full py-4 md:py-5 bg-gradient-to-r from-red-600 to-indigo-600 hover:from-red-700 hover:to-indigo-700 text-white rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest shadow-xl shadow-red-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>🛡️ Kembali ke Kiosk Mode & Lanjut Ujian</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI SELESAI */}
      {showConfirm && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-[340px] md:max-w-[440px] p-8 md:p-12 rounded-[2.5rem] shadow-2xl text-center border-t-8 border-emerald-500 animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-4 uppercase tracking-tight leading-none">Akhiri Sesi?</h3>
            <p className="text-slate-600 text-sm font-medium leading-relaxed mb-10">Pastikan seluruh jawaban Anda telah disalin dengan benar sebelum keluar.</p>
            <div className="flex flex-col gap-3">
              <button onClick={handleFinalFinish} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-2xl font-black text-sm md:text-base uppercase tracking-[0.15em] active:scale-95 transition-all shadow-lg shadow-emerald-100">Selesai & Keluar</button>
              <button onClick={() => setShowConfirm(false)} className="w-full text-slate-400 font-bold py-3 text-xs md:text-sm uppercase tracking-[0.1em] hover:text-slate-600 transition-colors">Kembali ke Soal</button>
            </div>
          </div>
        </div>
      )}

      <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
};

export default ExamRoom;
