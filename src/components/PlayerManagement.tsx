
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/sonner';
import { User, Settings } from 'lucide-react';

interface Player {
  id: number;
  name: string;
  user_id: string | null;
}

interface UserData {
  id: string;
  email: string;
}

const PlayerManagement = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all players
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .order('name');

      if (playersError) throw playersError;

      // Fetch all users from auth (we can't query auth.users directly, so we get them from user_roles)
      const { data: userRolesData, error: userRolesError } = await supabase
        .from('user_roles')
        .select('user_id');

      if (userRolesError) throw userRolesError;

      // For demonstration, we'll show users by their linked players
      // In a real scenario, you might want to create a profiles table
      setPlayers(playersData || []);
      setUsers([]); // We'll populate this differently
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Kon data niet laden');
    } finally {
      setLoading(false);
    }
  };

  const updatePlayerUserLink = async (playerId: number, userId: string | null) => {
    try {
      const { error } = await supabase
        .from('players')
        .update({ user_id: userId })
        .eq('id', playerId);

      if (error) throw error;

      toast.success('Speler koppeling succesvol bijgewerkt');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error updating player link:', error);
      toast.error('Kon speler koppeling niet bijwerken');
    }
  };

  const unlinkPlayer = async (playerId: number) => {
    await updatePlayerUserLink(playerId, null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Speler Beheer</h2>
      </div>

      <div className="grid gap-4">
        {players.map((player) => (
          <Card key={player.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <CardTitle className="text-lg">{player.name}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  {player.user_id ? (
                    <Badge variant="default">Gekoppeld</Badge>
                  ) : (
                    <Badge variant="secondary">Niet gekoppeld</Badge>
                  )}
                </div>
              </div>
              <CardDescription>
                {player.user_id 
                  ? `Account gekoppeld aan: ${player.user_id}`
                  : 'Geen account gekoppeld'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {player.user_id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => unlinkPlayer(player.id)}
                  >
                    Ontkoppel Account
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                >
                  Handmatig Koppelen (Binnenkort beschikbaar)
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PlayerManagement;
