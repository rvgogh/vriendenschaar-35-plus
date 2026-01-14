import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get VAPID keys from environment variables
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') || '';
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || '';
const VAPID_SUBJECT = 'mailto:rvgogh@outlook.com';

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

// Helper to convert Uint8Array to base64url
function uint8ArrayToBase64Url(uint8Array: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Create VAPID JWT token
async function createVapidJwt(endpoint: string): Promise<string> {
  const urlParts = new URL(endpoint);
  const audience = `${urlParts.protocol}//${urlParts.host}`;
  
  const header = { typ: 'JWT', alg: 'ES256' };
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 43200, // 12 hours
    sub: VAPID_SUBJECT
  };
  
  const headerB64 = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;
  
  // Import private key as JWK (VAPID private key is the 'd' parameter)
  const privateKeyBytes = base64UrlToUint8Array(VAPID_PRIVATE_KEY);
  const publicKeyBytes = base64UrlToUint8Array(VAPID_PUBLIC_KEY);
  
  // Extract x and y coordinates from the uncompressed public key (65 bytes: 0x04 + 32 bytes x + 32 bytes y)
  const x = uint8ArrayToBase64Url(publicKeyBytes.slice(1, 33));
  const y = uint8ArrayToBase64Url(publicKeyBytes.slice(33, 65));
  const d = uint8ArrayToBase64Url(privateKeyBytes);
  
  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    x: x,
    y: y,
    d: d,
  };
  
  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(unsignedToken)
  );
  
  // Convert signature from DER to raw format (WebCrypto returns raw r||s for ECDSA)
  const signatureB64 = uint8ArrayToBase64Url(new Uint8Array(signature));
  
  return `${unsignedToken}.${signatureB64}`;
}

// HKDF implementation for Web Push encryption
async function hkdf(
  ikm: Uint8Array, 
  salt: Uint8Array, 
  info: Uint8Array, 
  length: number
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    salt.length ? salt : new Uint8Array(32),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  // Extract
  const prk = new Uint8Array(await crypto.subtle.sign('HMAC', key, ikm));
  
  // Expand
  const prkKey = await crypto.subtle.importKey(
    'raw',
    prk,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  let t = new Uint8Array(0);
  let okm = new Uint8Array(0);
  let counter = 1;
  
  while (okm.length < length) {
    const input = new Uint8Array([...t, ...info, counter]);
    t = new Uint8Array(await crypto.subtle.sign('HMAC', prkKey, input));
    okm = new Uint8Array([...okm, ...t]);
    counter++;
  }
  
  return okm.slice(0, length);
}

// Create info for HKDF
function createInfo(type: string, clientPublicKey: Uint8Array, serverPublicKey: Uint8Array): Uint8Array {
  const encoder = new TextEncoder();
  const typeBuffer = encoder.encode(type);
  
  // "Content-Encoding: <type>\0" + "P-256\0" + client key length + client key + server key length + server key
  const info = new Uint8Array(
    18 + typeBuffer.length + 1 + 5 + 1 + 2 + 65 + 2 + 65
  );
  
  let offset = 0;
  
  // "Content-Encoding: "
  const ce = encoder.encode('Content-Encoding: ');
  info.set(ce, offset);
  offset += ce.length;
  
  // type
  info.set(typeBuffer, offset);
  offset += typeBuffer.length;
  
  // null byte
  info[offset++] = 0;
  
  // "P-256"
  const p256 = encoder.encode('P-256');
  info.set(p256, offset);
  offset += p256.length;
  
  // null byte
  info[offset++] = 0;
  
  // client key length (65 bytes as 2 bytes big-endian)
  info[offset++] = 0;
  info[offset++] = 65;
  
  // client public key
  info.set(clientPublicKey, offset);
  offset += 65;
  
  // server key length (65 bytes as 2 bytes big-endian)
  info[offset++] = 0;
  info[offset++] = 65;
  
  // server public key
  info.set(serverPublicKey, offset);
  
  return info;
}

// Encrypt payload using aes128gcm
async function encryptPayload(
  payload: string,
  p256dhKey: string,
  authSecret: string
): Promise<{ ciphertext: Uint8Array; salt: Uint8Array; serverPublicKey: Uint8Array }> {
  const payloadBytes = new TextEncoder().encode(payload);
  
  // Generate a new ECDH key pair for this message
  const serverKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );
  
  // Export the server's public key
  const serverPublicKeyRaw = await crypto.subtle.exportKey('raw', serverKeyPair.publicKey);
  const serverPublicKey = new Uint8Array(serverPublicKeyRaw);
  
  // Import the client's public key (p256dh)
  const clientPublicKeyBytes = base64UrlToUint8Array(p256dhKey);
  const clientPublicKey = await crypto.subtle.importKey(
    'raw',
    clientPublicKeyBytes,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );
  
  // Derive shared secret using ECDH
  const sharedSecretBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: clientPublicKey },
    serverKeyPair.privateKey,
    256
  );
  const sharedSecret = new Uint8Array(sharedSecretBits);
  
  // Get auth secret
  const authSecretBytes = base64UrlToUint8Array(authSecret);
  
  // Generate a random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // RFC 8291 key derivation
  // IKM = HKDF(auth_secret, ecdh_secret, "WebPush: info\0" || client_public || server_public, 32)
  const encoder = new TextEncoder();
  const keyInfoPrefix = encoder.encode('WebPush: info\0');
  const keyInfo = new Uint8Array(keyInfoPrefix.length + 65 + 65);
  keyInfo.set(keyInfoPrefix, 0);
  keyInfo.set(clientPublicKeyBytes, keyInfoPrefix.length);
  keyInfo.set(serverPublicKey, keyInfoPrefix.length + 65);
  
  const ikm = await hkdf(sharedSecret, authSecretBytes, keyInfo, 32);
  
  // Derive content encryption key: HKDF(salt, IKM, "Content-Encoding: aes128gcm\0", 16)
  const cekInfo = encoder.encode('Content-Encoding: aes128gcm\0');
  const contentEncryptionKey = await hkdf(ikm, salt, cekInfo, 16);
  
  // Derive nonce: HKDF(salt, IKM, "Content-Encoding: nonce\0", 12)
  const nonceInfo = encoder.encode('Content-Encoding: nonce\0');
  const nonce = await hkdf(ikm, salt, nonceInfo, 12);
  
  // Import the content encryption key for AES-GCM
  const aesKey = await crypto.subtle.importKey(
    'raw',
    contentEncryptionKey,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  // Pad the payload (add a delimiter byte 0x02 followed by optional padding)
  // For aes128gcm, the padding delimiter is 0x02
  const paddedPayload = new Uint8Array(payloadBytes.length + 1);
  paddedPayload.set(payloadBytes, 0);
  paddedPayload[payloadBytes.length] = 2; // Delimiter
  
  // Encrypt
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce },
    aesKey,
    paddedPayload
  );
  
  return {
    ciphertext: new Uint8Array(ciphertext),
    salt,
    serverPublicKey
  };
}

