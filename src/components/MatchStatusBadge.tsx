import { cn } from "@/lib/utils";
import { matchStatusLabel } from "@/lib/matchHelpers";

interface MatchStatusBadgeProps {
  status: string | null | undefined;
  className?: string;
}

/**
 * Shows the status of a match (Gepland / Gespeeld / Afgelast) to the user.
 */
const MatchStatusBadge = ({ status, className }: MatchStatusBadgeProps) => (
  <span
    className={cn(
      "w-fit rounded px-2 py-0.5 text-xs font-medium",
      status === "cancelled"
        ? "bg-destructive text-destructive-foreground"
        : status === "played"
          ? "bg-secondary text-secondary-foreground"
          : "bg-muted text-muted-foreground",
      className
    )}
  >
    {matchStatusLabel(status)}
  </span>
);

export default MatchStatusBadge;
