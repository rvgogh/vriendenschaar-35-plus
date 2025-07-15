
import { useParams, Link } from "react-router-dom";
import PlayerList from "@/components/PlayerList";
import UpcomingMatch from "@/components/UpcomingMatch";
import LoginButton from "@/components/LoginButton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Match } from "@/types";

const fetchMatch = async (matchId: number) => {
    const { data, error } = await supabase
        .from("matches")
        .select("id, opponent, match_date, start_time, arrival_time")
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

    if (isLoading) return <div className="container mx-auto px-4 py-8 max-w-[800px]">Wedstrijd details laden...</div>;
    if (error || !match) return <div className="container mx-auto px-4 py-8 max-w-[800px]">Wedstrijd niet gevonden.</div>;

    return (
        <div className="container mx-auto px-4 py-8 max-w-[800px]">
            <header className="mb-8 flex justify-between items-start">
                <Button asChild variant="outline">
                    <Link to="/" className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Terug naar alle wedstrijden
                    </Link>
                </Button>
                <LoginButton />
            </header>
            <main>
                <UpcomingMatch match={match} />
                <PlayerList matchId={matchId} />
            </main>
        </div>
    );
};

export default MatchPage;
