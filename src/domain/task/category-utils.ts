import { Category } from "@/types/task";

export function normalizeCategory(value: string): Category {
  switch (value) {
    case "shopping":
    case "reply":
    case "work":
    case "personal":
    case "other":
      return value;
    default:
      return "other";
  }
}
