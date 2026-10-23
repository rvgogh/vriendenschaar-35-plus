import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Beer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMyPlayer } from '@/hooks/useData';
import { PageHeader } from '@/components/PageHeader';
import { PageLoading } from '@/components/PageLoading';
import { Button } from '@/components/ui/button';

export default function BarDutiesPublicPage() {
  const { user } = useAuth();
  const { data: myPlayer } = useMyPlayer(user?.id);
  const query = useQuery({
    queryKey: ['barDutiesPublic', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [duties, players, seasons] = await Promise.all([
        supabase.from('bar_duties').select('*').order('duty_date'),
        supabase.from('players').select('id,name,knvb_member').order('name'),
        supabase.from('seasons').select('id,name,start_date,end_date').order('start_date', { ascending: false }),
      ]);
      if (duties.error) throw duties.error;
      if (players.error) throw players.error;
      if (seasons.error) throw seasons.error;
      return { duties: duties.data, players: players.data, seasons: seasons.data };
    },
  });
  if (query.isLoading) return <PageLoading />;
  if (query.isError || !query.data) return <div className="container px-4 py-8"><PageHeader title="Bardiensten" /><p role="alert">Bardiensten konden niet worden geladen.</p><Button variant="outline" onClick={() => query.refetch()}>Opnieuw proberen</Button></div>;

  const { duties, players, seasons } = query.data;
  const today = format(new Date(), 'yyyy-MM-dd');
  const activeSeason = seasons.find(s => today >= s.start_date && today <= s.end_date) ?? seasons[0];
  const visible = duties.filter(d => d.season_id === activeSeason?.id);
  const playerName = (id: number) => players.find(p => p.id === id)?.name ?? 'Onbekende speler';

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <PageHeader title="Bardiensten" subtitle={`Indeling ${activeSeason?.name ?? 'huidig seizoen'} · woensdag na de training`} />
      <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold"><Beer className="h-5 w-5 text-primary" />Indeling</h2>
      <div className="divide-y border-y">
        {visible.length === 0 && <p className="py-8 text-muted-foreground">Nog geen bardiensten in dit seizoen.</p>}
        {visible.map(duty => {
          const mine = duty.player_one_id === myPlayer?.id || duty.player_two_id === myPlayer?.id;
          return <div key={duty.id} className={`grid gap-3 py-5 md:grid-cols-[200px_1fr] md:items-center ${mine ? 'bg-muted/50' : ''}`}>
            <div><p className="font-semibold">{format(new Date(`${duty.duty_date}T12:00:00`), 'EEEE d MMMM', { locale: nl })}</p><p className="text-sm text-muted-foreground">Na de training{duty.duty_date < today ? ' · Verlopen' : ''}</p></div>
            <div className="grid min-w-0 gap-2 sm:grid-cols-2">{[duty.player_one_id, duty.player_two_id].map(id => <span key={id} className={`break-words ${id === myPlayer?.id ? 'font-semibold text-primary' : ''}`}>{playerName(id)}{id === myPlayer?.id ? ' (jij)' : ''}</span>)}</div>
          </div>;
        })}
      </div>
    </div>
  );
}
