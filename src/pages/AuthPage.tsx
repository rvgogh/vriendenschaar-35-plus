import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Player } from '@/types';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchAvailablePlayers();
    
    // Handle email verification redirect
    const handleEmailVerification = async () => {
      const token = searchParams.get('token');
      const type = searchParams.get('type');
      
      if (token && type === 'email') {
        try {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'email'
          });
          
          if (error) {
            console.error('Email verification error:', error);
            toast.error('Email verificatie mislukt: ' + error.message);
          } else {
            toast.success('Email succesvol geverifieerd!');
            navigate('/');
          }
        } catch (error) {
          console.error('Email verification error:', error);
          toast.error('Email verificatie mislukt');
        }
      }
    };

    handleEmailVerification();
  }, [searchParams, navigate]);

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
      // Use the correct production URL for email redirect
      const redirectUrl = 'https://vriendenschaar-35-plus.lovable.app/';
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            player_id: selectedPlayerId
          }
        }
      });

      if (error) throw error;

      // De user wordt altijd aangemaakt, ook als email verificatie vereist is
      // We gebruiken de user ID uit de response om de koppeling te maken
      if (data.user?.id) {
        console.log('Koppeling speler', selectedPlayerId, 'aan user', data.user.id);
        
        const { error: playerError } = await supabase
          .from('players')
          .update({ user_id: data.user.id })
          .eq('id', parseInt(selectedPlayerId));

        if (playerError) {
          console.error('Player linking error:', playerError);
          toast.error('Fout bij koppelen speler: ' + playerError.message);
        } else {
          console.log('Speler succesvol gekoppeld aan account');
          toast.success('Account succesvol aangemaakt! Check je email voor bevestiging.');
          // Refresh de beschikbare spelers lijst
          fetchAvailablePlayers();
          // Reset de form
          setSelectedPlayerId('');
          setEmail('');
          setPassword('');
        }
      } else {
        console.error('Geen user ID ontvangen van Supabase');
        toast.error('Account aangemaakt maar speler koppeling mislukt');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
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
