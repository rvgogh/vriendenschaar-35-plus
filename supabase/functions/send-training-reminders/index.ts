import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// VAPID keys for Web Push
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || 'wcFXKH9s5YQWBJ8GSsKjLT_E1TEvh6Dzx1R1eTx6tqA';

interface PushSubscription {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

// Helper function to convert base64url to Uint8Array
function base64UrlToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Helper function to send push notification using fetch
async function sendPushNotification(subscription: { endpoint: string; keys: { p256dh: string; auth: string } }, payload: string): Promise<{ success: boolean; statusCode: number; error?: string }> {
  try {
    // For now, send without encryption as a test
    // In production, you'd need to implement proper Web Push encryption
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'TTL': '86400'
      },
      body: payload
    });
    
    return {
      success: response.ok || response.status === 201,
      statusCode: response.status,
      error: response.ok ? undefined : await response.text()
    };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return {
      success: false,
      statusCode: 500,
      error: error.message
    };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    const expectedSecret = Deno.env.get('CRON_SECRET');
    
    // Parse request body first
    let requestBody: any = {};
    try {
      if (req.method === 'POST') {
        const text = await req.text();
        console.log('Raw request body:', text);
        if (text) {
          requestBody = JSON.parse(text);
          console.log('Parsed request body:', JSON.stringify(requestBody));
        }
      }
    } catch (e) {
      console.error('Error parsing request body:', e);
    }
    
    const isTestMode = requestBody.test === true;
    console.log('Test mode:', isTestMode);
    
    let isAuthorized = false;
    let supabaseClient;

    // Check if it's a cron job with secret
    if (authHeader === `Bearer ${expectedSecret}`) {
      isAuthorized = true;
      supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      console.log('Authenticated via CRON_SECRET');
    } else if (authHeader?.startsWith('Bearer ')) {
      // Check if it's an authenticated superuser
      const jwt = authHeader.replace('Bearer ', '');
      supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        {
          global: {
            headers: { Authorization: authHeader }
          }
        }
      );

      // Verify the user is authenticated and is a superuser
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser(jwt);
      
      if (user && !userError) {
        const { data: roleData, error: roleError } = await supabaseClient
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (!roleError && roleData?.role === 'superuser') {
          isAuthorized = true;
          // Switch to service role client for sending notifications
          supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
          );
          console.log('Authenticated via JWT as superuser:', user.email);
        }
      }
    }

    if (!isAuthorized) {
      console.error('Unauthorized access attempt to send-training-reminders');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // In test mode, skip training check and send test notifications
    let trainings = [];
    
    if (isTestMode) {
      console.log('Test mode: sending test notifications');
      // Create a fake training for test purposes
      trainings = [{
        id: 'test',
        training_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      }];
    } else {
      console.log('Checking for trainings in 2 days...');

      // Calculate date 2 days from now
      const twoDaysFromNow = new Date();
      twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
      twoDaysFromNow.setHours(0, 0, 0, 0);

      const twoDaysEnd = new Date(twoDaysFromNow);
      twoDaysEnd.setHours(23, 59, 59, 999);

      // Get trainings happening in 2 days
      const { data: trainingsData, error: trainingsError } = await supabaseClient
        .from('trainings')
        .select('*')
        .gte('training_at', twoDaysFromNow.toISOString())
        .lte('training_at', twoDaysEnd.toISOString());

      if (trainingsError) {
        console.error('Error fetching trainings:', trainingsError);
        throw trainingsError;
      }

      trainings = trainingsData || [];
      console.log(`Found ${trainings.length} trainings in 2 days`);

      if (trainings.length === 0) {
        return new Response(
          JSON.stringify({ message: 'No trainings found in 2 days' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
    }

    // Get all push subscriptions
    const { data: subscriptions, error: subscriptionsError } = await supabaseClient
      .from('push_subscriptions')
      .select('*');

    if (subscriptionsError) {
      console.error('Error fetching subscriptions:', subscriptionsError);
      throw subscriptionsError;
    }

    console.log(`Found ${subscriptions?.length || 0} subscriptions`);

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No subscriptions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Send notifications to all subscribers
    let successCount = 0;
    let failureCount = 0;

    for (const subscription of subscriptions) {
      for (const training of trainings) {
        try {
          const trainingDate = new Date(training.training_at);
          const formattedDate = trainingDate.toLocaleDateString('nl-NL', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          });
          const formattedTime = trainingDate.toLocaleTimeString('nl-NL', {
            hour: '2-digit',
            minute: '2-digit',
          });

          const payload = isTestMode ? {
            title: 'Test Notificatie',
            body: `Dit is een test notificatie. Als je dit ziet, werken notificaties correct!`,
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            tag: `test-notification`,
            data: {
              url: '/my-training',
            },
          } : {
            title: 'Training Herinnering',
            body: `Training op ${formattedDate} om ${formattedTime}. Vergeet niet je aanwezigheid aan te geven!`,
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            tag: `training-${training.id}`,
            data: {
              url: '/my-training',
              trainingId: training.id,
            },
          };

          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          };

          const response = await sendPushNotification(
            pushSubscription,
            JSON.stringify(payload)
          );

          if (response.success) {
            successCount++;
            console.log(`Notification sent to subscription ${subscription.id}`);
          } else {
            failureCount++;
            console.error(`Failed to send notification: ${response.statusCode} ${response.error}`);
            
            // If subscription is no longer valid, delete it
            if (response.statusCode === 404 || response.statusCode === 410) {
              await supabaseClient
                .from('push_subscriptions')
                .delete()
                .eq('id', subscription.id);
              console.log(`Deleted invalid subscription ${subscription.id}`);
            }
          }
        } catch (error) {
          failureCount++;
          console.error(`Error sending notification:`, error);
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Notifications sent',
        trainings: trainings.length,
        subscriptions: subscriptions.length,
        successCount,
        failureCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in send-training-reminders:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
