
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Users } from "lucide-react";

interface MatchWithCount {
    id: number;
    opponent: string;
    in_count: number | null;
}

const fetchMatches = async (): Promise<MatchWithCount[]> => {
    const { data, error } = await supabase
        .from("matches")
        .select(`id, opponent`);

    if (error) throw error;
    if (!data) return [];

    const matchesWithCounts = await Promise.all(
        data.map(async (match) => {
            const { count, error: countError } = await supabase
                .from("player_statuses")
                .select('*', { count: 'exact', head: true })
                .eq('match_id', match.id)
                .eq('status', 'IN');

            if (countError) {
                console.error(`Error fetching count for match ${match.id}:`, countError);
                return { ...match, in_count: 0 };
            }

            return { ...match, in_count: count };
        })
    );

    return matchesWithCounts;
};

const MatchList = () => {
    const { data: matches, isLoading, error } = useQuery<MatchWithCount[]>({
        queryKey: ["matches"],
        queryFn: fetchMatches,
    });

    if (isLoading) return <div>Loading matches...</div>;
    if (error) return <div>Error loading matches.</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {matches?.map(match => (
                <Link to={`/match/${match.id}`} key={match.id} className="no-underline">
                    <Card className="hover:bg-muted/50 transition-colors h-full">
                        <CardHeader>
                            <CardTitle className="text-xl">{match.opponent}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center text-green-500 font-semibold">
                                <Users className="mr-2 h-5 w-5" />
                                <span>{match.in_count ?? 0} players IN</span>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    );
};

export default MatchList;
