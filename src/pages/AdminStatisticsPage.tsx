import React from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageLoading } from '@/components/PageLoading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart3 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const COLORS = {
  IN: 'hsl(var(--chart-1))',
  YES: 'hsl(var(--chart-1))',
  OUT: 'hsl(var(--chart-2))',
  NO: 'hsl(var(--chart-2))',
  MAYBE: 'hsl(var(--chart-3))',
  UNKNOWN: 'hsl(var(--chart-4))',
};

const AdminStatisticsPage = () => {
  const { role, loading: roleLoading } = useUserRole();

  // Fetch past matches
  const { data: pastMatches, isLoading: matchesLoading } = useQuery({
    queryKey: ['pastMatches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select('id')
        .lt('match_date', new Date().toISOString())
        .order('match_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: role === 'superuser',
  });

  // Fetch past trainings
  const { data: pastTrainings, isLoading: trainingsLoading } = useQuery({
    queryKey: ['pastTrainings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trainings')
        .select('id')
        .lt('training_at', new Date().toISOString())
        .order('training_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: role === 'superuser',
  });

  // Fetch past events
  const { data: pastEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ['pastEvents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id')
        .lt('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: role === 'superuser',
  });

  // Fetch all players
  const { data: allPlayers, isLoading: playersLoading } = useQuery({
    queryKey: ['allPlayers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('players')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: role === 'superuser',
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
    enabled: role === 'superuser' && !!pastMatches,
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
    enabled: role === 'superuser' && !!pastTrainings,
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
    enabled: role === 'superuser' && !!pastEvents,
  });

  if (roleLoading) {
    return <PageLoading message="Laden..." />;
  }

  if (role !== 'superuser') {
    return <Navigate to="/" replace />;
  }

  if (matchesLoading || trainingsLoading || eventsLoading || playersLoading || matchStatsLoading || trainingStatsLoading || eventStatsLoading) {
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

  const matchStatusData = calculateStatusCounts(
    matchStats || [], 
    pastMatches?.length || 0, 
    allPlayers?.length || 0
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

  const matchPlayerAttendance = calculatePlayerAttendance(
    matchStats || [], 
    allPlayers || [], 
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
                    fill="#8884d8"
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
                    fill="#8884d8"
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
                    fill="#8884d8"
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

        {/* Player Attendance Tables */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Wedstrijd Aanwezigheid per Speler</CardTitle>
              <CardDescription>Top spelers op basis van aanwezigheid percentage</CardDescription>
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
                  {matchPlayerAttendance.slice(0, 10).map((player) => (
                    <TableRow key={player.name}>
                      <TableCell className="font-medium">{player.name}</TableCell>
                      <TableCell className="text-right">{player.percentage}%</TableCell>
                      <TableCell className="text-right">{player.attended}/{player.total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Training Aanwezigheid per Speler</CardTitle>
              <CardDescription>Top spelers op basis van aanwezigheid percentage</CardDescription>
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
                  {trainingPlayerAttendance.slice(0, 10).map((player) => (
                    <TableRow key={player.name}>
                      <TableCell className="font-medium">{player.name}</TableCell>
                      <TableCell className="text-right">{player.percentage}%</TableCell>
                      <TableCell className="text-right">{player.attended}/{player.total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Evenement Aanwezigheid per Speler</CardTitle>
              <CardDescription>Top spelers op basis van aanwezigheid percentage</CardDescription>
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
                  {eventPlayerAttendance.slice(0, 10).map((player) => (
                    <TableRow key={player.name}>
                      <TableCell className="font-medium">{player.name}</TableCell>
                      <TableCell className="text-right">{player.percentage}%</TableCell>
                      <TableCell className="text-right">{player.attended}/{player.total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Bar Chart Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Spelers - Aanwezigheid Percentage</CardTitle>
            <CardDescription>Vergelijking van aanwezigheid percentages tussen wedstrijden, trainingen en evenementen</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={matchPlayerAttendance.slice(0, 10).map((player, i) => ({
                  name: player.name,
                  Wedstrijden: player.percentage,
                  Trainingen: trainingPlayerAttendance.find(p => p.name === player.name)?.percentage || 0,
                  Evenementen: eventPlayerAttendance.find(p => p.name === player.name)?.percentage || 0,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis label={{ value: 'Aanwezigheid %', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Wedstrijden" fill="hsl(var(--chart-1))" />
                <Bar dataKey="Trainingen" fill="hsl(var(--chart-2))" />
                <Bar dataKey="Evenementen" fill="hsl(var(--chart-3))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminStatisticsPage;
