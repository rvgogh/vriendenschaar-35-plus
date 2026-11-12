import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, Trophy, Users, CheckCircle, X, BarChart3, Beer, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/sonner";
import { PlayerStatus, TrainingAttendanceStatus, EventAttendanceStatus } from "@/types";
import { useMyPlayer, useUpcomingMatches, useUpcomingTrainings, useUpcomingEvents, useTodaysTrainings } from "@/hooks/useData";
import { formatDate } from "@/lib/datetime";
import { isOpenToAllPlayers } from "@/lib/matchHelpers";

import TrainingStatusIndicator from "@/components/TrainingStatusIndicator";
import { useGpsVerificationForMultipleTrainings } from "@/hooks/useGpsVerification";
import GpsVerificationButton from "@/components/GpsVerificationButton";
import { useUserRole } from "@/hooks/useUserRole";
import { fetchPlan } from "@/lib/trainingDb";


const fetchMatchesWithPresence = async (playerId: number) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { data: matches, error: matchesError } = await supabase
    .from('matches')
    .select('*')
    .gte('match_date', today.toISOString())
    .order('match_date', { ascending: true })
    .limit(5);

  if (matchesError) throw matchesError;
  
  if (!matches || matches.length === 0) return [];

  const matchIds = matches.map(m => m.id);
  
  const { data: statuses, error: statusesError } = await supabase
    .from('player_statuses')
    .select('match_id, status')
    .eq('player_id', playerId)
    .in('match_id', matchIds);

  if (statusesError) throw statusesError;

  return matches.map(match => ({
    ...match,
    status: statuses?.find(s => s.match_id === match.id)?.status || 'UNKNOWN'
  }));
};

