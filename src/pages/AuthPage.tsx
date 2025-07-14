
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import { useNavigate } from 'react-router-dom';
import { Player } from '@/types';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAvailablePlayers();
  }, []);

  const fetchAvailablePlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .is('user_id', null)
        .order('name');
      
      if (error) throw error;
      setPlayers(data || []);
    } catch (error) {
      console.error('Error fetching players:', error);
      toast.error('Kon spelers niet laden');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success('Succesvol ingelogd!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Inloggen mislukt');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerId) {
      toast.error('Selecteer een speler uit de lijst');
      return;
    }

    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) throw error;

      if (data.user) {
        // Koppel de gebruiker aan de geselecteerde speler
        const { error: playerError } = await supabase
          .from('players')
          .update({ user_id: data.user.id })
          .eq('id', selectedPlayerId);

        if (playerError) throw playerError;

        toast.success('Account succesvol aangemaakt! Check je email voor bevestiging.');
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.message || 'Registratie mislukt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">
            {isLogin ? 'Inloggen' : 'Registreren'}
          </CardTitle>
          <CardDescription>
            {isLogin 
              ? 'Log in met je account om door te gaan' 
              : 'Maak een account aan om toegang te krijgen'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Wachtwoord</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="player">Selecteer je naam</Label>
                <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kies je naam uit de lijst" />
                  </SelectTrigger>
                  <SelectContent>
                    {players.map((player) => (
                      <SelectItem key={player.id} value={player.id.toString()}>
                        {player.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Bezig...' : (isLogin ? 'Inloggen' : 'Registreren')}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm"
            >
              {isLogin 
                ? 'Nog geen account? Registreer hier' 
                : 'Al een account? Log hier in'
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
