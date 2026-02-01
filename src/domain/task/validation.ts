export const REQUIRED_FIELDS = ["title", "category"];
export const OPTIONAL_FIELDS = ["deadline", "scheduledDate", "scheduledTime", "durationMinutes"];

export const INVALID_TITLES = [null, "", "タイトル未定", "（タイトル未定）", "タイトルなし"];

export function isValidTitle(title: string | null | undefined): boolean {
  if (!title) return false;

  const trimmed = title.trim();
  if (trimmed === "") return false;

  return !INVALID_TITLES.some(invalid => {
    if (invalid === null || invalid === "") {
      return false;
    }
    return trimmed === invalid || trimmed.includes(invalid);
  });
}

export function isTaskComplete(taskInfo: {
  title?: string | null;
  category?: string | null;
}): boolean {
  if (!isValidTitle(taskInfo.title)) {
    return false;
  }

  if (!taskInfo.category) {
    return false;
  }
  return true;
}