const updateMatchStatus = async (playerId: number, matchId: number, status: PlayerStatus) => {
  const { data: existingStatus } = await supabase
    .from('player_statuses')
    .select('*')
    .eq('player_id', playerId)
    .eq('match_id', matchId)
    .single();

  if (existingStatus) {
    const { error } = await supabase
      .from('player_statuses')
      .update({ status })
      .eq('player_id', playerId)
      .eq('match_id', matchId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('player_statuses')
      .insert({ player_id: playerId, match_id: matchId, status });
    if (error) throw error;
  }
};

const updateTrainingStatus = async (playerId: number, trainingId: number, status: TrainingAttendanceStatus) => {
  const { data: existingStatus } = await supabase
    .from('training_statuses')
    .select('*')
    .eq('player_id', playerId)
    .eq('training_id', trainingId)
    .single();

  if (existingStatus) {
    const { error } = await supabase
      .from('training_statuses')
      .update({ status })
      .eq('player_id', playerId)
      .eq('training_id', trainingId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('training_statuses')
      .insert({ player_id: playerId, training_id: trainingId, status });
    if (error) throw error;
  }
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

const updateEventStatus = async (playerId: number, eventId: number, status: EventAttendanceStatus) => {
  const { data: existingStatus } = await supabase
    .from('event_statuses')
    .select('*')
    .eq('player_id', playerId)
    .eq('event_id', eventId)
    .single();

  if (existingStatus) {
    const { error } = await supabase
      .from('event_statuses')
      .update({ status })
      .eq('player_id', playerId)
      .eq('event_id', eventId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('event_statuses')
      .insert({ player_id: playerId, event_id: eventId, status });
    if (error) throw error;
  }
};

const fetchEventStatusCounts = async (eventId: number) => {
  const { data: statuses, error } = await supabase
    .from('event_statuses')
    .select('status')
    .eq('event_id', eventId);

  if (error) return { yesCount: 0 };
  const yesCount = (statuses || []).filter(s => s.status === 'YES').length;
  return { yesCount };
};

const fetchTrainingStatusCounts = async (trainingId: number) => {
  const { data: statuses, error: statusesError } = await supabase
    .from("training_statuses")
    .select("status")
    .eq("training_id", trainingId);

  if (statusesError) return { yesCount: 0 };

  const yesCount = (statuses || []).filter(s => s.status === 'YES').length;
  return { yesCount };
};

const fetchMatchStatusCounts = async (matchId: number, opponent: string | null) => {
  const openToAll = isOpenToAllPlayers(opponent);
  let q = supabase
    .from("player_statuses")
    .select(`status, players!inner(knvb_member)`)
    .eq("match_id", matchId);
  if (!openToAll) q = q.eq("players.knvb_member", true);
  const { data: statuses, error } = await q;

  if (error) return { inCount: 0 };

  const inCount = (statuses || []).filter(s => s.status === 'IN').length;
  return { inCount };
};

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isSuperuser } = useUserRole();

  const { data: myPlayer } = useMyPlayer(user?.id);
  const { data: upcomingMatches = [] } = useUpcomingMatches();
  const { data: upcomingTrainings = [] } = useUpcomingTrainings();
  const { data: upcomingEvents = [] } = useUpcomingEvents();
  const { data: todaysTrainings = [] } = useTodaysTrainings();

  const { data: matchesWithPresence = [] } = useQuery({
    queryKey: ['matchesWithPresence', myPlayer?.id],
    queryFn: () => fetchMatchesWithPresence(myPlayer!.id),
    enabled: !!myPlayer,
  });

  const { data: myNextBarDuty } = useQuery({
    queryKey: ['myNextBarDuty', myPlayer?.id],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from('bar_duties')
        .select('*')
        .gte('duty_date', today.toISOString().split('T')[0])
        .or(`player_one_id.eq.${myPlayer!.id},player_two_id.eq.${myPlayer!.id}`)
        .order('duty_date', { ascending: true })
        .limit(1);
      if (error) throw error;
      const duty = data?.[0];
      if (!duty) return null;
      const partnerId = duty.player_one_id === myPlayer!.id ? duty.player_two_id : duty.player_one_id;
      const { data: partner } = await supabase.from('players').select('name').eq('id', partnerId).single();
      return { ...duty, partnerName: partner?.name ?? 'Onbekende speler' };
    },
    enabled: !!myPlayer,
  });

  const upcomingTraining = upcomingTrainings[0];
  const upcomingEvent = upcomingEvents[0];

  // GPS verification for today's trainings - use todaysTrainings which includes trainings after their start time
  const todaysTraining = todaysTrainings[0];
  const trainingIdsToVerify = todaysTraining ? [todaysTraining.id] : [];
  
  // Check if GPS button should be visible (training day between 19:00 and 23:00, or always for superusers)
  const now = new Date();
  const currentHour = now.getHours();
  const isWithinTimeWindow = currentHour >= 19 && currentHour < 23;
  const showGpsButton = todaysTraining && (isWithinTimeWindow || isSuperuser);
  
  useGpsVerificationForMultipleTrainings(
    trainingIdsToVerify,
    myPlayer?.id ?? null,
    !!myPlayer,
    () => toast.success("Aanwezigheid automatisch geregistreerd via GPS! 📍")
  );

  // Programma van de komende training: alleen zichtbaar als de trainer het gepubliceerd heeft.
  // Fouten (bijvoorbeeld als de tabellen nog niet bestaan) verbergen de knop zonder melding.
  const { data: publishedPlan } = useQuery({
    queryKey: ['publishedPlan', upcomingTraining?.id],
    queryFn: async () => {
      const plan = await fetchPlan(upcomingTraining!.id);
      return plan?.status === 'published' ? plan : null;
    },
    enabled: !!upcomingTraining,
    retry: false,
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

  const { data: eventStatusCounts } = useQuery({
    queryKey: ['eventStatusCounts', upcomingEvent?.id],
    queryFn: () => fetchEventStatusCounts(upcomingEvent!.id),
    enabled: !!upcomingEvent,
  });

  const { data: trainingStatusCounts } = useQuery({
    queryKey: ['trainingStatusCounts', upcomingTraining?.id],
    queryFn: () => fetchTrainingStatusCounts(upcomingTraining!.id),
    enabled: !!upcomingTraining,
  });

  const { data: matchStatusCountsMap } = useQuery({
    queryKey: ['matchStatusCountsMap', matchesWithPresence],
    queryFn: async () => {
      const countsMap = new Map();
      for (const match of matchesWithPresence) {
        const counts = await fetchMatchStatusCounts(match.id, match.opponent);
        countsMap.set(match.id, counts);
      }
      return countsMap;
    },
    enabled: matchesWithPresence.length > 0,
  });

  const matchStatusMutation = useMutation({
    mutationFn: ({ matchId, status }: { matchId: number, status: PlayerStatus }) =>
      updateMatchStatus(myPlayer!.id, matchId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matchesWithPresence'] });
      toast.success("Je aanwezigheid voor de wedstrijd is bijgewerkt.");
    },
    onError: () => {
      toast.error("Er is een fout opgetreden bij het bijwerken van je status.");
    },
  });

  const trainingStatusMutation = useMutation({
    mutationFn: ({ status }: { status: TrainingAttendanceStatus }) =>
      updateTrainingStatus(myPlayer!.id, upcomingTraining!.id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainingPresence'] });
      toast.success("Je aanwezigheid voor de training is bijgewerkt.");
    },
    onError: () => {
      toast.error("Er is een fout opgetreden bij het bijwerken van je status.");
    },
  });

  const handleMatchStatusChange = (matchId: number, status: PlayerStatus) => {
    matchStatusMutation.mutate({ matchId, status });
  };

  const handleTrainingStatusChange = (status: TrainingAttendanceStatus) => {
    trainingStatusMutation.mutate({ status });
  };

  const eventStatusMutation = useMutation({
    mutationFn: ({ status }: { status: EventAttendanceStatus }) =>
      updateEventStatus(myPlayer!.id, upcomingEvent!.id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventPresence'] });
      queryClient.invalidateQueries({ queryKey: ['eventStatusCounts'] });
      toast.success("Je aanwezigheid voor het evenement is bijgewerkt.");
    },
    onError: () => {
      toast.error("Er is een fout opgetreden bij het bijwerken van je status.");
    },
  });

  const handleEventStatusChange = (status: EventAttendanceStatus) => {
    eventStatusMutation.mutate({ status });
  };

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

        {/* GPS Verification Button - visible on training days 19:00-23:00 */}
        {showGpsButton && myPlayer && todaysTraining && (
          <div className="mb-6">
            <GpsVerificationButton 
              trainingId={todaysTraining.id} 
              playerId={myPlayer.id} 
            />
          </div>
        )}

        {/* Bardienst card - always visible; shows upcoming duty or that none is planned */}
        <Card
          className="mb-6 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/bardiensten')}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Beer className="h-6 w-6 text-primary" />
              <CardTitle className="text-xl">Bardienst</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {myNextBarDuty ? (
              <>
                <p className="font-medium">
                  {new Date(`${myNextBarDuty.duty_date}T12:00:00`).toLocaleDateString('nl-NL', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </p>
                <p className="text-sm text-muted-foreground">
                  Na de training · samen met {myNextBarDuty.partnerName}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Je hebt geen aankomende bardienst. Bekijk de volledige indeling van dit seizoen.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Mijn Trainingen */}
          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate('/my-training')}
          >
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
              {upcomingTraining ? (
                <div className="space-y-3">
                  <div className="border rounded-lg p-3 bg-secondary/20">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <p className="font-medium text-sm">Volgende Training</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(upcomingTraining.training_at).toLocaleDateString('nl-NL', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button 
                          variant='outline'
                          size="sm" 
                          onClick={() => handleTrainingStatusChange(trainingPresence?.status === 'YES' ? 'UNKNOWN' : 'YES')}
                          className={cn("text-lg w-8 h-8 p-0", trainingPresence?.status === 'YES' && "ring-2 ring-primary")}
                        >
                          🍆
                        </Button>
                        <Button 
                          variant='outline'
                          size="sm" 
                          onClick={() => handleTrainingStatusChange(trainingPresence?.status === 'NO' ? 'UNKNOWN' : 'NO')}
                          className={cn("text-lg w-8 h-8 p-0", trainingPresence?.status === 'NO' && "ring-2 ring-destructive")}
                        >
                          ❌
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {trainingStatusCounts?.yesCount || 0} speler(s) aanwezig
                        </span>
                        <TrainingStatusIndicator yesCount={trainingStatusCounts?.yesCount || 0} />
                      </div>
                    </div>
                  </div>
                  {publishedPlan && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <Button asChild variant="outline" className="w-full">
                        <Link to={`/training/${upcomingTraining.id}`}>
                          <ClipboardList className="mr-2 h-4 w-4" />
                          Programma bekijken
                        </Link>
                      </Button>
                    </div>
                  )}
                  <div onClick={(e) => e.stopPropagation()}>
                    <Button asChild className="w-full">
                      <Link to="/my-training">Alle Trainingen</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <CardDescription className="mb-4">Geen komende trainingen</CardDescription>
                  <div onClick={(e) => e.stopPropagation()}>
                    <Button asChild className="w-full">
                      <Link to="/my-training">Bekijk Trainingen</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mijn Wedstrijden */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-primary" />
                  <CardTitle className="text-xl">Mijn Wedstrijden</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {matchesWithPresence.length > 0 ? (
                <div className="space-y-3">
                  {matchesWithPresence.map((match) => {
                    const matchCounts = matchStatusCountsMap?.get(match.id) || { inCount: 0 };
                    const inCount = matchCounts.inCount;
                    const needed = 7;
                    const hasEnough = inCount >= needed;
                    
                    return (
                      <div 
                        key={match.id} 
                        className="border rounded-lg p-3 bg-secondary/20 cursor-pointer hover:bg-secondary/30 transition-colors"
                        onClick={() => navigate('/my-matches')}
                      >
                        <div className="flex flex-wrap gap-2 items-center mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{match.opponent}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(match.match_date)}</p>
                          </div>
                          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button 
                              variant='outline'
                              size="sm" 
                              onClick={() => handleMatchStatusChange(match.id, match.status === 'IN' ? 'UNKNOWN' : 'IN')}
                              className={cn("text-lg w-8 h-8 p-0", match.status === 'IN' && "ring-2 ring-primary")}
                            >
                              🍆
                            </Button>
                            <Button 
                              variant='outline'
                              size="sm" 
                              onClick={() => handleMatchStatusChange(match.id, match.status === 'MAYBE' ? 'UNKNOWN' : 'MAYBE')}
                              className={cn("text-lg w-8 h-8 p-0", match.status === 'MAYBE' && "ring-2 ring-yellow-400")}
                            >
                              ❓
                            </Button>
                            <Button 
                              variant='outline'
                              size="sm" 
                              onClick={() => handleMatchStatusChange(match.id, match.status === 'OUT' ? 'UNKNOWN' : 'OUT')}
                              className={cn("text-lg w-8 h-8 p-0", match.status === 'OUT' && "ring-2 ring-destructive")}
                            >
                              ❌
                            </Button>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              {inCount} speler(s) beschikbaar
                            </span>
                            {hasEnough ? (
                              <div className="text-xs font-medium text-green-600 dark:text-green-400">
                                Wedstrijd gaat door!
                              </div>
                            ) : (
                              <div className="text-xs font-medium text-red-600 dark:text-red-400">
                                Nog {needed - inCount} speler(s) nodig
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div onClick={(e) => e.stopPropagation()}>
                    <Button asChild className="w-full mt-3">
                      <Link to="/my-matches">Alle Wedstrijden</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <CardDescription className="mb-4">Geen komende wedstrijden</CardDescription>
                  <div onClick={(e) => e.stopPropagation()}>
                    <Button asChild className="w-full">
                      <Link to="/my-matches">Bekijk Wedstrijden</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mijn Evenementen */}
          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate('/my-events')}
          >
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
              {upcomingEvent ? (
                <div className="space-y-3">
                  <div className="border rounded-lg p-3 bg-secondary/20">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <p className="font-medium text-sm">{upcomingEvent.title}</p>
                        {upcomingEvent.subtitle && (
                          <p className="text-xs text-muted-foreground">{upcomingEvent.subtitle}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {upcomingEvent.event_date && new Date(upcomingEvent.event_date + 'T00:00:00').toLocaleDateString('nl-NL', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                          {upcomingEvent.event_time && ` om ${upcomingEvent.event_time.slice(0, 5)}`}
                        </p>
                        {upcomingEvent.location && (
                          <p className="text-xs text-muted-foreground">📍 {upcomingEvent.location}</p>
                        )}
                      </div>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button 
                          variant='outline'
                          size="sm" 
                          onClick={() => handleEventStatusChange(eventPresence?.status === 'YES' ? 'UNKNOWN' : 'YES')}
                          className={cn("text-lg w-8 h-8 p-0", eventPresence?.status === 'YES' && "ring-2 ring-primary")}
                        >
                          🍆
                        </Button>
                        <Button 
                          variant='outline'
                          size="sm" 
                          onClick={() => handleEventStatusChange(eventPresence?.status === 'MAYBE' ? 'UNKNOWN' : 'MAYBE')}
                          className={cn("text-lg w-8 h-8 p-0", eventPresence?.status === 'MAYBE' && "ring-2 ring-yellow-400")}
                        >
                          ❓
                        </Button>
                        <Button 
                          variant='outline'
                          size="sm" 
                          onClick={() => handleEventStatusChange(eventPresence?.status === 'NO' ? 'UNKNOWN' : 'NO')}
                          className={cn("text-lg w-8 h-8 p-0", eventPresence?.status === 'NO' && "ring-2 ring-destructive")}
                        >
                          ❌
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t">
                      <span className="text-sm text-muted-foreground">
                        {eventStatusCounts?.yesCount || 0} speler(s) aanwezig
                      </span>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <Button asChild className="w-full">
                      <Link to="/my-events">Alle Evenementen</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <CardDescription className="mb-4">Geen komende evenementen</CardDescription>
                  <div onClick={(e) => e.stopPropagation()}>
                    <Button asChild className="w-full">
                      <Link to="/my-events">Bekijk Evenementen</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seizoensstatistieken */}
          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate('/admin/statistics')}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-primary" />
                <CardTitle className="text-xl">Seizoensstatistieken</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Bekijk de statistieken van Najaars competitie '25
              </CardDescription>
              <Button className="w-full">
                Bekijk Statistieken
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;