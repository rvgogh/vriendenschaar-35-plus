// Utility functions for creating iCal export for matches

export interface MatchForICal {
  id: number;
  opponent: string;
  match_date: string | null;
  start_time: string | null;
  arrival_time: string | null;
}

// Helper function to format date and time for iCal format (YYYYMMDDTHHMMSSZ)
const formatDateTimeForICal = (date: Date): string => {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
};

// Helper function to create an iCal event from a match
const createICalEvent = (match: MatchForICal): string => {
  if (!match.match_date) return '';
  
  const matchDate = new Date(match.match_date);
  
  // Combine date with start time
  let startDateTime = new Date(matchDate);
  if (match.start_time) {
    const [hours, minutes] = match.start_time.split(':');
    startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  }
  
  // End time is 2 hours after start time (typical match duration)
  const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000);
  
  const startFormatted = formatDateTimeForICal(startDateTime);
  const endFormatted = formatDateTimeForICal(endDateTime);
  
  // Create description with arrival time if available
  let description = `Wedstrijd tegen ${match.opponent}`;
  if (match.arrival_time) {
    description += `\\nAanwezig zijn om: ${match.arrival_time}`;
  }
  
  return `BEGIN:VEVENT
UID:match-${match.id}@voetbalteam.nl
DTSTART:${startFormatted}
DTEND:${endFormatted}
SUMMARY:Wedstrijd - ${match.opponent}
DESCRIPTION:${description}
LOCATION:Sportpark
END:VEVENT`;
};

// Main function to generate iCal content for all matches
export const generateICalForMatches = (matches: MatchForICal[]): string => {
  const events = matches
    .filter(match => match.match_date) // Only include matches with dates
    .map(createICalEvent)
    .filter(event => event) // Remove empty events
    .join('\n');
  
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Voetbalteam//Wedstrijden//NL
CALSCALE:GREGORIAN
METHOD:PUBLISH
${events}
END:VCALENDAR`;
};

// Function to download iCal file
export const downloadICalFile = (content: string, filename: string = 'wedstrijden.ics') => {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};