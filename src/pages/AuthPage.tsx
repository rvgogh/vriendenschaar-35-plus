import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    
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
    setLoading(true);

    try {
      // Use the correct production URL for email redirect
      const redirectUrl = 'https://vriendenschaar-35-plus.lovable.app/';
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) throw error;

      toast.success('Account succesvol aangemaakt! Check je email voor bevestiging.');
      // Reset de form
      setEmail('');
      setPassword('');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registratie mislukt');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const redirectUrl = 'https://vriendenschaar-35-plus.lovable.app/';
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });

      if (error) throw error;

      toast.success('Wachtwoord reset email verzonden! Check je inbox.');
      setIsForgotPassword(false);
      setIsLogin(true);
    } catch (error: any) {
      toast.error(error.message || 'Kon wachtwoord reset email niet verzenden');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (isForgotPassword) return 'Wachtwoord vergeten';
    return isLogin ? 'Inloggen' : 'Registreren';
  };

  const getDescription = () => {
    if (isForgotPassword) return 'Voer je email in om je wachtwoord te resetten';
    return isLogin 
      ? 'Log in met je account om door te gaan' 
      : 'Maak een account aan om toegang te krijgen';
  };

  const getSubmitHandler = () => {
    if (isForgotPassword) return handleForgotPassword;
    return isLogin ? handleLogin : handleRegister;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">
            {getTitle()}
          </CardTitle>
          <CardDescription>
            {getDescription()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={getSubmitHandler()} className="space-y-4">
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
            
            {!isForgotPassword && (
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
            )}


            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Bezig...' : (
                isForgotPassword ? 'Reset wachtwoord' : 
                (isLogin ? 'Inloggen' : 'Registreren')
              )}
            </Button>
          </form>

          <div className="mt-4 text-center space-y-2">
            {!isForgotPassword && (
              <>
                {isLogin && (
                  <Button
                    variant="link"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-sm w-full"
                  >
                    Wachtwoord vergeten?
                  </Button>
                )}
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
              </>
            )}
            
            {isForgotPassword && (
              <Button
                variant="link"
                onClick={() => {
                  setIsForgotPassword(false);
                  setIsLogin(true);
                }}
                className="text-sm"
              >
                Terug naar inloggen
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
