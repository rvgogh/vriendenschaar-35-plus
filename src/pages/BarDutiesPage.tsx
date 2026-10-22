import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Beer, Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';
import { useMyPlayer } from '@/hooks/useData';
import { useUserRole } from '@/hooks/useUserRole';
import { chooseBarPlayers, countBarDuties, isDutyWednesday } from '@/lib/barDuties';
import { PageHeader } from '@/components/PageHeader';
import { PageLoading } from '@/components/PageLoading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

type Duty = Tables<'bar_duties'>;
type EditDuty = { id: string; first: string; second: string };

export default function BarDutiesPage() {
  const { user } = useAuth();
  const { isSuperuser } = useUserRole();
  const { data: myPlayer } = useMyPlayer(user?.id);
  const client = useQueryClient();
  const [date, setDate] = useState('');
  const [knvbOnly, setKnvbOnly] = useState(false);
  const [edit, setEdit] = useState<EditDuty | null>(null);
  const [season, setSeason] = useState('');
  const query = useQuery({
    queryKey: ['barDuties', user?.id],
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
  const mutation = useMutation({
    mutationFn: async (action: { type: 'add' } | { type: 'save'; duty: Duty } | { type: 'delete'; id: string }) => {
      if (!isSuperuser || !query.data) throw new Error('Alleen een beheerder kan bardiensten aanpassen.');
      if (action.type === 'add') {
        if (!isDutyWednesday(date)) throw new Error('Kies een woensdag.');
        // Read the latest complete history so every new round continues the rotation.
        const history = await supabase.from('bar_duties').select('*');
        if (history.error) throw history.error;
        const [first, second] = chooseBarPlayers(query.data.players, history.data, knvbOnly);
        const result = await supabase.from('bar_duties').insert({ duty_date: date, player_one_id: first, player_two_id: second, knvb_only: knvbOnly });
        if (result.error) throw result.error;
      } else if (action.type === 'save') {
        if (!edit || !edit.first || !edit.second || edit.first === edit.second) throw new Error('Kies twee verschillende spelers.');
        const result = await supabase.from('bar_duties').update({ player_one_id: Number(edit.first), player_two_id: Number(edit.second) }).eq('id', action.duty.id);
        if (result.error) throw result.error;
      } else {
        const result = await supabase.from('bar_duties').delete().eq('id', action.id);
        if (result.error) throw result.error;
      }
    },
    onSuccess: async () => {
      setEdit(null);
      setDate('');
      await client.invalidateQueries({ queryKey: ['barDuties'] });
      toast.success('Bardiensten bijgewerkt');
    },
    onError: (error: Error) => toast.error(error.message.includes('duplicate key') ? 'Voor deze datum bestaat al een bardienst.' : error.message),
  });
  if (query.isLoading) return <PageLoading />;
  if (query.isError || !query.data) return <div className="container px-4 py-8"><PageHeader title="Bardiensten" /><p role="alert">Bardiensten konden niet worden geladen.</p><Button variant="outline" onClick={() => query.refetch()}>Opnieuw proberen</Button></div>;

  const { duties, players, seasons } = query.data;
  const today = format(new Date(), 'yyyy-MM-dd');
  const activeSeason = seasons.find(s => today >= s.start_date && today <= s.end_date) ?? seasons[0];
  const selectedSeason = season || String(activeSeason?.id ?? '');
  const visible = duties.filter(d => String(d.season_id ?? 'none') === selectedSeason);
  const counts = countBarDuties(duties);
  const playerName = (id: number) => players.find(p => p.id === id)?.name ?? 'Onbekende speler';
  const myNext = duties.find(d => d.duty_date >= today && (d.player_one_id === myPlayer?.id || d.player_two_id === myPlayer?.id));
  const selector = (slot: 'first' | 'second', duty: Duty) => (
    <Select value={edit?.[slot]} onValueChange={value => setEdit(current => current ? { ...current, [slot]: value } : null)}>
      <SelectTrigger aria-label={`Speler ${slot === 'first' ? '1' : '2'} voor ${duty.duty_date}`}><SelectValue /></SelectTrigger>
      <SelectContent>{players.filter(p => !duty.knvb_only || p.knvb_member).map(p => <SelectItem key={p.id} value={String(p.id)} disabled={String(p.id) === edit?.[slot === 'first' ? 'second' : 'first']}>{p.name} ({counts.get(p.id) ?? 0})</SelectItem>)}</SelectContent>
    </Select>
  );
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <PageHeader title="Bardiensten" subtitle="Woensdag · na de training · twee personen" />
      {myNext && <div className="mb-6 border-l-4 border-primary bg-muted p-4"><p className="text-sm text-muted-foreground">Mijn volgende bardienst</p><p className="font-semibold">{format(new Date(`${myNext.duty_date}T12:00:00`), 'd MMMM yyyy', { locale: nl })} · met {playerName(myNext.player_one_id === myPlayer?.id ? myNext.player_two_id : myNext.player_one_id)}</p></div>}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="flex items-center gap-2 text-xl font-semibold"><Beer className="h-5 w-5 text-primary" />Indeling</h2>
        <Select value={selectedSeason} onValueChange={setSeason}><SelectTrigger className="w-full sm:w-64" aria-label="Seizoen"><SelectValue /></SelectTrigger><SelectContent>{seasons.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}{duties.some(d => d.season_id === null) && <SelectItem value="none">Zonder seizoen</SelectItem>}</SelectContent></Select>
      </div>
      <div className="divide-y border-y">
        {visible.length === 0 && <p className="py-8 text-muted-foreground">Nog geen bardiensten in dit seizoen.</p>}
        {visible.map(duty => {
          const editing = edit?.id === duty.id;
          const mine = duty.player_one_id === myPlayer?.id || duty.player_two_id === myPlayer?.id;
          return <div key={duty.id} className={`grid gap-3 py-5 md:grid-cols-[200px_1fr_auto] md:items-center ${mine ? 'bg-muted/50' : ''}`}>
            <div><p className="font-semibold">{format(new Date(`${duty.duty_date}T12:00:00`), 'EEEE d MMMM', { locale: nl })}</p><p className="text-sm text-muted-foreground">Na de training{duty.knvb_only ? ' · KNVB' : ''}{duty.duty_date < today ? ' · Verlopen' : ''}</p></div>
            <div className="grid min-w-0 gap-2 sm:grid-cols-2">{editing ? <>{selector('first', duty)}{selector('second', duty)}</> : [duty.player_one_id, duty.player_two_id].map(id => <span key={id} className={`break-words ${id === myPlayer?.id ? 'font-semibold text-primary' : ''}`}>{playerName(id)}{id === myPlayer?.id ? ' (jij)' : ''}</span>)}</div>
            {isSuperuser && <div className="flex gap-1">{editing ? <><Button size="icon" aria-label="Indeling opslaan" title="Opslaan" disabled={mutation.isPending} onClick={() => mutation.mutate({ type: 'save', duty })}><Save className="h-4 w-4" /></Button><Button size="icon" variant="ghost" aria-label="Annuleren" title="Annuleren" disabled={mutation.isPending} onClick={() => setEdit(null)}><X className="h-4 w-4" /></Button></> : <><Button size="icon" variant="ghost" aria-label={`Bardienst ${duty.duty_date} wijzigen`} title="Wijzigen" disabled={mutation.isPending} onClick={() => setEdit({ id: duty.id, first: String(duty.player_one_id), second: String(duty.player_two_id) })}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" aria-label={`Bardienst ${duty.duty_date} verwijderen`} title="Verwijderen" disabled={mutation.isPending} onClick={() => { if (window.confirm('Deze bardienst en indeling verwijderen?')) mutation.mutate({ type: 'delete', id: duty.id }); }}><Trash2 className="h-4 w-4" /></Button></>}</div>}
          </div>;
        })}
      </div>
      {isSuperuser && <form className="my-8 flex flex-wrap items-end gap-4" onSubmit={event => { event.preventDefault(); mutation.mutate({ type: 'add' }); }}>
        <div className="space-y-2"><Label htmlFor="duty-date">Nieuwe woensdag</Label><Input id="duty-date" type="date" value={date} onChange={e => setDate(e.target.value)} required /></div>
        <div className="flex h-10 items-center gap-2"><Switch id="knvb-only" checked={knvbOnly} onCheckedChange={setKnvbOnly} /><Label htmlFor="knvb-only">Alleen KNVB-spelers</Label></div>
        <Button type="submit" disabled={mutation.isPending || !date}><Plus className="mr-2 h-4 w-4" />Avond toevoegen en indelen</Button>
      </form>}
      <section className="mt-10">
        <h2 className="mb-4 text-xl font-semibold">Beurten per speler</h2>
        <div className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">{[...players].sort((a, b) => (counts.get(a.id) ?? 0) - (counts.get(b.id) ?? 0) || a.id - b.id).map(p => <div key={p.id} className="flex items-center justify-between gap-3 border-b py-3"><span className="min-w-0 break-words">{p.name}<span className="ml-2 text-xs text-muted-foreground">{p.knvb_member ? 'KNVB' : ''}</span></span><span className="shrink-0 text-sm font-semibold tabular-nums">{counts.get(p.id) ?? 0}</span></div>)}</div>
      </section>
    </div>
  );
}