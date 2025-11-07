// src/lib/utils.ts
export function calculatePriority(issues: string): "High" | "Medium" | "Low" {
  const urgentKeywords = [
    "emergency",
    "severe",
    "acute",
    "urgent",
    "critical",
    "bleeding",
    "chest pain",
  ];
  const highKeywords = ["pain", "fever", "infection", "injury"];

  const issuesLower = issues.toLowerCase();

  if (urgentKeywords.some((keyword) => issuesLower.includes(keyword))) {
    return "High";
  } else if (highKeywords.some((keyword) => issuesLower.includes(keyword))) {
    return "Medium";
  } else {
    return "Low";
  }
}

export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
