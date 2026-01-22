import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  setupPWAInstallPrompt, 
  triggerPWAInstall, 
  canInstallApp, 
  isAppInstalled 
} from '@/lib/pwa-install';

export function PWAInstallButton() {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setupPWAInstallPrompt();
    setCanInstall(canInstallApp());
    setIsInstalled(isAppInstalled());

    const checkInstallState = setInterval(() => {
      setCanInstall(canInstallApp());
      setIsInstalled(isAppInstalled());
    }, 1000);

    return () => clearInterval(checkInstallState);
  }, []);

  const handleInstall = async () => {
    setIsLoading(true);
    try {
      const success = await triggerPWAInstall();
      if (success) {
        setIsInstalled(true);
        setCanInstall(false);
      }
    } catch (error) {
      console.error('PWA installation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isInstalled) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-green-50 border border-green-200">
        <div className="w-2 h-2 rounded-full bg-green-500"></div>
        <span className="text-xs font-medium text-green-700">App Installed</span>
      </div>
    );
  }

  if (!canInstall) {
    return null;
  }

  return (
    <Button
      onClick={handleInstall}
      disabled={isLoading}
      size="sm"
      className="gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
      title="Install Health Reports app to your device"
    >
      <Download className="w-4 h-4" />
      <span className="hidden sm:inline">Install App</span>
    </Button>
  );
}
