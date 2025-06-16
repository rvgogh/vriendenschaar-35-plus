
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Users, HelpCircle, Calendar } from "lucide-react";

interface MatchWithCount {
    id: number;
    opponent: string;
    match_date: string | null;
    in_count: number;
    maybe_count: number;
}

const fetchMatches = async (): Promise<MatchWithCount[]> => {
    const { data: matches, error: matchesError } = await supabase
        .from("matches")
        .select(`id, opponent, match_date`)
        .order('match_date', { ascending: true });

    if (matchesError) throw matchesError;
    if (!matches) return [];

    const { data: statuses, error: statusesError } = await supabase
        .from("player_statuses")
        .select('match_id, status');

    if (statusesError) {
        console.error("Error fetching player statuses:", statusesError);
        // Return matches with 0 counts in case of an error
        return matches.map(match => ({ ...match, in_count: 0, maybe_count: 0 }));
    }

    const statusCounts = (statuses || []).reduce((acc, { match_id, status }) => {
        if (!acc[match_id]) {
            acc[match_id] = { in_count: 0, maybe_count: 0 };
        }
        if (status === 'IN') {
            acc[match_id].in_count++;
        } else if (status === 'MAYBE') {
            acc[match_id].maybe_count++;
        }
        return acc;
    }, {} as Record<number, { in_count: number, maybe_count: number }>);

    const matchesWithCounts = matches.map(match => ({
        ...match,
        in_count: statusCounts[match.id]?.in_count || 0,
        maybe_count: statusCounts[match.id]?.maybe_count || 0,
    }));

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
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Europe/Amsterdam'
        }).format(date);
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
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center text-primary font-semibold">
                                <Users className="mr-2 h-5 w-5" />
                                <span>{match.in_count} spelers AANWEZIG</span>
                            </div>
                            <div className="flex items-center text-muted-foreground font-semibold mt-2">
                                <HelpCircle className="mr-2 h-5 w-5" />
                                <span>{match.maybe_count} spelers MISSCHIEN</span>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    );
};

export default MatchList;