// Build aes128gcm formatted body
function buildAes128gcmBody(
  salt: Uint8Array,
  serverPublicKey: Uint8Array,
  ciphertext: Uint8Array
): Uint8Array {
  // Format: salt (16) + record size (4) + key length (1) + key (65) + ciphertext
  const recordSize = 4096;
  const body = new Uint8Array(16 + 4 + 1 + 65 + ciphertext.length);
  
  let offset = 0;
  
  // Salt (16 bytes)
  body.set(salt, offset);
  offset += 16;
  
  // Record size (4 bytes, big-endian)
  body[offset++] = (recordSize >> 24) & 0xff;
  body[offset++] = (recordSize >> 16) & 0xff;
  body[offset++] = (recordSize >> 8) & 0xff;
  body[offset++] = recordSize & 0xff;
  
  // Key length (1 byte)
  body[offset++] = 65;
  
  // Server public key (65 bytes)
  body.set(serverPublicKey, offset);
  offset += 65;
  
  // Ciphertext
  body.set(ciphertext, offset);
  
  return body;
}

// Send encrypted push notification
async function sendPushNotification(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } }, 
  payload: string
): Promise<{ success: boolean; statusCode: number; error?: string }> {
  try {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      throw new Error('VAPID keys not configured');
    }
    
    const vapidToken = await createVapidJwt(subscription.endpoint);
    
    // Encrypt the payload
    const { ciphertext, salt, serverPublicKey } = await encryptPayload(
      payload,
      subscription.keys.p256dh,
      subscription.keys.auth
    );
    
    // Build the aes128gcm body
    const body = buildAes128gcmBody(salt, serverPublicKey, ciphertext);
    
    console.log(`Sending encrypted notification (${body.length} bytes) to endpoint`);
    
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'TTL': '86400',
        'Urgency': 'normal',
        'Authorization': `vapid t=${vapidToken}, k=${VAPID_PUBLIC_KEY}`,
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
      },
      body: body
    });
    
    const responseText = response.ok ? '' : await response.text();
    
    return {
      success: response.ok || response.status === 201,
      statusCode: response.status,
      error: response.ok ? undefined : responseText
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
    // Check VAPID keys are configured
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      console.error('VAPID keys not configured');
      return new Response(
        JSON.stringify({ error: 'VAPID keys not configured. Please add VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY secrets.' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('VAPID keys configured, public key length:', VAPID_PUBLIC_KEY.length);
    
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

          console.log(`Sending notification to endpoint: ${subscription.endpoint.substring(0, 50)}...`);
          
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
