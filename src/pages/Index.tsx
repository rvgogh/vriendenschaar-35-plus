import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar, Trophy, Users, CheckCircle, X } from "lucide-react";

const fetchMyPlayer = async (userId: string) => {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data;
};

const fetchUpcomingMatch = async () => {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .gte('match_date', new Date().toISOString())
    .order('match_date', { ascending: true })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

const fetchUpcomingTraining = async () => {
  const { data, error } = await supabase
    .from('trainings')
    .select('*')
    .gte('training_at', new Date().toISOString())
    .order('training_at', { ascending: true })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

const fetchUpcomingEvent = async () => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .gte('event_date', new Date().toISOString().split('T')[0])
    .order('event_date', { ascending: true })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

const fetchMatchPresence = async (playerId: number, matchId: number) => {
  const { data, error } = await supabase
    .from('player_statuses')
    .select('status')
    .eq('player_id', playerId)
    .eq('match_id', matchId)
    .single();

  if (error && error.code !== 'PGRST116') return null;
  return data;
};

const fetchTrainingPresence = async (playerId: number, trainingId: number) => {
  const { data, error } = await supabase
    .from('training_statuses')
    .select('status')
    .eq('player_id', playerId)
    .eq('training_id', trainingId)
    .single();

  if (error && error.code !== 'PGRST116') return null;
  return data;
};

const fetchEventPresence = async (playerId: number, eventId: number) => {
  const { data, error } = await supabase
    .from('event_statuses')
    .select('status')
    .eq('player_id', playerId)
    .eq('event_id', eventId)
    .single();

  if (error && error.code !== 'PGRST116') return null;
  return data;
};

const Index = () => {
  const { user } = useAuth();

  const { data: myPlayer } = useQuery({
    queryKey: ['myPlayer', user?.id],
    queryFn: () => fetchMyPlayer(user!.id),
    enabled: !!user,
  });

  const { data: upcomingMatch } = useQuery({
    queryKey: ['upcomingMatch'],
    queryFn: fetchUpcomingMatch,
  });

  const { data: upcomingTraining } = useQuery({
    queryKey: ['upcomingTraining'],
    queryFn: fetchUpcomingTraining,
  });

  const { data: upcomingEvent } = useQuery({
    queryKey: ['upcomingEvent'],
    queryFn: fetchUpcomingEvent,
  });

  const { data: matchPresence } = useQuery({
    queryKey: ['matchPresence', myPlayer?.id, upcomingMatch?.id],
    queryFn: () => fetchMatchPresence(myPlayer!.id, upcomingMatch!.id),
    enabled: !!myPlayer && !!upcomingMatch,
  });

  const { data: trainingPresence } = useQuery({
    queryKey: ['trainingPresence', myPlayer?.id, upcomingTraining?.id],
    queryFn: () => fetchTrainingPresence(myPlayer!.id, upcomingTraining!.id),
    enabled: !!myPlayer && !!upcomingTraining,
  });

  const { data: eventPresence } = useQuery({
    queryKey: ['eventPresence', myPlayer?.id, upcomingEvent?.id],
    queryFn: () => fetchEventPresence(myPlayer!.id, upcomingEvent!.id),
    enabled: !!myPlayer && !!upcomingEvent,
  });

  if (!user) {
    return null; // This will be handled by ProtectedRoute
  }

  if (!myPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle>Account niet gekoppeld</CardTitle>
            <CardDescription>
              Je account is nog niet gekoppeld aan een speler. Neem contact op met de beheerder.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Welkom {myPlayer.name}</h1>
          <p className="text-muted-foreground">Bekijk je aanwezigheid voor komende activiteiten</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Mijn Wedstrijden */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-primary" />
                  <CardTitle className="text-xl">Mijn Wedstrijden</CardTitle>
                </div>
                {upcomingMatch && (
                  matchPresence && matchPresence.status !== 'UNKNOWN' ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <X className="h-5 w-5 text-red-500" />
                  )
                )}
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                {upcomingMatch ? (
                  matchPresence && matchPresence.status !== 'UNKNOWN' ? (
                    "Aanwezigheid ingesteld voor volgende wedstrijd"
                  ) : (
                    "Nog geen aanwezigheid ingesteld voor volgende wedstrijd"
                  )
                ) : (
                  "Geen komende wedstrijden"
                )}
              </CardDescription>
              <Button asChild className="w-full">
                <Link to="/my-matches">Bekijk Wedstrijden</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Mijn Trainingen */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-6 w-6 text-primary" />
                  <CardTitle className="text-xl">Mijn Trainingen</CardTitle>
                </div>
                {upcomingTraining && (
                  trainingPresence && trainingPresence.status !== 'UNKNOWN' ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <X className="h-5 w-5 text-red-500" />
                  )
                )}
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                {upcomingTraining ? (
                  trainingPresence && trainingPresence.status !== 'UNKNOWN' ? (
                    "Aanwezigheid ingesteld voor volgende training"
                  ) : (
                    "Nog geen aanwezigheid ingesteld voor volgende training"
                  )
                ) : (
                  "Geen komende trainingen"
                )}
              </CardDescription>
              <Button asChild className="w-full">
                <Link to="/my-training">Bekijk Trainingen</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Mijn Evenementen */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-6 w-6 text-primary" />
                  <CardTitle className="text-xl">Mijn Evenementen</CardTitle>
                </div>
                {upcomingEvent && (
                  eventPresence && eventPresence.status !== 'UNKNOWN' ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <X className="h-5 w-5 text-red-500" />
                  )
                )}
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                {upcomingEvent ? (
                  eventPresence && eventPresence.status !== 'UNKNOWN' ? (
                    "Aanwezigheid ingesteld voor volgend evenement"
                  ) : (
                    "Nog geen aanwezigheid ingesteld - ben je soms een feestbreker? 🎉"
                  )
                ) : (
                  "Geen komende evenementen"
                )}
              </CardDescription>
              <Button asChild className="w-full">
                <Link to="/my-events">Bekijk Evenementen</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;