
import * as React from "react";

interface TrainingStatusIndicatorProps {
  yesCount: number;
}

const TrainingStatusIndicator = ({ yesCount }: TrainingStatusIndicatorProps) => {
  const needed = 8;
  const remaining = needed - yesCount;

  if (yesCount >= needed) {
    return (
      <div className="text-sm font-medium text-green-600 dark:text-green-400">
        Training gaat door!
      </div>
    );
  }

  if (remaining > 0 && remaining <= 2) {
    return (
      <div className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
        Nog maar {remaining} speler(s) nodig! Kom op!
      </div>
    );
  }
  
  if (remaining > 2) {
    return (
        <div className="text-sm font-medium text-red-600 dark:text-red-400">
            Nog {remaining} spelers nodig voor de training.
        </div>
    );
  }

  return null;
};

export default TrainingStatusIndicator;
