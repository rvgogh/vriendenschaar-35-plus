
import { useParams, Link } from "react-router-dom";
import TrainingPlayerList from "@/components/TrainingPlayerList";
import UpcomingTraining from "@/components/UpcomingTraining";
import LoginButton from "@/components/LoginButton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Training } from "@/types";

const fetchTraining = async (trainingId: number) => {
    const { data, error } = await supabase
        .from("trainings")
        .select("id, training_at")
        .eq("id", trainingId)
        .single();
    if (error) throw error;
    return data;
}

const TrainingPage = () => {
    const { id } = useParams<{ id: string }>();
    const trainingId = Number(id);

    const { data: training, isLoading, error } = useQuery<Training>({
        queryKey: ["training", trainingId],
        queryFn: () => fetchTraining(trainingId),
        enabled: !!trainingId,
    });

    if (isLoading) return <div className="container mx-auto px-4 py-8 max-w-[800px]">Training details laden...</div>;
    if (error || !training) return <div className="container mx-auto px-4 py-8 max-w-[800px]">Training niet gevonden.</div>;

    return (
        <div className="container mx-auto px-4 py-8 max-w-[800px]">
            <header className="mb-8 flex justify-between items-start">
                <Button asChild variant="outline">
                    <Link to="/" className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Terug naar alle trainingen
                    </Link>
                </Button>
                <LoginButton />
            </header>
            <main>
                <UpcomingTraining training={training} />
                <TrainingPlayerList trainingId={trainingId} />
            </main>
        </div>
    );
};

export default TrainingPage;
