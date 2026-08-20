
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
  user_email?: string;
  knvb_member: boolean;
}

interface UserProfile {
  id: string;
  email: string;
  display_name: string;
}

const PlayerManagement = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all players including their linked account (superuser only)
      const { data: playersData, error: playersError } = await supabase
        .rpc('admin_list_players');

      if (playersError) throw playersError;

      // Fetch all available users from profiles
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, email, display_name')
        .order('display_name');

      if (usersError) throw usersError;

      // Get linked user emails for players
      const playersWithEmails = await Promise.all(
        (playersData || []).map(async (player) => {
          if (player.user_id) {
            const linkedUser = usersData?.find(user => user.id === player.user_id);
            return {
              ...player,
              user_email: linkedUser?.email || 'Email niet beschikbaar'
            };
          }
          return player;
        })
      );
      
      setPlayers(playersWithEmails);
      setAvailableUsers(usersData || []);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching data:', error);
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
      if (import.meta.env.DEV) console.error('Error updating player link:', error);
      toast.error('Kon speler koppeling niet bijwerken');
    }
  };

  const unlinkPlayer = async (playerId: number) => {
    await updatePlayerUserLink(playerId, null);
  };

  const linkPlayerToUser = async (playerId: number, userId: string) => {
    await updatePlayerUserLink(playerId, userId);
  };

  const getAvailableUsersForPlayer = (playerId: number) => {
    // Show only users that are not already linked to other players
    const linkedUserIds = players
      .filter(p => p.id !== playerId && p.user_id)
      .map(p => p.user_id);
    
    return availableUsers.filter(user => !linkedUserIds.includes(user.id));
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
                  {player.knvb_member ? (
                    <Badge variant="default" className="bg-green-600 hover:bg-green-700">KNVB Lid</Badge>
                  ) : (
                    <Badge variant="outline">Geen KNVB Lid</Badge>
                  )}
                  {player.user_id ? (
                    <Badge variant="default">Gekoppeld</Badge>
                  ) : (
                    <Badge variant="secondary">Niet gekoppeld</Badge>
                  )}
                </div>
              </div>
              <CardDescription>
                <div className="space-y-1">
                  <div>
                    {player.user_id 
                      ? `Account gekoppeld: ${player.user_email || 'Email niet beschikbaar'}`
                      : 'Geen account gekoppeld'
                    }
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">KNVB Status:</span> {player.knvb_member ? 'Lid van KNVB - Mag deelnemen aan wedstrijden' : 'Geen KNVB lid - Kan niet deelnemen aan wedstrijden'}
                  </div>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {!player.user_id && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Koppel aan gebruiker:</label>
                    <Select onValueChange={(userId) => linkPlayerToUser(player.id, userId)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer een gebruiker..." />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableUsersForPlayer(player.id).map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.display_name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
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
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PlayerManagement;
