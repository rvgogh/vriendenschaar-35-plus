import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTrainingLocation } from '@/hooks/useGpsVerification';
import { toast } from '@/components/ui/sonner';

interface GpsVerificationButtonProps {
  trainingId: number;
  playerId: number;
}

// Calculate distance between two GPS coordinates in meters (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const GpsVerificationButton = ({ trainingId, playerId }: GpsVerificationButtonProps) => {
  const queryClient = useQueryClient();
  const { data: trainingLocation } = useTrainingLocation();
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'checking' | 'success' | 'failed' | 'too-far'>('idle');
  const [distance, setDistance] = useState<number | null>(null);

  const verifyMutation = useMutation({
    mutationFn: async ({ latitude, longitude }: { latitude: number; longitude: number }) => {
      // First ensure there's a training status record (upsert approach)
      const { data: existingStatus } = await supabase
        .from('training_statuses')
        .select('*')
        .eq('training_id', trainingId)
        .eq('player_id', playerId)
        .single();

      if (existingStatus) {
        const { error } = await supabase
          .from('training_statuses')
          .update({
            status: 'YES',
            verified_at: new Date().toISOString(),
            verified_latitude: latitude,
            verified_longitude: longitude
          })
          .eq('training_id', trainingId)
          .eq('player_id', playerId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('training_statuses')
          .insert({
            training_id: trainingId,
            player_id: playerId,
            status: 'YES',
            verified_at: new Date().toISOString(),
            verified_latitude: latitude,
            verified_longitude: longitude
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      setVerificationStatus('success');
      queryClient.invalidateQueries({ queryKey: ['trainingPlayers'] });
      queryClient.invalidateQueries({ queryKey: ['trainingPresence'] });
      toast.success("Aanwezigheid geverifieerd via GPS! 📍");
    },
    onError: (error) => {
      console.error('Failed to verify training attendance:', error);
      setVerificationStatus('failed');
      toast.error("Verificatie mislukt. Probeer opnieuw.");
    }
  });

  const handleVerification = useCallback(() => {
    if (!trainingLocation) {
      toast.error("Trainingslocatie niet beschikbaar");
      return;
    }

    setVerificationStatus('checking');

    if (!navigator.geolocation) {
      setVerificationStatus('failed');
      toast.error("GPS is niet beschikbaar op dit apparaat");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const dist = calculateDistance(
          latitude,
          longitude,
          trainingLocation.latitude,
          trainingLocation.longitude
        );

        setDistance(Math.round(dist));

        if (dist <= trainingLocation.radius_meters) {
          verifyMutation.mutate({ latitude, longitude });
        } else {
          setVerificationStatus('too-far');
          toast.error(`Je bent te ver van de trainingslocatie (${Math.round(dist)}m)`);
        }
      },
      (error) => {
        console.error('GPS error:', error);
        setVerificationStatus('failed');
        let message = "GPS fout";
        if (error.code === error.PERMISSION_DENIED) {
          message = "GPS toegang geweigerd. Sta locatie toe in je instellingen.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = "Locatie niet beschikbaar";
        } else if (error.code === error.TIMEOUT) {
          message = "GPS timeout. Probeer opnieuw.";
        }
        toast.error(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  }, [trainingLocation, verifyMutation]);

  const getButtonContent = () => {
    switch (verificationStatus) {
      case 'checking':
        return (
          <>
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Locatie controleren...
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
            Aanwezigheid geverifieerd!
          </>
        );
      case 'too-far':
        return (
          <>
            <XCircle className="h-5 w-5 mr-2" />
            Te ver ({distance}m) - Opnieuw proberen
          </>
        );
      case 'failed':
        return (
          <>
            <XCircle className="h-5 w-5 mr-2" />
            Mislukt - Opnieuw proberen
          </>
        );
      default:
        return (
          <>
            <MapPin className="h-5 w-5 mr-2" />
            GPS Check-in
          </>
        );
    }
  };

  return (
    <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30">
      <CardContent className="py-4">
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-muted-foreground text-center">
            Ben je op de training? Verifieer je aanwezigheid met GPS
          </p>
          <Button
            onClick={handleVerification}
            disabled={verificationStatus === 'checking' || verificationStatus === 'success'}
            variant={verificationStatus === 'success' ? 'outline' : 'default'}
            className="w-full max-w-xs"
            size="lg"
          >
            {getButtonContent()}
          </Button>
          {trainingLocation && (
            <p className="text-xs text-muted-foreground">
              📍 {trainingLocation.name || 'Trainingslocatie'}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GpsVerificationButton;
