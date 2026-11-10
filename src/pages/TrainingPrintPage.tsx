import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Printer } from "lucide-react";
import { PageLoading } from "@/components/PageLoading";
import { Button } from "@/components/ui/button";
import { blockTimes, endTime, matchFormat, matchFormatText, SLOTS, THEMES, variantText } from "@/lib/trainingPlan";
import {
  fetchAssignments, fetchDrills, fetchPlan, fetchPresentPlayerIds, fetchTraining, formatClock, formatTrainingDate,
} from "@/lib/trainingDb";
import { supabase } from "@/integrations/supabase/client";

/**
 * De hele training op één A4. Staat buiten de app-layout en is altijd wit met zwarte tekst,
 * ook als de app in het donkere thema staat.
 */
export default function TrainingPrintPage() {
  const trainingId = Number(useParams().trainingId);
  const { data: training, isLoading: trainingLoading } = useQuery({ queryKey: ['training', trainingId], queryFn: () => fetchTraining(trainingId) });
  const { data: plan, isLoading: planLoading } = useQuery({ queryKey: ['trainingPlan', trainingId], queryFn: () => fetchPlan(trainingId), retry: false });
  const { data: drills = [] } = useQuery({ queryKey: ['drills'], queryFn: fetchDrills, retry: false });
  const { data: presentIds = [] } = useQuery({ queryKey: ['trainingPresent', trainingId], queryFn: () => fetchPresentPlayerIds(trainingId) });
  const { data: assignments = [] } = useQuery({
    queryKey: ['trainingAssignments', plan?.id], queryFn: () => fetchAssignments(plan!.id), enabled: !!plan, retry: false,
  });
  const { data: names } = useQuery({
    queryKey: ['playerNames'],
    queryFn: async () => {
      const { data, error } = await supabase.from('players').select('id, name');
      if (error) throw error;
      return new Map((data ?? []).map((p) => [p.id, p.name]));
    },
  });

  if (trainingLoading || planLoading) return <PageLoading />;
  if (!training || !plan) {
    return (
      <div className="min-h-screen bg-white p-8 text-slate-950">
        <p className="mb-4">Voor deze training is nog geen programma beschikbaar.</p>
        <Button asChild variant="outline" className="border-slate-300 bg-white text-slate-950"><Link to="/"><ArrowLeft className="mr-2 h-4 w-4" />Terug</Link></Button>
      </div>
    );
  }

  const playerCount = presentIds.length;
  const drillById = new Map(drills.map((d) => [d.id, d]));
  const times = blockTimes(training.training_at, plan.blocks);
  const theme = THEMES.find((t) => t.value === plan.theme)?.label.toLowerCase();
  const fieldCount = assignments.length ? (assignments.some((a) => a.field === 2) ? 2 : 1) : matchFormat(playerCount).teamSizes.length;
  const teamBoxes = Array.from({ length: fieldCount }, (_, i) => i + 1).flatMap((field) =>
    (['hesjes', 'zonder'] as const).map((side) => ({
      label: `${fieldCount > 1 ? `Veld ${field} · ` : ''}${side === 'hesjes' ? 'Hesjes' : 'Zonder'}`,
      players: assignments.filter((a) => a.field === field && a.side === side).map((a) => names?.get(a.player_id) ?? '').filter(Boolean),
    })));
  const extra = assignments.find((a) => a.side === 'extra');
  const material = [...new Set(plan.blocks.map((b) => drillById.get(b.drill_id)?.material).filter(Boolean))].join(' · ');

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <div className="flex gap-2 border-b border-slate-200 p-4 print:hidden">
        <Button asChild variant="outline" className="border-slate-300 bg-white text-slate-950 hover:bg-slate-100 hover:text-slate-950">
          <Link to={`/training/${trainingId}`}><ArrowLeft className="mr-2 h-4 w-4" />Terug</Link>
        </Button>
        <Button className="bg-[#006AC7] text-white hover:bg-[#00559F]" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Printen</Button>
      </div>

      <div className="mx-auto flex max-w-[794px] flex-col gap-4 p-8 print:max-w-none print:p-0">
        <header className="flex items-end justify-between border-b-2 border-slate-950 pb-3">
          <div>
            <p className="text-slate-500">Vriendenschaar 35+ · training{plan.status !== 'published' ? ' · concept' : ''}</p>
            <h1 className="text-3xl font-bold text-[#006AC7]">
              {formatTrainingDate(training.training_at)} · {formatClock(training.training_at)}–{endTime(training.training_at, plan.blocks)}
            </h1>
          </div>
          <p className="text-right">{playerCount} spelers{theme && <><br />Thema: {theme}</>}</p>
        </header>

        {plan.blocks.map((block, index) => {
          const slot = SLOTS[block.position - 1];
          const drill = drillById.get(block.drill_id);
          const fixed = slot?.key === 'vast';
          const isMatch = slot?.key === 'partijvorm';
          return (
            <section key={block.position} style={{ breakInside: 'avoid' }}
              className={fixed ? "grid grid-cols-[80px_150px_1fr] gap-4 rounded-lg border-2 border-[#006AC7] bg-slate-100 p-3" : "grid grid-cols-[80px_150px_1fr] gap-4 border-b border-slate-300 pb-3"}>
              <div><b className="block text-xl">{times[index]}</b>{block.minutes} min</div>
              {drill?.sketch
                ? <img src={drill.sketch} alt={`Schets ${drill.name}`} className="block h-[100px] w-[150px] rounded" />
                : <div className="h-[100px] w-[150px] rounded border border-slate-300" />}
              <div>
                <h2 className={fixed ? "text-lg font-semibold text-[#006AC7]" : "text-lg font-semibold"}>
                  {fixed ? drill?.name : `${slot?.label} · ${drill?.name ?? ''}`}
                </h2>
                <p className="leading-snug">{drill?.explanation}</p>
                <p className="leading-snug">
                  <b>{isMatch ? 'Indeling: ' : `Bij ${playerCount} spelers: `}</b>
                  {isMatch ? matchFormatText(playerCount) : drill ? variantText(drill, playerCount) : ''}
                </p>
                {drill && drill.coaching_points.length > 0 && <p className="leading-snug"><b>Let op:</b> {drill.coaching_points.join(' · ')}</p>}
                {isMatch && (
                  <>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {teamBoxes.map((box) => (
                        <div key={box.label} className="min-h-[34px] rounded-lg border border-slate-300 px-2 py-1">
                          <b>{box.label}:</b> {box.players.join(', ')}
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 leading-snug">
                      {extra
                        ? <><b>Extra speler: {names?.get(extra.player_id)}.</b> Speelt mee met het team dat als laatste een doelpunt tegen kreeg.</>
                        : 'Bij een oneven aantal speelt de extra speler mee met het team dat als laatste een doelpunt tegen kreeg.'}
                    </p>
                  </>
                )}
              </div>
            </section>
          );
        })}

        <footer className="flex justify-between gap-4 text-sm text-slate-500">
          <span>Materiaal: {material}</span>
          <span className="shrink-0">Vriendenschaar 35+</span>
        </footer>
      </div>
    </div>
  );
}
