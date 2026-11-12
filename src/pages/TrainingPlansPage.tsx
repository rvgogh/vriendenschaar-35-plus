import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronRight, Pencil } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { PageLoading } from "@/components/PageLoading";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PositionPreferences } from "@/components/PositionPreferences";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/sonner";
import { useUserRole } from "@/hooks/useUserRole";
import { useUpcomingTrainings } from "@/hooks/useData";
import {
  fetchPlanStatuses, fetchPlayerInfo, fetchPresentCounts, fetchTrainerRoles, formatClock, formatTrainingDate,
  savePlayerInfo, savePlayerLevel, setTrainer, type PlayerInfo,
} from "@/lib/trainingDb";
import { DEFAULT_LEVEL, LEVELS, positionsSummary, type Level, type Position } from "@/lib/teamBuilder";

const PlayerSettings = ({ isSuperuser }: { isSuperuser: boolean }) => {
  const queryClient = useQueryClient();
  const { data: players, isLoading, error } = useQuery({ queryKey: ['trainingPlayerInfo', true], queryFn: () => fetchPlayerInfo(true) });
  const { data: roles } = useQuery({ queryKey: ['trainerRoles'], queryFn: fetchTrainerRoles, enabled: isSuperuser });
  const [editing, setEditing] = useState<{ player: PlayerInfo; positions: Position[] } | null>(null);

  const mutation = useMutation({
    mutationFn: async (change: { player: PlayerInfo; team?: 1 | 2; positions?: Position[]; level?: Level; trainer?: boolean }) => {
      const { player } = change;
      if (change.trainer !== undefined) return setTrainer(player.id, change.trainer);
      if (change.level !== undefined) return savePlayerLevel(player.id, change.level);
      return savePlayerInfo(player.id, change.team ?? player.team, change.positions ?? player.positions);
    },
    onSuccess: () => {
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ['trainingPlayerInfo'] });
      queryClient.invalidateQueries({ queryKey: ['trainerRoles'] });
      toast.success("Opgeslagen.");
    },
    onError: (e: Error) => toast.error(e.message || "Opslaan is niet gelukt."),
  });

  if (isLoading) return <p className="py-8 text-muted-foreground">Laden...</p>;
  if (error || !players) return <EmptyState message="De spelersgegevens voor de training zijn nog niet beschikbaar. Zijn de migraties al uitgevoerd?" />;

  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">
        Team en posities zijn zichtbaar voor iedereen. Spelers zetten hun posities zelf op volgorde via Mijn posities; je kunt ze hier ook aanpassen.
        Het niveau zien alleen trainers; iedereen begint als Eeuwig talent.
      </p>
      <div className="divide-y border-y">
        {players.map((player) => {
          const role = roles?.get(player.id);
          return (
            <div key={player.id} className="grid gap-3 py-4 md:grid-cols-[1fr_auto] md:items-center">
              <p className="font-semibold break-words">
                {player.name}
                {player.knvb_member && <span className="ml-2 text-xs font-normal text-muted-foreground">KNVB</span>}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={String(player.team)} onValueChange={(v) => mutation.mutate({ player, team: Number(v) as 1 | 2 })}>
                  <SelectTrigger className="w-28" aria-label={`Team van ${player.name}`}><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="1">Team 1</SelectItem><SelectItem value="2">Team 2</SelectItem></SelectContent>
                </Select>
                <Button variant="outline" className="max-w-full justify-start" onClick={() => setEditing({ player, positions: player.positions })}
                  aria-label={`Posities van ${player.name} aanpassen`}>
                  <Pencil className="mr-2 h-4 w-4 shrink-0" /><span className="truncate">{positionsSummary(player.positions)}</span>
                </Button>
                <Select value={player.level ?? DEFAULT_LEVEL} onValueChange={(v) => mutation.mutate({ player, level: v as Level })}>
                  <SelectTrigger className="w-40" aria-label={`Niveau van ${player.name}`}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEVELS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                {isSuperuser && (role === 'superuser'
                  ? <Badge variant="secondary">Beheerder</Badge>
                  : (
                    <div className="flex h-10 items-center gap-2">
                      <Switch id={`trainer-${player.id}`} checked={role === 'trainer'} disabled={mutation.isPending}
                        onCheckedChange={(checked) => mutation.mutate({ player, trainer: checked })} />
                      <Label htmlFor={`trainer-${player.id}`}>Trainer</Label>
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Posities van {editing?.player.name}</DialogTitle></DialogHeader>
          {editing && <PositionPreferences value={editing.positions} onChange={(positions) => setEditing({ ...editing, positions })} disabled={mutation.isPending} />}
          <DialogFooter>
            <Button disabled={mutation.isPending} onClick={() => editing && mutation.mutate({ player: editing.player, positions: editing.positions })}>Opslaan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default function TrainingPlansPage() {
  const { isTrainer, isSuperuser, loading } = useUserRole();
  const { data: trainings = [], isLoading } = useUpcomingTrainings();
  const ids = trainings.map((t) => t.id);
  const { data: counts } = useQuery({ queryKey: ['trainingPresentCounts', ids], queryFn: () => fetchPresentCounts(ids), enabled: ids.length > 0 });
  const { data: statuses, error: plansError } = useQuery({
    queryKey: ['trainingPlanStatuses', ids], queryFn: () => fetchPlanStatuses(ids), enabled: ids.length > 0 && isTrainer, retry: false,
  });

  if (loading || isLoading) return <PageLoading />;
  if (!isTrainer) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <PageHeader title="Training plannen" />
        <EmptyState message="Deze pagina is alleen voor trainers." />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <PageHeader title="Training plannen" subtitle="Kies een avond, bekijk het voorstel en publiceer het voor de spelers" />
      <Tabs defaultValue="trainingen">
        <TabsList className="mb-6 grid w-full grid-cols-2 sm:w-80">
          <TabsTrigger value="trainingen">Trainingen</TabsTrigger>
          <TabsTrigger value="spelers">Spelers</TabsTrigger>
        </TabsList>
        <TabsContent value="trainingen">
          {plansError && <EmptyState className="mb-6" message="De tabellen voor de training-module ontbreken nog. Voer eerst de migraties uit (zie supabase/TRAINING-MODULE.md)." />}
          <div className="divide-y border-y">
            {trainings.length === 0 && <p className="py-8 text-muted-foreground">Er staan geen komende trainingen gepland.</p>}
            {trainings.map((training) => {
              const status = statuses?.get(training.id);
              return (
                <Link key={training.id} to={`/training-plans/${training.id}`} className="flex items-center justify-between gap-3 py-4 hover:bg-muted/50">
                  <div>
                    <p className="font-semibold">{formatTrainingDate(training.training_at)} · {formatClock(training.training_at)}</p>
                    <p className="text-sm text-muted-foreground">{counts?.get(training.id) ?? 0} aangemeld</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {status === 'published' && <Badge>Gepubliceerd</Badge>}
                    {status === 'concept' && <Badge variant="outline">Concept</Badge>}
                    {!status && <Badge variant="secondary">Nog geen plan</Badge>}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              );
            })}
          </div>
        </TabsContent>
        <TabsContent value="spelers">
          <PlayerSettings isSuperuser={isSuperuser} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
