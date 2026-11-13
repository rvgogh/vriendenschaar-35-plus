import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Shuffle } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { PageLoading } from "@/components/PageLoading";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";
import {
  buildTeams, fromAssignments, levelCounts, lineup, primaryPosition, swapPlayers, toAssignments, POSITION_LABEL,
  type Side, type TeamMode, type TeamPlayer, type TeamResult,
} from "@/lib/teamBuilder";
import { fetchAssignments, fetchPlan, fetchPlayerInfo, fetchPresentPlayerIds, saveAssignments } from "@/lib/trainingDb";

const SIDE_LABEL: Record<Side, string> = { hesjes: 'Hesjes', zonder: 'Zonder' };

const TeamCard = ({ title, players, side, selectedId, onSelect }: {
  title: string; players: TeamPlayer[]; side: Side; selectedId: number | null; onSelect: (id: number) => void;
}) => {
  const ownTeam = side === 'hesjes' ? 1 : 2;
  const club = new Set(players.map((p) => p.team));
  return (
    <section className="rounded-lg border bg-card p-3">
      <h3 className="font-semibold">{title}</h3>
      <p className="mb-2 text-xs text-muted-foreground">
        {club.size === 1 ? `Team ${[...club][0]} · ` : ''}{players.length} spelers
      </p>
      {lineup(players).map(({ player, position }) => (
        <button key={player.id} type="button" onClick={() => onSelect(player.id)} aria-pressed={selectedId === player.id}
          className={cn("flex min-h-9 w-full items-center justify-between gap-2 border-t text-left text-sm", selectedId === player.id && "bg-muted font-semibold text-primary")}>
          <span className="min-w-0 break-words">
            {player.name}
            {club.size > 1 && player.team !== ownTeam && <Badge variant="outline" className="ml-1 px-2 py-0">T{player.team}</Badge>}
          </span>
          <span className={cn("shrink-0 text-xs", player.positions.length > 0 && !player.positions.includes(position) ? "text-destructive" : "text-muted-foreground")}
            title={player.positions.length > 0 && !player.positions.includes(position) ? 'Geen voorkeurspositie' : undefined}>
            {POSITION_LABEL[position]}
          </span>
        </button>
      ))}
    </section>
  );
};

