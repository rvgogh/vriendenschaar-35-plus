import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Training } from "@/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import TrainingPlayerList from "./TrainingPlayerList";
import { Calendar, Users } from "lucide-react";
import TrainingStatusIndicator from "./TrainingStatusIndicator";

interface TrainingWithCount extends Training {
    yes_count: number;
}

const fetchTrainings = async (): Promise<TrainingWithCount[]> => {
    const { data: trainings, error: trainingsError } = await supabase
        .from("trainings")
        .select(`id, training_at`)
        .order('training_at', { ascending: true });

    if (trainingsError) throw trainingsError;
    if (!trainings) return [];

    const { data: statuses, error: statusesError } = await supabase
        .from("training_statuses")
        .select('training_id, status')
        .eq('status', 'YES');

    if (statusesError) {
        console.error("Error fetching training statuses:", statusesError);
        return trainings.map(training => ({ ...training, yes_count: 0 }));
    }

    const statusCounts = (statuses || []).reduce((acc, { training_id }) => {
        acc[training_id] = (acc[training_id] || 0) + 1;
        return acc;
    }, {} as Record<number, number>);

    const trainingsWithCounts = trainings.map(training => ({
        ...training,
        yes_count: statusCounts[training.id] || 0,
    }));

    return trainingsWithCounts;
};


const TrainingList = () => {
    const { data: trainings, isLoading, error } = useQuery<TrainingWithCount[]>({
        queryKey: ["trainings"],
        queryFn: fetchTrainings,
    });

    if (isLoading) return <div>Trainingen laden...</div>;
    if (error) return <div>Fout bij laden van trainingen.</div>;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('nl-NL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'Europe/Amsterdam'
        }).format(date);
    };

    return (
        <Accordion type="single" collapsible className="w-full">
            {trainings?.map((training) => (
                <AccordionItem value={`training-${training.id}`} key={training.id}>
                    <AccordionTrigger>
                        <div className="flex justify-between w-full pr-4 items-center">
                            <div className="flex flex-col items-start text-left gap-1">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-primary" />
                                    <span className="text-lg font-semibold">{formatDate(training.training_at)}</span>
                                </div>
                                <div className="pl-7">
                                    <TrainingStatusIndicator yesCount={training.yes_count} />
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Users className="h-5 w-5" />
                                <span>{training.yes_count} aanwezig</span>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <TrainingPlayerList trainingId={training.id} />
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    );
};

export default TrainingList;
