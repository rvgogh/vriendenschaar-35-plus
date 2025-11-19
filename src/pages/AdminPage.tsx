
import React, { useState } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { Navigate } from 'react-router-dom';
import PlayerManagement from '@/components/PlayerManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Users, Settings, Home, Trophy, Calendar, Dumbbell, BarChart3, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageLoading } from '@/components/PageLoading';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const AdminPage = () => {
  const { role, loading } = useUserRole();
  const [isSendingTest, setIsSendingTest] = useState(false);

  const handleTestNotification = async () => {
    setIsSendingTest(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: 'Niet ingelogd',
          description: 'Je moet ingelogd zijn om test notificaties te versturen',
          variant: 'destructive',
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('send-training-reminders', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      toast({
        title: 'Test notificaties verstuurd',
        description: data.message || 'Notificaties zijn succesvol verstuurd naar alle geabonneerde gebruikers',
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        title: 'Fout',
        description: 'Er ging iets mis bij het versturen van de test notificaties',
        variant: 'destructive',
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  if (loading) {
    return <PageLoading message="Laden..." />;
  }

  if (role !== 'superuser') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-4xl font-bold text-primary">Admin Dashboard</h1>
          </div>
          <p className="text-muted-foreground">Superuser beheer paneel</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Spelers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Beheer</div>
              <p className="text-xs text-muted-foreground">
                Account koppelingen
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Instellingen</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Configuratie</div>
              <p className="text-xs text-muted-foreground">
                Systeem instellingen
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rechten</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Superuser</div>
              <p className="text-xs text-muted-foreground">
                Volledige toegang
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Statistieken</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Aanwezigheid</div>
              <p className="text-xs text-muted-foreground mb-2">
                Speler statistieken
              </p>
              <Button asChild size="sm" className="w-full">
                <Link to="/admin/statistics">
                  Bekijk Statistieken
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Test Notifications Section */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle>Test Notificaties</CardTitle>
              </div>
              <CardDescription>
                Verstuur een test notificatie naar alle geabonneerde gebruikers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleTestNotification} 
                disabled={isSendingTest}
                className="w-full sm:w-auto"
              >
                {isSendingTest ? 'Versturen...' : 'Test Notificatie Versturen'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Legacy Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-primary mb-4">Legacy Pagina's</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Oude Homepage</CardTitle>
                <Home className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold mb-2">Dashboard</div>
                <Button asChild size="sm" variant="outline" className="w-full">
                  <Link to="/old-homepage">
                    Bekijk
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Wedstrijden</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold mb-2">Legacy</div>
                <Button asChild size="sm" variant="outline" className="w-full">
                  <Link to="/legacy/matches">
                    Bekijk
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Evenementen</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold mb-2">Legacy</div>
                <Button asChild size="sm" variant="outline" className="w-full">
                  <Link to="/legacy/events">
                    Bekijk
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Trainingen</CardTitle>
                <Dumbbell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold mb-2">Legacy</div>
                <Button asChild size="sm" variant="outline" className="w-full">
                  <Link to="/legacy/trainings">
                    Bekijk
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <PlayerManagement />
      </div>
    </div>
  );
};

export default AdminPage;