export default function TrainingTeamsPage() {
  const trainingId = Number(useParams().trainingId);
  const { isTrainer, loading: roleLoading } = useUserRole();
  const queryClient = useQueryClient();

  const { data: plan, isLoading: planLoading } = useQuery({ queryKey: ['trainingPlan', trainingId], queryFn: () => fetchPlan(trainingId), enabled: isTrainer, retry: false });
  const { data: presentIds } = useQuery({ queryKey: ['trainingPresent', trainingId], queryFn: () => fetchPresentPlayerIds(trainingId) });
  const { data: players } = useQuery({ queryKey: ['trainingPlayerInfo', true], queryFn: () => fetchPlayerInfo(true), enabled: isTrainer, retry: false });
  const { data: saved, isFetched: savedFetched } = useQuery({
    queryKey: ['trainingAssignments', plan?.id], queryFn: () => fetchAssignments(plan!.id), enabled: !!plan,
  });

  const [mode, setMode] = useState<TeamMode>('eigen');
  const [result, setResult] = useState<TeamResult | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);

  const present = useMemo(
    () => (players && presentIds ? players.filter((p) => presentIds.includes(p.id)) : null),
    [players, presentIds],
  );

  // Eerste keer: de opgeslagen indeling tonen als die nog klopt met de aanwezigen, anders een nieuwe maken.
  useEffect(() => {
    if (result !== null || !present || !savedFetched) return;
    const savedIds = (saved ?? []).map((a) => a.player_id).sort((a, b) => a - b);
    const presentSorted = present.map((p) => p.id).sort((a, b) => a - b);
    if (savedIds.length && savedIds.join() === presentSorted.join()) {
      setResult(fromAssignments(saved!, present));
    } else {
      setResult(buildTeams(present, 'eigen'));
      setDirty(true);
    }
  }, [result, present, saved, savedFetched]);

  const rebuild = (nextMode: TeamMode, shuffle: boolean) => {
    if (!present) return;
    setMode(nextMode);
    setResult(buildTeams(present, nextMode, shuffle ? Math.random : undefined));
    setSelectedId(null);
    setDirty(true);
  };

  const select = (id: number) => {
    if (!result) return;
    if (selectedId === null) return setSelectedId(id);
    if (selectedId !== id) {
      setResult(swapPlayers(result, selectedId, id));
      setDirty(true);
    }
    setSelectedId(null);
  };

  const shareMutation = useMutation({
    mutationFn: () => saveAssignments(plan!.id, toAssignments(result!), true),
    onSuccess: () => {
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ['trainingAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['trainingPlan', trainingId] });
      toast.success(plan?.status === 'published'
        ? "De teams zijn gedeeld met de spelers."
        : "De teams zijn opgeslagen. Spelers zien ze zodra de training gepubliceerd is.");
    },
    onError: () => toast.error("Opslaan is niet gelukt."),
  });

  if (roleLoading || planLoading) return <PageLoading />;
  const backTo = `/training-plans/${trainingId}`;
  if (!isTrainer) return <div className="container mx-auto max-w-3xl px-4 py-8"><PageHeader title="Teams maken" backTo={backTo} /><EmptyState message="Deze pagina is alleen voor trainers." /></div>;
  if (!plan) return <div className="container mx-auto max-w-3xl px-4 py-8"><PageHeader title="Teams maken" backTo={backTo} /><EmptyState message="Sla de training eerst op. Daarna kun je teams maken." /></div>;
  if (!result || !present) return <PageLoading />;

  const team1 = present.filter((p) => p.team === 1).length;
  const subtitle = `${present.length} aanwezig · ${team1} van Team 1, ${present.length - team1} van Team 2`;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <PageHeader title="Teams maken" subtitle={subtitle} backTo={backTo}
        actions={dirty ? <Badge variant="secondary">Niet opgeslagen</Badge> : plan.teams_shared ? <Badge>Gedeeld</Badge> : undefined} />

      {present.length < 2 ? (
        <EmptyState message="Er zijn nog te weinig aanmeldingen om teams te maken." />
      ) : (
        <>
          <Tabs value={mode} onValueChange={(v) => rebuild(v as TeamMode, false)}>
            <TabsList className="mb-4 grid w-full grid-cols-2">
              <TabsTrigger value="eigen">Eigen teams</TabsTrigger>
              <TabsTrigger value="gemengd">Gemengd</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="mb-4 border-l-4 border-primary bg-muted p-4">
            <p className="text-sm text-muted-foreground">Balans in niveau: GOAT / Eeuwig talent / Mag er ook zijn / Rookie (alleen zichtbaar voor trainers)</p>
            <p className="font-semibold">
              {result.fields.map((f) => {
                const fmt = (t: TeamPlayer[]) => { const c = levelCounts(t); return `${c.goat}/${c.talent}/${c.decent}/${c.rookie}`; };
                return `${result.fields.length > 1 ? `Veld ${f.field}: ` : ''}${fmt(f.hesjes)} – ${fmt(f.zonder)}`;
              }).join(' · ')}
            </p>
          </div>

          {result.fields.map((f) => (
            <section key={f.field} className="mb-4">
              {result.fields.length > 1 && (
                <h2 className="mb-2 text-xl font-semibold">
                  Veld {f.field} <span className="text-sm font-normal text-muted-foreground">{f.hesjes.length} tegen {f.zonder.length}</span>
                </h2>
              )}
              <div className="grid grid-cols-2 gap-3">
                <TeamCard title="Hesjes" side="hesjes" players={f.hesjes} selectedId={selectedId} onSelect={select} />
                <TeamCard title="Zonder" side="zonder" players={f.zonder} selectedId={selectedId} onSelect={select} />
              </div>
            </section>
          ))}

          {result.extra && (
            <div className="mb-4 rounded-lg border border-primary bg-secondary p-3">
              <p className="text-xs text-muted-foreground">
                Extra speler{result.fields.length > 1 ? ` op veld ${result.extraField}` : ''} (oneven aantal)
              </p>
              <button type="button" onClick={() => select(result.extra!.id)} aria-pressed={selectedId === result.extra.id}
                className={cn("min-h-9 text-left font-semibold", selectedId === result.extra.id && "text-primary underline")}>
                {result.extra.name}
              </button>
              {primaryPosition(result.extra) && <span className="ml-2 text-xs text-muted-foreground">{POSITION_LABEL[primaryPosition(result.extra)!]}</span>}
              <p className="text-sm text-muted-foreground">
                Speelt mee met het team dat als laatste een doelpunt tegen kreeg. Begint bij {SIDE_LABEL[result.extraStartsWith ?? 'hesjes']}.
              </p>
            </div>
          )}

          <p className="mb-6 text-sm text-muted-foreground">
            Geen wissels. Tot en met 15 spelers 2 teams, vanaf 16 spelers 4 teams op 2 velden. Tik op twee spelers om ze te ruilen. Posities volgen de 1-2-3-1 en de voorkeur van de spelers; rood = geen voorkeurspositie.
          </p>

          <div className="flex flex-col gap-2">
            <Button disabled={shareMutation.isPending} onClick={() => shareMutation.mutate()}>Delen met spelers</Button>
            <Button variant="outline" onClick={() => rebuild(mode, true)}><Shuffle className="mr-2 h-4 w-4" />Opnieuw verdelen</Button>
          </div>
        </>
      )}
    </div>
  );
}
