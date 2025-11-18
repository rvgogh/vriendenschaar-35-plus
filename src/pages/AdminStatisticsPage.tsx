import React, { useState } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageLoading } from '@/components/PageLoading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Season } from '@/types/database';

const COLORS = {
  IN: 'hsl(142 71% 45%)',
  YES: 'hsl(142 71% 45%)',
  OUT: 'hsl(0 84% 60%)',
  NO: 'hsl(0 84% 60%)',
  MAYBE: 'hsl(45 93% 47%)',
  UNKNOWN: 'hsl(215 20% 65%)',
};

const AdminStatisticsPage = () => {
  const { role, loading: roleLoading } = useUserRole();
  const { user } = useAuth();
  const [showAllMatches, setShowAllMatches] = useState(false);
  const [showAllTrainings, setShowAllTrainings] = useState(false);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('all');

  // Fetch all seasons
  const { data: seasons, isLoading: seasonsLoading } = useQuery({
    queryKey: ['seasons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .order('start_date', { ascending: true });
      if (error) throw error;
      return data as Season[];
    },
    enabled: !!user,
  });

  // Fetch past matches
  const { data: pastMatches, isLoading: matchesLoading } = useQuery({
    queryKey: ['pastMatches', selectedSeasonId],
    queryFn: async () => {
      let query = supabase
        .from('matches')
        .select('id')
        .lt('match_date', new Date().toISOString())
        .order('match_date', { ascending: false });
      
      if (selectedSeasonId !== 'all') {
        query = query.eq('season_id', parseInt(selectedSeasonId));
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch past trainings
  const { data: pastTrainings, isLoading: trainingsLoading } = useQuery({
    queryKey: ['pastTrainings', selectedSeasonId],
    queryFn: async () => {
      let query = supabase
        .from('trainings')
        .select('id')
        .lt('training_at', new Date().toISOString())
        .order('training_at', { ascending: false });
      
      if (selectedSeasonId !== 'all') {
        query = query.eq('season_id', parseInt(selectedSeasonId));
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch past events
  const { data: pastEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ['pastEvents', selectedSeasonId],
    queryFn: async () => {
      let query = supabase
        .from('events')
        .select('id')
        .lt('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: false });
      
      if (selectedSeasonId !== 'all') {
        // @ts-ignore - season_id column exists but types not yet regenerated
        query = query.eq('season_id', parseInt(selectedSeasonId));
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch all players
  const { data: allPlayers, isLoading: playersLoading } = useQuery({
    queryKey: ['allPlayers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('players')
        .select('id, name, knvb_member')
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch match statuses for past matches
  const { data: matchStats, isLoading: matchStatsLoading } = useQuery({
    queryKey: ['matchStatistics', pastMatches],
    queryFn: async () => {
      if (!pastMatches?.length) return [];
      const { data, error } = await supabase
        .from('player_statuses')
        .select(`
          status,
          player_id,
          match_id,
          players!inner(name)
        `)
        .in('match_id', pastMatches.map(m => m.id));
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!pastMatches,
  });

  // Fetch training statuses for past trainings
  const { data: trainingStats, isLoading: trainingStatsLoading } = useQuery({
    queryKey: ['trainingStatistics', pastTrainings],
    queryFn: async () => {
      if (!pastTrainings?.length) return [];
      const { data, error } = await supabase
        .from('training_statuses')
        .select(`
          status,
          player_id,
          training_id,
          players!inner(name)
        `)
        .in('training_id', pastTrainings.map(t => t.id));
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!pastTrainings,
  });

  // Fetch event statuses for past events
  const { data: eventStats, isLoading: eventStatsLoading } = useQuery({
    queryKey: ['eventStatistics', pastEvents],
    queryFn: async () => {
      if (!pastEvents?.length) return [];
      const { data, error } = await supabase
        .from('event_statuses')
        .select(`
          status,
          player_id,
          event_id,
          players!inner(name)
        `)
        .in('event_id', pastEvents.map(e => e.id));
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!pastEvents,
  });

  if (roleLoading) {
    return <PageLoading message="Laden..." />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (matchesLoading || trainingsLoading || eventsLoading || playersLoading || matchStatsLoading || trainingStatsLoading || eventStatsLoading || seasonsLoading) {
    return <PageLoading message="Statistieken laden..." />;
  }

  // Calculate statistics
  const calculateStatusCounts = (data: any[], totalEvents: number, totalPlayers: number) => {
    const counts: Record<string, number> = {};
    data?.forEach(item => {
      counts[item.status] = (counts[item.status] || 0) + 1;
    });
    
    // Calculate UNKNOWN as total possible responses minus actual responses
    const totalResponses = Object.values(counts).reduce((sum, count) => sum + count, 0);
    const totalPossible = totalEvents * totalPlayers;
    counts['UNKNOWN'] = totalPossible - totalResponses;
    
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  const calculatePlayerAttendance = (
    statusData: any[], 
    allPlayers: any[], 
    totalEvents: number,
    positiveStatuses: string[]
  ) => {
    const playerMap: Record<number, { name: string; total: number; attended: number }> = {};
    
    // Initialize all players with total count
    allPlayers?.forEach(player => {
      playerMap[player.id] = { 
        name: player.name, 
        total: totalEvents, 
        attended: 0 
      };
    });
    
    // Count attended events
    statusData?.forEach(item => {
      const playerId = item.player_id;
      if (playerMap[playerId] && positiveStatuses.includes(item.status)) {
        playerMap[playerId].attended += 1;
      }
    });

    return Object.values(playerMap)
      .map(p => ({
        name: p.name,
        percentage: p.total > 0 ? Math.round((p.attended / p.total) * 100) : 0,
        attended: p.attended,
        total: p.total,
      }))
      .sort((a, b) => b.percentage - a.percentage);
  };

  // Count KNVB members for match stats only
  const knvbMemberCount = allPlayers?.filter(p => p.knvb_member).length || 0;
  
  const matchStatusData = calculateStatusCounts(
    matchStats || [], 
    pastMatches?.length || 0, 
    knvbMemberCount
  );
  const trainingStatusData = calculateStatusCounts(
    trainingStats || [], 
    pastTrainings?.length || 0, 
    allPlayers?.length || 0
  );
  const eventStatusData = calculateStatusCounts(
    eventStats || [], 
    pastEvents?.length || 0, 
    allPlayers?.length || 0
  );

  // Only KNVB members for match attendance
  const knvbPlayers = allPlayers?.filter(p => p.knvb_member) || [];
  
  const matchPlayerAttendance = calculatePlayerAttendance(
    matchStats || [], 
    knvbPlayers, 
    pastMatches?.length || 0,
    ['IN']
  );
  const trainingPlayerAttendance = calculatePlayerAttendance(
    trainingStats || [], 
    allPlayers || [], 
    pastTrainings?.length || 0,
    ['YES']
  );
  const eventPlayerAttendance = calculatePlayerAttendance(
    eventStats || [], 
    allPlayers || [], 
    pastEvents?.length || 0,
    ['YES']
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <h1 className="text-4xl font-bold text-primary">Aanwezigheid Statistieken</h1>
          </div>
          <p className="text-muted-foreground">Overzicht van speler aanwezigheid voor wedstrijden, trainingen en evenementen</p>
        </div>

        {/* Season Selector */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filter op Seizoen</CardTitle>
            <CardDescription>Selecteer een seizoen om de statistieken te filteren</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
              <SelectTrigger className="w-full md:w-[300px] bg-background">
                <SelectValue placeholder="Selecteer een seizoen" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all">Alle seizoenen</SelectItem>
                {seasons?.map((season) => (
                  <SelectItem key={season.id} value={season.id.toString()}>
                    {season.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>


        {/* Stacked Bar Chart - Total Attendance */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Totale Aanwezigheid per Speler</CardTitle>
            <CardDescription>Gecombineerde aanwezigheid voor wedstrijden, trainingen en evenementen (gesorteerd van hoog naar laag)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={600}>
              <BarChart
                data={allPlayers?.map(player => {
                  const matchData = matchPlayerAttendance.find(p => p.name === player.name);
                  const trainingData = trainingPlayerAttendance.find(p => p.name === player.name);
                  const eventData = eventPlayerAttendance.find(p => p.name === player.name);
                  
                  // Only count match attendance for KNVB members
                  const matchAttended = player.knvb_member ? (matchData?.attended || 0) : 0;
                  const trainingAttended = trainingData?.attended || 0;
                  const eventAttended = eventData?.attended || 0;
                  
                  return {
                    name: player.name,
                    Wedstrijden: matchAttended,
                    Trainingen: trainingAttended,
                    Evenementen: eventAttended,
                    total: matchAttended + trainingAttended + eventAttended
                  };
                }).sort((a, b) => b.total - a.total) || []}
                layout="vertical"
                margin={{ left: 5, right: 20, top: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" label={{ value: 'Aantal Aanwezigheden', position: 'insideBottom', offset: -5 }} />
                <YAxis type="category" dataKey="name" width={90} interval={0} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Wedstrijden" stackId="a" fill="hsl(221 83% 53%)" />
                <Bar dataKey="Trainingen" stackId="a" fill="hsl(142 71% 45%)" />
                <Bar dataKey="Evenementen" stackId="a" fill="hsl(280 65% 60%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Player Attendance Tables */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Wedstrijd Aanwezigheid per Speler</CardTitle>
              <CardDescription>Spelers op basis van aanwezigheid percentage</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Speler</TableHead>
                    <TableHead className="text-right">%</TableHead>
                    <TableHead className="text-right">Aantal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(showAllMatches ? matchPlayerAttendance : matchPlayerAttendance.slice(0, 10)).map((player) => (
                    <TableRow key={player.name}>
                      <TableCell className="font-medium">{player.name}</TableCell>
                      <TableCell className="text-right">{player.percentage}%</TableCell>
                      <TableCell className="text-right">{player.attended}/{player.total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {matchPlayerAttendance.length > 10 && (
                <div className="mt-4 text-center">
                  <Button
                    variant="outline"
                    onClick={() => setShowAllMatches(!showAllMatches)}
                  >
                    {showAllMatches ? 'Toon minder' : 'Toon alle spelers'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Training Aanwezigheid per Speler</CardTitle>
              <CardDescription>Spelers op basis van aanwezigheid percentage</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Speler</TableHead>
                    <TableHead className="text-right">%</TableHead>
                    <TableHead className="text-right">Aantal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(showAllTrainings ? trainingPlayerAttendance : trainingPlayerAttendance.slice(0, 10)).map((player) => (
                    <TableRow key={player.name}>
                      <TableCell className="font-medium">{player.name}</TableCell>
                      <TableCell className="text-right">{player.percentage}%</TableCell>
                      <TableCell className="text-right">{player.attended}/{player.total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {trainingPlayerAttendance.length > 10 && (
                <div className="mt-4 text-center">
                  <Button
                    variant="outline"
                    onClick={() => setShowAllTrainings(!showAllTrainings)}
                  >
                    {showAllTrainings ? 'Toon minder' : 'Toon alle spelers'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Evenement Aanwezigheid per Speler</CardTitle>
              <CardDescription>Spelers op basis van aanwezigheid percentage</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Speler</TableHead>
                    <TableHead className="text-right">%</TableHead>
                    <TableHead className="text-right">Aantal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(showAllEvents ? eventPlayerAttendance : eventPlayerAttendance.slice(0, 10)).map((player) => (
                    <TableRow key={player.name}>
                      <TableCell className="font-medium">{player.name}</TableCell>
                      <TableCell className="text-right">{player.percentage}%</TableCell>
                      <TableCell className="text-right">{player.attended}/{player.total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {eventPlayerAttendance.length > 10 && (
                <div className="mt-4 text-center">
                  <Button
                    variant="outline"
                    onClick={() => setShowAllEvents(!showAllEvents)}
                  >
                    {showAllEvents ? 'Toon minder' : 'Toon alle spelers'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Status Distribution Charts */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Wedstrijd Status</CardTitle>
              <CardDescription>Verdeling van aanwezigheid statussen</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={matchStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="hsl(var(--foreground))"
                    dataKey="value"
                  >
                    {matchStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || COLORS.UNKNOWN} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Training Status</CardTitle>
              <CardDescription>Verdeling van aanwezigheid statussen</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={trainingStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="hsl(var(--foreground))"
                    dataKey="value"
                  >
                    {trainingStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || COLORS.UNKNOWN} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Evenement Status</CardTitle>
              <CardDescription>Verdeling van aanwezigheid statussen</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={eventStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="hsl(var(--foreground))"
                    dataKey="value"
                  >
                    {eventStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || COLORS.UNKNOWN} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminStatisticsPage;
