import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, ClipboardList, Printer } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { PageLoading } from "@/components/PageLoading";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useMyPlayer } from "@/hooks/useData";
import { blockTimes, endTime, matchFormatText, SLOTS, THEMES, variantText } from "@/lib/trainingPlan";
import { fetchAssignments, fetchDrills, fetchPlan, fetchPresentPlayerIds, fetchTraining, formatClock, formatTrainingDate } from "@/lib/trainingDb";

/** Het programma van een trainingsavond, zoals spelers het zien. */
export default function TrainingProgramPage() {
  const trainingId = Number(useParams().trainingId);
  const { user } = useAuth();
  const { data: myPlayer } = useMyPlayer(user?.id);
  const { data: training, isLoading: trainingLoading } = useQuery({ queryKey: ['training', trainingId], queryFn: () => fetchTraining(trainingId) });
  const { data: plan, isLoading: planLoading } = useQuery({ queryKey: ['trainingPlan', trainingId], queryFn: () => fetchPlan(trainingId), retry: false });
  const { data: drills = [] } = useQuery({ queryKey: ['drills'], queryFn: fetchDrills, retry: false });
  const { data: presentIds = [] } = useQuery({ queryKey: ['trainingPresent', trainingId], queryFn: () => fetchPresentPlayerIds(trainingId) });
  const { data: assignments = [] } = useQuery({
    queryKey: ['trainingAssignments', plan?.id], queryFn: () => fetchAssignments(plan!.id), enabled: !!plan?.teams_shared, retry: false,
  });

  if (trainingLoading || planLoading) return <PageLoading />;
  if (!training || !plan || plan.status !== 'published') {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <PageHeader title="Training" subtitle={training ? `${formatTrainingDate(training.training_at)} · ${formatClock(training.training_at)}` : undefined} />
        <EmptyState message="Het programma voor deze training is nog niet gepubliceerd." />
      </div>
    );
  }

  const playerCount = presentIds.length;
  const drillById = new Map(drills.map((d) => [d.id, d]));
  const times = blockTimes(training.training_at, plan.blocks);
  const theme = THEMES.find((t) => t.value === plan.theme)?.label.toLowerCase();
  const mine = assignments.find((a) => a.player_id === myPlayer?.id);
  const twoFields = assignments.some((a) => a.field === 2);
  const mySpot = !mine ? null
    : mine.side === 'extra'
      ? `Extra speler${twoFields ? ` op veld ${mine.field}` : ''}: je speelt mee met het team dat als laatste een doelpunt tegen kreeg`
      : `${twoFields ? `Veld ${mine.field} · ` : ''}${mine.side === 'hesjes' ? 'met hesje' : 'zonder hesje'}`;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <PageHeader title="Training"
        subtitle={`${formatTrainingDate(training.training_at)} · ${formatClock(training.training_at)}–${endTime(training.training_at, plan.blocks)}${theme ? ` · thema ${theme}` : ''}`} />

      {mySpot && (
        <div className="mb-6 border-l-4 border-primary bg-muted p-4">
          <p className="text-sm text-muted-foreground">Jouw team voor de partij</p>
          <p className="font-semibold">{mySpot}</p>
        </div>
      )}

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl">Programma</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y border-t">
            {plan.blocks.map((block, index) => {
              const slot = SLOTS[block.position - 1];
              const drill = drillById.get(block.drill_id);
              const fixed = slot?.key === 'vast';
              const detail = slot?.key === 'partijvorm' ? matchFormatText(playerCount) : drill ? variantText(drill, playerCount) : '';
              return (
                <Link key={block.position} to={`/drills/${block.drill_id}`} className="flex items-center gap-3 py-3 hover:bg-muted/50">
                  <span className={cn("w-12 shrink-0 text-sm font-semibold tabular-nums", fixed && "text-primary")}>{times[index]}</span>
                  <span className="min-w-0 flex-1 text-sm">
                    <span className={cn("block", fixed && "font-semibold text-primary")}>{drill?.name ?? slot?.label}</span>
                    <span className="block text-muted-foreground">{detail}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Button asChild variant="outline" className="w-full">
        <Link to={`/training/${trainingId}/print`}><Printer className="mr-2 h-4 w-4" />Printen</Link>
      </Button>
    </div>
  );
}
