import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { PageLoading } from "@/components/PageLoading";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
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
import type { Position } from "@/lib/teamBuilder";

const POSITIONS: { value: Position; label: string }[] = [
  { value: 'K', label: 'Keeper' }, { value: 'V', label: 'Verdediger' }, { value: 'M', label: 'Middenvelder' }, { value: 'A', label: 'Aanvaller' },
];

const PlayerSettings = ({ isSuperuser }: { isSuperuser: boolean }) => {
  const queryClient = useQueryClient();
  const { data: players, isLoading, error } = useQuery({ queryKey: ['trainingPlayerInfo', true], queryFn: () => fetchPlayerInfo(true) });
  const { data: roles } = useQuery({ queryKey: ['trainerRoles'], queryFn: fetchTrainerRoles, enabled: isSuperuser });

  const mutation = useMutation({
    mutationFn: async (change: { player: PlayerInfo; team?: 1 | 2; position?: Position | null; level?: number | null; trainer?: boolean }) => {
      const { player } = change;
      if (change.trainer !== undefined) return setTrainer(player.id, change.trainer);
      if (change.level !== undefined) return savePlayerLevel(player.id, change.level);
      return savePlayerInfo(player.id, change.team ?? player.team, change.position !== undefined ? change.position : player.position);
    },
    onSuccess: () => {
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
        Team en positie zijn zichtbaar voor iedereen. Het niveau zien alleen trainers; het wordt gebruikt om eerlijke teams te maken.
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
                <Select value={player.position ?? 'geen'} onValueChange={(v) => mutation.mutate({ player, position: v === 'geen' ? null : v as Position })}>
                  <SelectTrigger className="w-40" aria-label={`Positie van ${player.name}`}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="geen">Geen positie</SelectItem>
                    {POSITIONS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={player.level ? String(player.level) : 'geen'} onValueChange={(v) => mutation.mutate({ player, level: v === 'geen' ? null : Number(v) })}>
                  <SelectTrigger className="w-32" aria-label={`Niveau van ${player.name}`}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="geen">Geen niveau</SelectItem>
                    {[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>Niveau {n}</SelectItem>)}
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
