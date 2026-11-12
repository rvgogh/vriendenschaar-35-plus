import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { POSITIONS, POSITION_LABEL, type Position } from "@/lib/teamBuilder";

/**
 * Voorkeursposities op volgorde zetten. Bovenaan de gekozen posities (1 = liefst), daaronder de rest.
 * Posities die niet gekozen zijn, speelt iemand liever niet.
 */
export const PositionPreferences = ({ value, onChange, disabled }: {
  value: Position[]; onChange: (next: Position[]) => void; disabled?: boolean;
}) => {
  const rest = POSITIONS.filter((p) => !value.includes(p.value));
  const move = (index: number, delta: number) => {
    const next = [...value];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-semibold">Mijn volgorde</p>
        {value.length === 0 && <p className="text-sm text-muted-foreground">Nog niets gekozen. Tik hieronder op je favoriete positie.</p>}
        <ol className="divide-y border-y">
          {value.map((pos, i) => (
            <li key={pos} className="flex items-center gap-2 py-2">
              <span className="w-6 text-center font-bold text-primary">{i + 1}</span>
              <span className="flex-1">{POSITION_LABEL[pos]}</span>
              <Button variant="ghost" size="icon" disabled={disabled || i === 0} onClick={() => move(i, -1)} aria-label={`${POSITION_LABEL[pos]} omhoog`}>
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" disabled={disabled || i === value.length - 1} onClick={() => move(i, 1)} aria-label={`${POSITION_LABEL[pos]} omlaag`}>
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" disabled={disabled} onClick={() => onChange(value.filter((p) => p !== pos))} aria-label={`${POSITION_LABEL[pos]} weghalen`}>
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ol>
      </div>
      {rest.length > 0 && (
        <div>
          <p className="mb-2 text-sm text-muted-foreground">Liever niet (tik om toe te voegen)</p>
          <div className="flex flex-wrap gap-2">
            {rest.map((p) => (
              <Button key={p.value} variant="outline" size="sm" disabled={disabled} onClick={() => onChange([...value, p.value])}>
                <Plus className="mr-1 h-4 w-4" />{p.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
