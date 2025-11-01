import { useEffect, useState } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/hooks/useAuth';

export const NotificationPrompt = () => {
  const { user } = useAuth();
  const { permission, isSubscribed, requestPermission, unsubscribeUser } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    // Show prompt after 3 seconds if not already granted or denied
    const timer = setTimeout(() => {
      const hasSeenPrompt = localStorage.getItem('notification-prompt-seen');
      if (permission === 'default' && !hasSeenPrompt && !dismissed) {
        setShowPrompt(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [user, permission, dismissed]);

  const handleEnable = async () => {
    const success = await requestPermission();
    if (success || permission !== 'default') {
      localStorage.setItem('notification-prompt-seen', 'true');
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('notification-prompt-seen', 'true');
    setDismissed(true);
    setShowPrompt(false);
  };

  const handleDisable = async () => {
    await unsubscribeUser();
  };

  if (!user) return null;

  // Show inline button if notifications are granted/denied
  if (permission !== 'default') {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        {isSubscribed ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisable}
            className="gap-2"
          >
            <BellOff className="h-4 w-4" />
            Notificaties uit
          </Button>
        ) : permission === 'granted' ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleEnable}
            className="gap-2"
          >
            <Bell className="h-4 w-4" />
            Notificaties aan
          </Button>
        ) : null}
      </div>
    );
  }

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-in slide-in-from-bottom-4">
      <Card>
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Trainingsherinneringen</CardTitle>
          </div>
          <CardDescription>
            Ontvang een notificatie 2 dagen voor elke training
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button onClick={handleEnable} className="flex-1">
            Inschakelen
          </Button>
          <Button variant="outline" onClick={handleDismiss} className="flex-1">
            Niet nu
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};