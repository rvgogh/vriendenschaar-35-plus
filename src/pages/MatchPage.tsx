
import { useParams, Link } from "react-router-dom";
import PlayerList from "@/components/PlayerList";
import UpcomingMatch from "@/components/UpcomingMatch";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Match } from "@/types";

const fetchMatch = async (matchId: number) => {
    const { data, error } = await supabase
        .from("matches")
        .select("*")
        .eq("id", matchId)
        .single();
    if (error) throw error;
    return data;
}

const MatchPage = () => {
    const { id } = useParams<{ id: string }>();
    const matchId = Number(id);

    const { data: match, isLoading, error } = useQuery<Match>({
        queryKey: ["match", matchId],
        queryFn: () => fetchMatch(matchId),
        enabled: !!matchId,
    });

    if (isLoading) return <div className="container mx-auto px-4 py-8">Loading match details...</div>;
    if (error || !match) return <div className="container mx-auto px-4 py-8">Match not found.</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <header className="mb-8">
                <Button asChild variant="outline">
                    <Link to="/" className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to all matches
                    </Link>
                </Button>
            </header>
            <main>
                <UpcomingMatch match={match} />
                <PlayerList matchId={matchId} />
            </main>
        </div>
    );
};

export default MatchPage;
