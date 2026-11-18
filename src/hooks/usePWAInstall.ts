import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

let deferredPromptGlobal: BeforeInstallPromptEvent | null = null;
let installedGlobal = false;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

if (typeof window !== 'undefined') {
  installedGlobal =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferredPromptGlobal = e as BeforeInstallPromptEvent;
    notifyListeners();
  });

  window.addEventListener('appinstalled', () => {
    installedGlobal = true;
    deferredPromptGlobal = null;
    notifyListeners();
  });
}

export function usePWAInstall() {
  const [, setTick] = useState(0);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    const sync = () => setTick((t) => t + 1);
    listeners.add(sync);

    const ua = window.navigator.userAgent.toLowerCase();
    const iosDevice =
      /iphone|ipad|ipod/.test(ua) ||
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
    setIsIOS(iosDevice);
    setIsAndroid(/android/.test(ua));

    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }

    const mq = window.matchMedia('(display-mode: standalone)');
    const handleDisplayMode = (ev: MediaQueryListEvent) => {
      if (ev.matches) {
        installedGlobal = true;
        deferredPromptGlobal = null;
        notifyListeners();
      }
    };
    mq.addEventListener?.('change', handleDisplayMode);

    return () => {
      listeners.delete(sync);
      mq.removeEventListener?.('change', handleDisplayMode);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    if (!deferredPromptGlobal) return false;
    await deferredPromptGlobal.prompt();
    const { outcome } = await deferredPromptGlobal.userChoice;
    if (outcome === 'accepted') {
      installedGlobal = true;
      deferredPromptGlobal = null;
      notifyListeners();
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPromptGlobal,
    isInstalled: installedGlobal,
    isIOS,
    isAndroid,
    isInIframe,
    install,
  };
}
