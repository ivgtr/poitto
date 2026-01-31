export function getJSTDate(): Date {
  const now = new Date();
  const jstOffset = 9 * 60 * 60 * 1000;
  return new Date(now.getTime() + jstOffset);
}

export function toJSTISOString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+09:00`;
}

export function parseTimeFromInput(input: string): { hour: number; minute: number } | null {
  const patterns = [
    /(\d{1,2})\s*時(?:\s*(\d{1,2})\s*分?)?/,
    /(\d{1,2}):(\d{2})/,
    /午前(\d{1,2})\s*時?(?:\s*(\d{1,2})\s*分?)?/,
    /午後(\d{1,2})\s*時?(?:\s*(\d{1,2})\s*分?)?/,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) {
      let hour = parseInt(match[1], 10);
      const minute = match[2] ? parseInt(match[2], 10) : 0;

      if (input.includes("午後") && hour !== 12) {
        hour += 12;
      }

      if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
        return { hour, minute };
      }
    }
  }

  return null;
}

export function createJSTScheduledAt(
  time: { hour: number; minute: number },
  daysFromNow: number = 1
): string {
  const jstNow = getJSTDate();
  const targetDate = new Date(jstNow);
  targetDate.setDate(targetDate.getDate() + daysFromNow);
  targetDate.setHours(time.hour, time.minute, 0, 0);

  return toJSTISOString(targetDate);
}
