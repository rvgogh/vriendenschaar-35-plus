import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Player, Match, Training, Event } from "@/types/database";

export const useMyPlayer = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["myPlayer", userId],
    queryFn: async () => {
      if (!userId) throw new Error("No user ID provided");
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (error) throw error;
      return data as Player;
    },
    enabled: !!userId,
  });
};

export const useUpcomingMatches = () => {
  return useQuery({
    queryKey: ["upcomingMatches"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .gte("match_date", today.toISOString())
        .order("match_date", { ascending: true });
      if (error) throw error;
      return data as Match[];
    },
  });
};

export const useUpcomingTrainings = () => {
  return useQuery({
    queryKey: ["upcomingTrainings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trainings")
        .select("*")
        .gte("training_at", new Date().toISOString())
        .order("training_at", { ascending: true });
      if (error) throw error;
      return data as Training[];
    },
  });
};

export const useTodaysTrainings = () => {
  return useQuery({
    queryKey: ["todaysTrainings"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const { data, error } = await supabase
        .from("trainings")
        .select("*")
        .gte("training_at", today.toISOString())
        .lt("training_at", tomorrow.toISOString())
        .order("training_at", { ascending: true });
      if (error) throw error;
      return data as Training[];
    },
  });
};

export const useUpcomingEvents = () => {
  return useQuery({
    queryKey: ["upcomingEvents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .gte("event_date", new Date().toISOString().split('T')[0])
        .order("event_date", { ascending: true });
      if (error) throw error;
      return data as Event[];
    },
  });
};
