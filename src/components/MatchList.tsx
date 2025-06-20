import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Calendar, Clock, UserCheck } from "lucide-react";

interface MatchWithCount {
    id: number;
    opponent: string;
    match_date: string | null;
    start_time: string | null;
    arrival_time: string | null;
    in_count: number;
    maybe_count: number;
    out_count: number;
    unknown_count: number;
}

const fetchMatches = async (): Promise<MatchWithCount[]> => {
    const { data: matches, error: matchesError } = await supabase
        .from("matches")
        .select(`id, opponent, match_date, start_time, arrival_time`)
        .order('match_date', { ascending: true });

    if (matchesError) throw matchesError;
    if (!matches) return [];

    const { data: statuses, error: statusesError } = await supabase
        .from("player_statuses")
        .select('match_id, status');

    if (statusesError) {
        console.error("Error fetching player statuses:", statusesError);
        // Return matches with 0 counts in case of an error
        return matches.map(match => ({ ...match, in_count: 0, maybe_count: 0, out_count: 0, unknown_count: 0 }));
    }

    // Get total number of players
    const { data: players, error: playersError } = await supabase
        .from("players")
        .select('id');

    if (playersError) {
        console.error("Error fetching players:", playersError);
        return matches.map(match => ({ ...match, in_count: 0, maybe_count: 0, out_count: 0, unknown_count: 0 }));
    }

    const totalPlayers = players?.length || 0;

    const statusCounts = (statuses || []).reduce((acc, { match_id, status }) => {
        if (!acc[match_id]) {
            acc[match_id] = { in_count: 0, maybe_count: 0, out_count: 0, unknown_count: 0 };
        }
        if (status === 'IN') {
            acc[match_id].in_count++;
        } else if (status === 'MAYBE') {
            acc[match_id].maybe_count++;
        } else if (status === 'OUT') {
            acc[match_id].out_count++;
        }
        return acc;
    }, {} as Record<number, { in_count: number, maybe_count: number, out_count: number, unknown_count: number }>);

    const matchesWithCounts = matches.map(match => {
        const counts = statusCounts[match.id] || { in_count: 0, maybe_count: 0, out_count: 0, unknown_count: 0 };
        const respondedCount = counts.in_count + counts.maybe_count + counts.out_count;
        const unknownCount = totalPlayers - respondedCount;
        
        return {
            ...match,
            ...counts,
            unknown_count: unknownCount
        };
    });

    return matchesWithCounts;
};

const MatchList = () => {
    const { data: matches, isLoading, error } = useQuery<MatchWithCount[]>({
        queryKey: ["matches"],
        queryFn: fetchMatches,
    });

    if (isLoading) return <div>Wedstrijden laden...</div>;
    if (error) return <div>Fout bij laden van wedstrijden.</div>;

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('nl-NL', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'Europe/Amsterdam'
        }).format(date);
    };

    const formatTime = (timeString: string | null) => {
        if (!timeString) return '';
        return timeString.substring(0, 5); // Format HH:MM from HH:MM:SS
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {matches?.map(match => (
                <Link to={`/match/${match.id}`} key={match.id} className="no-underline">
                    <Card className="hover:bg-muted/50 transition-colors h-full">
                        <CardHeader>
                            <CardTitle className="text-xl">{match.opponent}</CardTitle>
                            {match.match_date && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    <span className="text-sm">{formatDate(match.match_date)}</span>
                                </div>
                            )}
                            <div className="flex gap-4 text-sm text-muted-foreground">
                                {match.arrival_time && (
                                    <div className="flex items-center gap-1">
                                        <UserCheck className="h-4 w-4" />
                                        <span>Aanwezig: {formatTime(match.arrival_time)}</span>
                                    </div>
                                )}
                                {match.start_time && (
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        <span>Start: {formatTime(match.start_time)}</span>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center text-green-600 font-semibold">
                                    <span className="mr-2 text-lg">🍆</span>
                                    <span>{match.in_count} AANWEZIG</span>
                                </div>
                                <div className="flex items-center text-orange-500 font-semibold">
                                    <span className="mr-2 text-lg">❓</span>
                                    <span>{match.maybe_count} MISSCHIEN</span>
                                </div>
                                <div className="flex items-center text-red-600 font-semibold">
                                    <span className="mr-2 text-lg">❌</span>
                                    <span>{match.out_count} NIET</span>
                                </div>
                                <div className="flex items-center text-gray-500 font-semibold">
                                    <span className="mr-2 text-lg">➖</span>
                                    <span>{match.unknown_count} GEEN REACTIE</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    );
};

export default MatchList;
