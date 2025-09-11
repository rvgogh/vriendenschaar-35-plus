export const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Datum onbekend';
  const date = new Date(dateString);
  return date.toLocaleDateString('nl-NL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
};

export const formatDateLong = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('nl-NL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

export const formatTime = (timeString: string | null) => {
  if (!timeString) return '';
  return timeString.substring(0, 5);
};

export const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  const dateStr = formatDateLong(dateString);
  const timeStr = new Intl.DateTimeFormat('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
  
  return `${dateStr} om ${timeStr}`;
};
