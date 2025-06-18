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
import { Calendar, Eye, EyeOff } from "lucide-react";
import TrainingStatusIndicator from "./TrainingStatusIndicator";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface TrainingWithCount extends Training {
    yes_count: number;
}

interface TrainingListProps {
    nextActivityId?: number | null;
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

const TrainingList = ({ nextActivityId }: TrainingListProps) => {
    const [showPastTrainings, setShowPastTrainings] = useState(false);
    
    const { data: allTrainings, isLoading, error } = useQuery<TrainingWithCount[]>({
        queryKey: ["trainings"],
        queryFn: fetchTrainings,
    });

    if (isLoading) return <div>Trainingen laden...</div>;
    if (error) return <div>Fout bij laden van trainingen.</div>;

    const now = new Date();
    
    // Filter trainings based on whether they are in the past or future
    const upcomingTrainings = allTrainings?.filter(training => new Date(training.training_at) >= now) || [];
    const pastTrainings = allTrainings?.filter(training => new Date(training.training_at) < now) || [];
    
    // Show either upcoming trainings, or all trainings if toggle is on
    const trainingsToShow = showPastTrainings ? allTrainings : upcomingTrainings;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('nl-NL', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'Europe/Amsterdam'
        }).format(date);
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('nl-NL', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Europe/Amsterdam'
        }).format(date);
    };

    // Determine which training to expand by default
    let defaultExpandedTraining: string | undefined;
    
    if (nextActivityId && trainingsToShow?.some(training => training.id === nextActivityId)) {
        // If nextActivityId matches a training in our list, expand that one
        defaultExpandedTraining = `training-${nextActivityId}`;
    } else if (trainingsToShow && trainingsToShow.length > 0) {
        // Otherwise, expand the first upcoming training
        const firstUpcoming = trainingsToShow.find(training => new Date(training.training_at) >= now);
        if (firstUpcoming) {
            defaultExpandedTraining = `training-${firstUpcoming.id}`;
        } else {
            // If no upcoming trainings, expand the first one in the list
            defaultExpandedTraining = `training-${trainingsToShow[0].id}`;
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-primary">Trainingen</h2>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPastTrainings(!showPastTrainings)}
                    className="flex items-center gap-2"
                >
                    {showPastTrainings ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {showPastTrainings ? 'Verberg oude trainingen' : 'Toon oude trainingen'}
                </Button>
            </div>
            
            {showPastTrainings && pastTrainings.length > 0 && (
                <div className="text-sm text-muted-foreground">
                    Toont {upcomingTrainings.length} komende en {pastTrainings.length} eerdere trainingen
                </div>
            )}
            
            <Accordion type="single" collapsible className="w-full" defaultValue={defaultExpandedTraining}>
                {trainingsToShow?.map((training) => {
                    const isPast = new Date(training.training_at) < now;
                    return (
                        <AccordionItem value={`training-${training.id}`} key={training.id} className={isPast ? 'opacity-60' : ''}>
                            <AccordionTrigger>
                                <div className="flex justify-between w-full pr-4 items-center">
                                    <div className="flex flex-col items-start text-left gap-1">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-5 w-5 text-primary" />
                                            <div className="flex flex-col">
                                                <span className="text-lg font-semibold">{formatDate(training.training_at)}</span>
                                                <span className="text-sm text-muted-foreground">{formatTime(training.training_at)}</span>
                                            </div>
                                            {isPast && <span className="text-xs bg-muted px-2 py-1 rounded">Geweest</span>}
                                        </div>
                                        {!isPast && (
                                            <div className="pl-7">
                                                <TrainingStatusIndicator yesCount={training.yes_count} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <span className="text-lg">{training.yes_count} 🍆</span>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <TrainingPlayerList trainingId={training.id} />
                            </AccordionContent>
                        </AccordionItem>
                    )
                })}
            </Accordion>
        </div>
    );
};

export default TrainingList;
