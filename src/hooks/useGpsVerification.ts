import { useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TrainingLocation {
  id: number;
  latitude: number;
  longitude: number;
  radius_meters: number;
  name: string | null;
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

export const useTrainingLocation = () => {
  return useQuery({
    queryKey: ['trainingLocation'],
    queryFn: async (): Promise<TrainingLocation | null> => {
      const { data, error } = await supabase
        .from('training_location')
        .select('*')
        .eq('id', 1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    }
  });
};

export const useGpsVerification = (
  trainingId: number | null,
  playerId: number | null,
  enabled: boolean = true
) => {
  const queryClient = useQueryClient();
  const hasVerifiedRef = useRef<Set<number>>(new Set());
  
  const { data: trainingLocation } = useTrainingLocation();

  const verifyMutation = useMutation({
    mutationFn: async ({ trainingId, playerId, latitude, longitude }: {
      trainingId: number;
      playerId: number;
      latitude: number;
      longitude: number;
    }) => {
      const { error } = await supabase
        .from('training_statuses')
        .update({
          verified_at: new Date().toISOString(),
          verified_latitude: latitude,
          verified_longitude: longitude
        })
        .eq('training_id', trainingId)
        .eq('player_id', playerId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      hasVerifiedRef.current.add(variables.trainingId);
      queryClient.invalidateQueries({ queryKey: ['trainingPlayers'] });
      console.log('Training attendance verified via GPS');
    },
    onError: (error) => {
      console.error('Failed to verify training attendance:', error);
    }
  });

  const attemptVerification = useCallback(() => {
    if (!trainingId || !playerId || !trainingLocation || !enabled) return;
    if (hasVerifiedRef.current.has(trainingId)) return;

    // Check if geolocation is available
    if (!navigator.geolocation) {
      console.log('Geolocation not available');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const distance = calculateDistance(
          latitude,
          longitude,
          trainingLocation.latitude,
          trainingLocation.longitude
        );

        console.log(`GPS verification: ${distance.toFixed(0)}m from training location (max: ${trainingLocation.radius_meters}m)`);

        if (distance <= trainingLocation.radius_meters) {
          verifyMutation.mutate({ trainingId, playerId, latitude, longitude });
        }
      },
      (error) => {
        console.log('GPS error:', error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }, [trainingId, playerId, trainingLocation, enabled, verifyMutation]);

  useEffect(() => {
    if (trainingId && playerId && trainingLocation && enabled) {
      // Attempt verification on mount with a small delay
      const timer = setTimeout(attemptVerification, 1000);
      return () => clearTimeout(timer);
    }
  }, [trainingId, playerId, trainingLocation, enabled, attemptVerification]);

  return {
    attemptVerification,
    isVerifying: verifyMutation.isPending
  };
};

export const useGpsVerificationForMultipleTrainings = (
  trainingIds: number[],
  playerId: number | null,
  enabled: boolean = true,
  onVerificationSuccess?: () => void
) => {
  const queryClient = useQueryClient();
  const hasVerifiedRef = useRef<Set<number>>(new Set());
  
  const { data: trainingLocation } = useTrainingLocation();

  const verifyMutation = useMutation({
    mutationFn: async ({ trainingId, playerId, latitude, longitude }: {
      trainingId: number;
      playerId: number;
      latitude: number;
      longitude: number;
    }) => {
      const { error } = await supabase
        .from('training_statuses')
        .update({
          verified_at: new Date().toISOString(),
          verified_latitude: latitude,
          verified_longitude: longitude
        })
        .eq('training_id', trainingId)
        .eq('player_id', playerId);
      
      if (error) throw error;
      return trainingId;
    },
    onSuccess: (trainingId) => {
      hasVerifiedRef.current.add(trainingId);
      queryClient.invalidateQueries({ queryKey: ['trainingPlayers'] });
      queryClient.invalidateQueries({ queryKey: ['trainingPresence'] });
      console.log(`Training ${trainingId} attendance verified via GPS`);
      onVerificationSuccess?.();
    }
  });

  useEffect(() => {
    if (!playerId || !trainingLocation || !enabled || trainingIds.length === 0) return;

    // Filter training IDs that haven't been verified yet
    const unverifiedIds = trainingIds.filter(id => !hasVerifiedRef.current.has(id));
    if (unverifiedIds.length === 0) return;

    if (!navigator.geolocation) {
      console.log('Geolocation not available');
      return;
    }

    const timer = setTimeout(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const distance = calculateDistance(
            latitude,
            longitude,
            trainingLocation.latitude,
            trainingLocation.longitude
          );

          console.log(`GPS verification: ${distance.toFixed(0)}m from training location (max: ${trainingLocation.radius_meters}m)`);

          if (distance <= trainingLocation.radius_meters) {
            // Verify all unverified trainings
            unverifiedIds.forEach(trainingId => {
              verifyMutation.mutate({ trainingId, playerId, latitude, longitude });
            });
          }
        },
        (error) => {
          console.log('GPS error:', error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    }, 1000);

    return () => clearTimeout(timer);
  }, [trainingIds.join(','), playerId, trainingLocation, enabled]);
};
