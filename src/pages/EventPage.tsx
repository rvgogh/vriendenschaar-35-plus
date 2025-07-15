
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import UpcomingEvent from "@/components/UpcomingEvent";
import EventPlayerList from "@/components/EventPlayerList";
import LoginButton from "@/components/LoginButton";
import { Event } from "@/types";

const fetchEvent = async (id: number): Promise<Event | null> => {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();
    
  if (error) {
    console.error("Error fetching event:", error);
    throw error;
  }
  return data;
};

const EventPage = () => {
  const { id } = useParams<{ id: string }>();
  
  const { data: event, isLoading, error } = useQuery({
    queryKey: ["event", id],
    queryFn: () => fetchEvent(Number(id)),
    enabled: !!id && !isNaN(Number(id)),
  });

  if (isLoading) return <div className="container mx-auto px-4 py-8">Evenement laden...</div>;
  if (error) return <div className="container mx-auto px-4 py-8">Fout bij laden van evenement.</div>;
  if (!event) return <div className="container mx-auto px-4 py-8">Evenement niet gevonden.</div>;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8 max-w-[800px]">
        <div className="mb-6 flex justify-between items-start">
          <Link to="/">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Terug naar overzicht
            </Button>
          </Link>
          <LoginButton />
        </div>
        
        <UpcomingEvent event={event} />
        
        <EventPlayerList eventId={event.id} />
      </div>
    </div>
  );
};

export default EventPage;
