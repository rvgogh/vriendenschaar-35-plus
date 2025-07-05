
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Calendar, Clock, MapPin } from "lucide-react";

interface EventWithCount {
    id: number;
    title: string;
    subtitle: string | null;
    event_date: string | null;
    event_time: string | null;
    location: string | null;
    description: string | null;
    yes_count: number;
    maybe_count: number;
    no_count: number;
    unknown_count: number;
}

const fetchEvents = async (): Promise<EventWithCount[]> => {
    const { data: events, error: eventsError } = await supabase
        .from("events")
        .select(`id, title, subtitle, event_date, event_time, location, description`)
        .order('event_date', { ascending: true });

    if (eventsError) throw eventsError;
    if (!events) return [];

    const { data: statuses, error: statusesError } = await supabase
        .from("event_statuses")
        .select('event_id, status');

    if (statusesError) {
        console.error("Error fetching event statuses:", statusesError);
        return events.map(event => ({ ...event, yes_count: 0, maybe_count: 0, no_count: 0, unknown_count: 0 }));
    }

    // Get total number of players
    const { data: players, error: playersError } = await supabase
        .from("players")
        .select('id');

    if (playersError) {
        console.error("Error fetching players:", playersError);
        return events.map(event => ({ ...event, yes_count: 0, maybe_count: 0, no_count: 0, unknown_count: 0 }));
    }

    const totalPlayers = players?.length || 0;

    const statusCounts = (statuses || []).reduce((acc, { event_id, status }) => {
        if (!acc[event_id]) {
            acc[event_id] = { yes_count: 0, maybe_count: 0, no_count: 0, unknown_count: 0 };
        }
        if (status === 'YES') {
            acc[event_id].yes_count++;
        } else if (status === 'MAYBE') {
            acc[event_id].maybe_count++;
        } else if (status === 'NO') {
            acc[event_id].no_count++;
        }
        return acc;
    }, {} as Record<number, { yes_count: number, maybe_count: number, no_count: number, unknown_count: number }>);

    const eventsWithCounts = events.map(event => {
        const counts = statusCounts[event.id] || { yes_count: 0, maybe_count: 0, no_count: 0, unknown_count: 0 };
        const respondedCount = counts.yes_count + counts.maybe_count + counts.no_count;
        const unknownCount = totalPlayers - respondedCount;
        
        return {
            ...event,
            ...counts,
            unknown_count: unknownCount
        };
    });

    return eventsWithCounts;
};

const EventList = () => {
    const { data: events, isLoading, error } = useQuery<EventWithCount[]>({
        queryKey: ["events"],
        queryFn: fetchEvents,
    });

    if (isLoading) return <div>Evenementen laden...</div>;
    if (error) return <div>Fout bij laden van evenementen.</div>;

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
            {events?.map(event => (
                <Link to={`/event/${event.id}`} key={event.id} className="no-underline">
                    <Card className="hover:bg-muted/50 transition-colors h-full">
                        <CardHeader>
                            <CardTitle className="text-xl">{event.title}</CardTitle>
                            {event.subtitle && (
                                <p className="text-sm text-muted-foreground italic">{event.subtitle}</p>
                            )}
                            {event.event_date && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    <span className="text-sm">{formatDate(event.event_date)}</span>
                                </div>
                            )}
                            <div className="flex gap-4 text-sm text-muted-foreground">
                                {event.event_time && (
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        <span>{formatTime(event.event_time)}</span>
                                    </div>
                                )}
                                {event.location && (
                                    <div className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        <span className="truncate max-w-[200px]">{event.location}</span>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center text-green-600 font-semibold">
                                    <span className="mr-2 text-lg">🍆</span>
                                    <span>{event.yes_count} JA</span>
                                </div>
                                <div className="flex items-center text-orange-500 font-semibold">
                                    <span className="mr-2 text-lg">❓</span>
                                    <span>{event.maybe_count} MISSCHIEN</span>
                                </div>
                                <div className="flex items-center text-red-600 font-semibold">
                                    <span className="mr-2 text-lg">❌</span>
                                    <span>{event.no_count} NIET</span>
                                </div>
                                <div className="flex items-center text-gray-500 font-semibold">
                                    <span className="mr-2 text-lg">➖</span>
                                    <span>{event.unknown_count} GEEN REACTIE</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    );
};

export default EventList;
