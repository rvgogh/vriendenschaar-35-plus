import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { matchStatusOptions } from "@/lib/matchHelpers";

export type AttendanceVariant = "training" | "match" | "event";

export type TrainingStatus = "YES" | "NO" | "UNKNOWN";
export type MatchStatus = "IN" | "SUPPORTER" | "MAYBE" | "OUT" | "UNKNOWN";
export type EventStatus = "YES" | "MAYBE" | "NO" | "UNKNOWN";

type AttendanceStatus = TrainingStatus | MatchStatus | EventStatus;

interface AttendanceButtonsProps {
  variant: AttendanceVariant;
  currentStatus: AttendanceStatus;
  onStatusChange: (status: AttendanceStatus) => void;
  className?: string;
  canPlay?: boolean;
}

const STATUS_CONFIG = {
  training: {
    statuses: ["YES", "NO", "UNKNOWN"] as const,
    buttons: [
      { status: "YES" as const, emoji: "🍆", label: "Aanwezig", ringColor: "ring-primary" },
      { status: "NO" as const, emoji: "❌", label: "Afwezig", ringColor: "ring-destructive" },
    ]
  },
  match: {
    statuses: ["IN", "MAYBE", "OUT", "UNKNOWN", "SUPPORTER"] as const,
    buttons: [
      { status: "IN" as const, emoji: "🍆", label: "Aanwezig", ringColor: "ring-primary" },
      { status: "MAYBE" as const, emoji: "❓", label: "Misschien", ringColor: "ring-orange-500" },
      { status: "OUT" as const, emoji: "❌", label: "Afwezig", ringColor: "ring-destructive" },
      { status: "SUPPORTER" as const, emoji: "📣", label: "Supporter", ringColor: "ring-primary" },
    ]
  },
  event: {
    statuses: ["YES", "MAYBE", "NO", "UNKNOWN"] as const,
    buttons: [
      { status: "YES" as const, emoji: "🍆", label: "Ja", ringColor: "ring-primary" },
      { status: "MAYBE" as const, emoji: "❓", label: "Misschien", ringColor: "ring-orange-500" },
      { status: "NO" as const, emoji: "❌", label: "Nee", ringColor: "ring-destructive" },
    ]
  }
};

export const AttendanceButtons = ({ 
  variant, 
  currentStatus, 
  onStatusChange, 
  className,
  canPlay = true,
}: AttendanceButtonsProps) => {
  const config = STATUS_CONFIG[variant];
  
  return (
    <div className={cn("flex gap-2", className)}>
      {config.buttons.filter(button => variant !== 'match' || matchStatusOptions(canPlay).some(status => status === button.status)).map(({ status, emoji, label, ringColor }) => (
        <Button
          key={status}
          variant="outline"
          size="sm"
          onClick={() => onStatusChange(currentStatus === status ? "UNKNOWN" : status)}
          className={cn(
            "text-xl h-10 w-10 shrink-0 p-0 sm:h-12 sm:w-12",
            currentStatus === status && `ring-2 ${ringColor}`
          )}
          aria-label={`${label} - ${currentStatus === status ? 'Verwijder status' : `Stel in op ${label}`}`}
          aria-pressed={currentStatus === status}
          title={label}
        >
          {emoji}
        </Button>
      ))}
    </div>
  );
};
