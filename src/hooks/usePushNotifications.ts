import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

// VAPID public key - this is the public key, safe to include in client code
const VAPID_PUBLIC_KEY = 'BBoX6n8HBuRRXi_1yhgLt9veqb91Y0lHSgapJWidtKJ9jNZ-HuigW77w2KQGxalBqr40BPd9Hu8MGA7hpWMpBTA';

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
    
    // Check if user is already subscribed
    const checkSubscription = async () => {
      if ('serviceWorker' in navigator && 'Notification' in window && Notification.permission === 'granted') {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          setIsSubscribed(!!subscription);
        } catch (error) {
          console.error('Error checking subscription:', error);
        }
      }
    };
    
    checkSubscription();
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast({
        title: 'Niet ondersteund',
        description: 'Je browser ondersteunt geen notificaties',
        variant: 'destructive',
      });
      return false;
    }

    if (!('serviceWorker' in navigator)) {
      toast({
        title: 'Niet ondersteund',
        description: 'Je browser ondersteunt geen service workers',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        await subscribeUser();
        return true;
      } else {
        toast({
          title: 'Toestemming geweigerd',
          description: 'Je kunt notificaties inschakelen in je browser instellingen',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast({
        title: 'Fout',
        description: 'Er ging iets mis bij het aanvragen van toestemming',
        variant: 'destructive',
      });
      return false;
    }
  };

  const subscribeUser = async () => {
    if (!user) {
      toast({
        title: 'Niet ingelogd',
        description: 'Je moet ingelogd zijn om notificaties te ontvangen',
        variant: 'destructive',
      });
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Create new subscription with the new VAPID public key
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      const subscriptionJson = subscription.toJSON();

      // Save subscription to database
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscriptionJson.endpoint!,
          p256dh: subscriptionJson.keys!.p256dh!,
          auth: subscriptionJson.keys!.auth!,
        }, {
          onConflict: 'user_id,endpoint',
        });

      if (error) throw error;

      setIsSubscribed(true);
      toast({
        title: 'Notificaties ingeschakeld',
        description: 'Je ontvangt nu herinneringen voor trainingen',
      });
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      toast({
        title: 'Fout',
        description: 'Er ging iets mis bij het inschakelen van notificaties',
        variant: 'destructive',
      });
    }
  };

  const unsubscribeUser = async () => {
    if (!user) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Remove from database
        const { error } = await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('endpoint', subscription.endpoint);

        if (error) throw error;
      }

      setIsSubscribed(false);
      toast({
        title: 'Notificaties uitgeschakeld',
        description: 'Je ontvangt geen herinneringen meer',
      });
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      toast({
        title: 'Fout',
        description: 'Er ging iets mis bij het uitschakelen van notificaties',
        variant: 'destructive',
      });
    }
  };

  return {
    permission,
    isSubscribed,
    requestPermission,
    subscribeUser,
    unsubscribeUser,
  };
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
