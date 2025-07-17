
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Training } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Calendar, Clock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface TrainingWithCount extends Training {
    yes_count: number;
    no_count: number;
    unknown_count: number;
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
        .select('training_id, status');

    if (statusesError) {
        console.error("Error fetching training statuses:", statusesError);
        return trainings.map(training => ({ ...training, yes_count: 0, no_count: 0, unknown_count: 0 }));
    }

    // Get total number of players
    const { data: players, error: playersError } = await supabase
        .from("players")
        .select('id');

    if (playersError) {
        console.error("Error fetching players:", playersError);
        return trainings.map(training => ({ ...training, yes_count: 0, no_count: 0, unknown_count: 0 }));
    }

    const totalPlayers = players?.length || 0;

    const statusCounts = (statuses || []).reduce((acc, { training_id, status }) => {
        if (!acc[training_id]) {
            acc[training_id] = { yes_count: 0, no_count: 0, unknown_count: 0 };
        }
        if (status === 'YES') {
            acc[training_id].yes_count++;
        } else if (status === 'NO') {
            acc[training_id].no_count++;
        }
        return acc;
    }, {} as Record<number, { yes_count: number, no_count: number, unknown_count: number }>);

    const trainingsWithCounts = trainings.map(training => {
        const counts = statusCounts[training.id] || { yes_count: 0, no_count: 0, unknown_count: 0 };
        const respondedCount = counts.yes_count + counts.no_count;
        const unknownCount = totalPlayers - respondedCount;
        
        return {
            ...training,
            ...counts,
            unknown_count: unknownCount
        };
    });

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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {trainingsToShow?.map((training) => {
                    const isPast = new Date(training.training_at) < now;
                    const isNext = nextActivityId === training.id;
                    
                    return (
                        <Link to={`/training/${training.id}`} key={training.id} className="no-underline">
                            <Card className={`hover:bg-muted/50 transition-colors h-full ${isPast ? 'opacity-60' : ''} ${isNext ? 'ring-2 ring-primary' : ''}`}>
                                <CardHeader>
                                    <CardTitle className="text-xl flex items-center gap-2">
                                        <Calendar className="h-5 w-5 text-primary" />
                                        <div className="flex flex-col">
                                            <span>{formatDate(training.training_at)}</span>
                                            <span className="text-sm text-muted-foreground font-normal">{formatTime(training.training_at)}</span>
                                        </div>
                                        {isPast && <span className="text-xs bg-muted px-2 py-1 rounded ml-auto">Geweest</span>}
                                        {isNext && !isPast && <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded ml-auto">Volgende</span>}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="flex items-center text-green-600 font-semibold">
                                            <span className="mr-2 text-lg">🍆</span>
                                            <span>{training.yes_count} AANWEZIG</span>
                                        </div>
                                        <div className="flex items-center text-red-600 font-semibold">
                                            <span className="mr-2 text-lg">❌</span>
                                            <span>{training.no_count} NIET</span>
                                        </div>
                                        <div className="flex items-center text-gray-500 font-semibold col-span-2">
                                            <span className="mr-2 text-lg">➖</span>
                                            <span>{training.unknown_count} GEEN REACTIE</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default TrainingList;
