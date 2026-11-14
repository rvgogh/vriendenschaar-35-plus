import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Calendar, Clock, UserCheck } from "lucide-react";
import { countMatchStatuses } from "@/lib/matchHelpers";

interface MatchWithCount {
    id: number;
    opponent: string;
    match_date: string | null;
    start_time: string | null;
    arrival_time: string | null;
    supporter_count: number;
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

    // Fetch all statuses with player KNVB info
    const { data: statuses, error: statusesError } = await supabase
        .from("player_statuses")
        .select(`
            match_id,
            player_id,
            status,
            players!inner(knvb_member)
        `);

    if (statusesError) {
        if (import.meta.env.DEV) console.error("Error fetching player statuses:", statusesError);
        return matches.map(match => ({ ...match, supporter_count: 0, in_count: 0, maybe_count: 0, out_count: 0, unknown_count: 0 }));
    }

    // Get all players (we need both totals: KNVB-only and all players)
    const { data: players, error: playersError } = await supabase
        .from("players")
        .select('id, knvb_member');

    if (playersError) {
        if (import.meta.env.DEV) console.error("Error fetching players:", playersError);
        return matches.map(match => ({ ...match, supporter_count: 0, in_count: 0, maybe_count: 0, out_count: 0, unknown_count: 0 }));
    }

    const matchesWithCounts = matches.map(match => {
        const counts = countMatchStatuses(players || [], (statuses || []).filter(s => s.match_id === match.id), match.opponent);
        return { ...match, in_count: counts.inCount, maybe_count: counts.maybeCount,
            out_count: counts.outCount, unknown_count: counts.unknownCount, supporter_count: counts.supporterCount };
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
                                <div className="flex items-center text-primary font-semibold"><span className="mr-2 text-lg">📣</span><span>{match.supporter_count} SUPPORTERS</span></div>
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
