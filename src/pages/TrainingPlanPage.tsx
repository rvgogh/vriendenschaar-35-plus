import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight, ClipboardList, Lock, Printer, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { PageLoading } from "@/components/PageLoading";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import {
  blockTimes, candidatesFor, CATEGORY_LABELS, endTime, matchFormatText, proposePlan, SLOTS, THEMES, variantText,
  type PlanBlock, type Theme,
} from "@/lib/trainingPlan";
import {
  fetchDrills, fetchPlan, fetchPlanHistory, fetchPresentPlayerIds, fetchTraining, formatClock, formatShortDate,
  formatTrainingDate, lastDoneByDrill, recentDrillIds, savePlan,
} from "@/lib/trainingDb";

export default function TrainingPlanPage() {
  const trainingId = Number(useParams().trainingId);
  const { user } = useAuth();
  const { isTrainer, loading: roleLoading } = useUserRole();
  const queryClient = useQueryClient();

  const { data: training, isLoading: trainingLoading } = useQuery({ queryKey: ['training', trainingId], queryFn: () => fetchTraining(trainingId) });
  const { data: presentIds = [] } = useQuery({ queryKey: ['trainingPresent', trainingId], queryFn: () => fetchPresentPlayerIds(trainingId) });
  const { data: drills, error: drillsError } = useQuery({ queryKey: ['drills'], queryFn: fetchDrills, enabled: isTrainer, retry: false });
  const { data: plan, isFetched: planFetched } = useQuery({ queryKey: ['trainingPlan', trainingId], queryFn: () => fetchPlan(trainingId), enabled: isTrainer, retry: false });
  const { data: history } = useQuery({ queryKey: ['trainingPlanHistory'], queryFn: fetchPlanHistory, enabled: isTrainer, retry: false });

  const [blocks, setBlocks] = useState<PlanBlock[] | null>(null);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [dirty, setDirty] = useState(false);
  const [swapPosition, setSwapPosition] = useState<number | null>(null);

  const playerCount = presentIds.length;
  const recent = useMemo(() => (training && history ? recentDrillIds(history, training) : []), [training, history]);
  const lastDone = useMemo(() => lastDoneByDrill(history ?? []), [history]);
  const drillById = useMemo(() => new Map((drills ?? []).map((d) => [d.id, d])), [drills]);

  // Eerste keer: het opgeslagen plan tonen, of anders een voorstel maken.
  useEffect(() => {
    if (blocks !== null || !planFetched || !drills || !history || !training) return;
    if (plan) {
      setBlocks(plan.blocks);
      setTheme(plan.theme);
    } else {
      setBlocks(proposePlan({ drills, playerCount, theme: null, recentDrillIds: recent }));
      setDirty(true);
    }
  }, [blocks, planFetched, plan, drills, history, training, playerCount, recent]);

  const newProposal = (nextTheme: Theme | null = theme) => {
    if (!drills) return;
    setTheme(nextTheme);
    setBlocks(proposePlan({ drills, playerCount, theme: nextTheme, recentDrillIds: recent }));
    setDirty(true);
  };

  const saveMutation = useMutation({
    mutationFn: (status: 'concept' | 'published') => savePlan({ trainingId, status, theme, playerCount, blocks: blocks ?? [], userId: user?.id }),
    onSuccess: (_id, status) => {
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ['trainingPlan', trainingId] });
      queryClient.invalidateQueries({ queryKey: ['trainingPlanStatuses'] });
      queryClient.invalidateQueries({ queryKey: ['trainingPlanHistory'] });
      queryClient.invalidateQueries({ queryKey: ['publishedPlan'] });
      toast.success(status === 'published' ? "De training is gepubliceerd voor de spelers." : "De training is opgeslagen als concept.");
    },
    onError: () => toast.error("Opslaan is niet gelukt."),
  });

  if (roleLoading || trainingLoading) return <PageLoading />;
  const header = (subtitle?: string, actions?: React.ReactNode) => (
    <PageHeader title="Training plannen" subtitle={subtitle} backTo="/training-plans" actions={actions} />
  );
  if (!isTrainer) return <div className="container mx-auto max-w-3xl px-4 py-8">{header()}<EmptyState message="Deze pagina is alleen voor trainers." /></div>;
  if (!training) return <div className="container mx-auto max-w-3xl px-4 py-8">{header()}<EmptyState message="Deze training bestaat niet (meer)." /></div>;

  const subtitle = `${formatTrainingDate(training.training_at)} · ${formatClock(training.training_at)} · ${playerCount} aangemeld`;
  if (drillsError || (drills && drills.length === 0)) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        {header(subtitle)}
        <EmptyState message="De oefeningen staan nog niet in de database. Voer eerst de migraties uit (zie supabase/TRAINING-MODULE.md)." />
      </div>
    );
  }
  if (!blocks || !drills) return <PageLoading />;

  const status = plan?.status;
  const times = blockTimes(training.training_at, blocks);
  const swapBlock = blocks.find((b) => b.position === swapPosition);
  const swapSlot = swapBlock ? SLOTS[swapBlock.position - 1] : null;
  const usedIds = new Set(blocks.filter((b) => b.position !== swapPosition).map((b) => b.drill_id));
  const swapOptions = swapSlot ? candidatesFor(drills, swapSlot.categories, playerCount, new Set(), usedIds) : [];

  const chooseDrill = (drillId: string) => {
    setBlocks(blocks.map((b) => (b.position === swapPosition ? { ...b, drill_id: drillId } : b)));
    setSwapPosition(null);
    setDirty(true);
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      {header(subtitle, (
        <>
          {dirty && <Badge variant="secondary">Niet opgeslagen</Badge>}
          {!dirty && status === 'published' && <Badge>Gepubliceerd</Badge>}
          {!dirty && status === 'concept' && <Badge variant="outline">Concept</Badge>}
        </>
      ))}

      <div className="mb-6 flex flex-wrap gap-2">
        <Select value={theme ?? 'geen'} onValueChange={(v) => newProposal(v === 'geen' ? null : v as Theme)}>
          <SelectTrigger className="w-full sm:w-64" aria-label="Thema"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="geen">Geen thema</SelectItem>
            {THEMES.map((t) => <SelectItem key={t.value} value={t.value}>Thema: {t.label.toLowerCase()}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => newProposal()}><RefreshCw className="mr-2 h-4 w-4" />Nieuw voorstel</Button>
      </div>

      {blocks.length === 0 ? (
        <EmptyState className="mb-6" message="Er kon geen voorstel gemaakt worden. Controleer of er in elke categorie oefeningen staan." />
      ) : (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-6 w-6 text-primary" />
              <CardTitle className="text-xl">Programma</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {blocks.map((block, index) => {
              const slot = SLOTS[block.position - 1];
              const drill = drillById.get(block.drill_id);
              const fixed = slot.key === 'vast';
              const isMatch = slot.key === 'partijvorm';
              return (
                <div key={block.position} className={cn("flex items-center gap-2 rounded-lg border p-3", fixed ? "border-primary bg-secondary" : "bg-secondary/20")}>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">{times[index]} · {block.minutes} min · {slot.label}</p>
                    <Link to={`/drills/${block.drill_id}`} className={cn("block text-sm font-medium hover:underline", fixed && "font-semibold text-primary")}>
                      {drill?.name ?? block.drill_id}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {isMatch ? matchFormatText(playerCount) : drill ? variantText(drill, playerCount) : ''}
                    </p>
                    {isMatch && plan && !dirty && (
                      <Button asChild variant="link" className="h-auto p-0"><Link to={`/training-plans/${trainingId}/teams`}>Teams maken</Link></Button>
                    )}
                  </div>
                  {fixed ? (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center" title="Vast blok, niet te wisselen">
                      <Lock className="h-4 w-4 text-primary" aria-label="Vast blok, niet te wisselen" />
                    </div>
                  ) : (
                    <Button size="icon" variant="ghost" className="shrink-0" title="Wisselen"
                      aria-label={`Andere oefening kiezen voor ${slot.label.toLowerCase()}`} onClick={() => setSwapPosition(block.position)}>
                      <ArrowLeftRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
            <p className="text-sm text-muted-foreground">
              Het voorstel slaat oefeningen uit de laatste 3 weken over · eindtijd {endTime(training.training_at, blocks)}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-2">
        {status === 'published' && !dirty ? (
          <Button variant="outline" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate('concept')}>Publicatie intrekken</Button>
        ) : (
          <Button disabled={saveMutation.isPending || blocks.length === 0} onClick={() => saveMutation.mutate('published')}>Publiceren voor spelers</Button>
        )}
        {(dirty || !plan) && status !== 'published' && (
          <Button variant="outline" disabled={saveMutation.isPending || blocks.length === 0} onClick={() => saveMutation.mutate('concept')}>Opslaan als concept</Button>
        )}
        {plan && !dirty && (
          <Button asChild variant="outline">
            <Link to={`/training/${trainingId}/print`}><Printer className="mr-2 h-4 w-4" />Printen</Link>
          </Button>
        )}
        {(!plan || dirty) && <p className="text-sm text-muted-foreground">Sla de training eerst op om teams te maken of te printen.</p>}
      </div>

      <Dialog open={swapPosition !== null} onOpenChange={(open) => !open && setSwapPosition(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Andere oefening kiezen</DialogTitle>
            <DialogDescription>{swapSlot?.label} · {playerCount} spelers</DialogDescription>
          </DialogHeader>
          <div className="divide-y border-y">
            {swapOptions.length === 0 && <p className="py-6 text-muted-foreground">Geen andere oefeningen beschikbaar.</p>}
            {swapOptions.map((option) => {
              const last = lastDone.get(option.id);
              const isRecent = recent.includes(option.id);
              return (
                <button key={option.id} type="button" onClick={() => chooseDrill(option.id)}
                  className={cn("flex w-full items-center justify-between gap-3 py-3 text-left hover:bg-muted/50", option.id === swapBlock?.drill_id && "bg-muted/50")}>
                  <span>
                    <span className="block font-semibold">{option.name}</span>
                    <span className="block text-sm text-muted-foreground">
                      {CATEGORY_LABELS[option.category]} · {last ? `laatst ${formatShortDate(last)}` : 'nog niet gedaan'}
                    </span>
                  </span>
                  {isRecent && <Badge variant="outline">Recent gedaan</Badge>}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
