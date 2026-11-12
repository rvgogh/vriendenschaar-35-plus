import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { PageLoading } from "@/components/PageLoading";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUpcomingTrainings } from "@/hooks/useData";
import { CATEGORY_LABELS, matchFormatText, variantKey, type VariantKey } from "@/lib/trainingPlan";
import { fetchDrills, fetchPlanHistory, fetchPresentPlayerIds, formatShortDate, lastDoneByDrill } from "@/lib/trainingDb";

const VARIANTS: VariantKey[] = ['10-13', '14-19', '20-25'];

export default function DrillPage() {
  const { drillId } = useParams();
  const { data: drills, isLoading } = useQuery({ queryKey: ['drills'], queryFn: fetchDrills, retry: false });
  const { data: history } = useQuery({ queryKey: ['trainingPlanHistory'], queryFn: fetchPlanHistory, retry: false });
  const { data: trainings = [] } = useUpcomingTrainings();
  const next = trainings[0];
  const { data: presentIds } = useQuery({
    queryKey: ['trainingPresent', next?.id], queryFn: () => fetchPresentPlayerIds(next!.id), enabled: !!next,
  });
  const [chosen, setChosen] = useState<VariantKey | null>(null);

  if (isLoading) return <PageLoading />;
  const drill = drills?.find((d) => d.id === drillId);
  if (!drill) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <PageHeader title="Oefening" backTo="/drills" />
        <EmptyState message="Deze oefening bestaat niet (meer)." />
      </div>
    );
  }

  const playerCount = presentIds?.length ?? 0;
  // Standaard de variant die past bij de komende training.
  const variant = chosen ?? (playerCount ? variantKey(playerCount) : '14-19');
  const last = lastDoneByDrill(history ?? []).get(drill.id);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <PageHeader title={drill.name} backTo="/drills"
        subtitle={`${CATEGORY_LABELS[drill.category]} · ${drill.duration} min · ${drill.min_players}–${drill.max_players} spelers`} />
      <div className="-mt-4 mb-6 flex flex-wrap gap-2">
        <Badge variant="secondary">{last ? `Laatst gedaan: ${formatShortDate(last)}` : 'Nog niet gedaan'}</Badge>
        {drill.tactical && <Badge variant="outline">Tactisch: zoveel mogelijk per eigen team</Badge>}
        {drill.fixed && <Badge variant="outline">Vast onderdeel</Badge>}
      </div>

      <Tabs value={variant} onValueChange={(v) => setChosen(v as VariantKey)}>
        <TabsList className="mb-4 grid w-full grid-cols-3" aria-label="Spelersaantal">
          {VARIANTS.map((v) => <TabsTrigger key={v} value={v}>{v}</TabsTrigger>)}
        </TabsList>
      </Tabs>

      {drill.sketch && (
        <figure className="mb-6 overflow-hidden rounded-lg border">
          <img src={drill.sketch} alt={`Veldschets van ${drill.name}`} className="block h-auto w-full" />
        </figure>
      )}

      <div className="space-y-6">
        <section>
          <h2 className="mb-2 text-xl font-semibold">Opzet bij {variant} spelers</h2>
          <p className="text-sm leading-relaxed">{drill.variants?.[variant] ?? 'Geen aparte variant.'}</p>
          {drill.category === 'partijvorm' && playerCount > 0 && (
            <p className="mt-1 text-sm text-muted-foreground">Komende training ({playerCount} spelers): {matchFormatText(playerCount)}</p>
          )}
        </section>
        <section>
          <h2 className="mb-2 text-xl font-semibold">Uitleg</h2>
          <p className="text-sm leading-relaxed">{drill.explanation}</p>
        </section>
        {drill.coaching_points.length > 0 && (
          <section>
            <h2 className="mb-2 text-xl font-semibold">Coachpunten</h2>
            <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
              {drill.coaching_points.map((point) => <li key={point}>{point}</li>)}
            </ul>
          </section>
        )}
        {drill.material && <p className="text-sm text-muted-foreground">Materiaal: {drill.material}</p>}
      </div>
    </div>
  );
}
