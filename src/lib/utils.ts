// src/lib/utils.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Initialize Gemini AI
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

/**
 * Calculate priority using Gemini AI based on medical issues/symptoms
 */
export async function calculatePriority(
  issues: string
): Promise<"High" | "Medium" | "Low"> {
  try {
    // Fallback to keyword-based if Gemini is not configured
    if (!genAI || !GEMINI_API_KEY) {
      console.warn(
        "Gemini API not configured, using fallback priority calculation"
      );
      return calculatePriorityFallback(issues);
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a medical triage assistant. Based on the following patient symptoms/medical issues, determine the urgency level.

Patient's symptoms/issues: "${issues}"

Classify the priority as ONE of the following:
- "High" - for emergency situations, severe symptoms, chest pain, difficulty breathing, severe bleeding, stroke symptoms, severe injuries, acute conditions requiring immediate attention
- "Medium" - for moderate symptoms like fever, infection, moderate pain, injuries that need prompt care but are not life-threatening
- "Low" - for minor issues, routine checkups, mild symptoms, general consultations, follow-ups

Respond with ONLY ONE WORD: High, Medium, or Low`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    // Parse response
    if (text.includes("High")) return "High";
    if (text.includes("Medium")) return "Medium";
    if (text.includes("Low")) return "Low";

    console.log(text);

    // If unable to parse, use fallback
    console.warn("Unable to parse Gemini response, using fallback");
    return calculatePriorityFallback(issues);
  } catch (error) {
    console.error("Gemini AI error:", error);
    // Fallback to keyword-based priority
    return calculatePriorityFallback(issues);
  }
}

/**
 * Fallback priority calculation using keywords
 */
function calculatePriorityFallback(issues: string): "High" | "Medium" | "Low" {
  const urgentKeywords = [
    "emergency",
    "severe",
    "acute",
    "urgent",
    "critical",
    "bleeding",
    "chest pain",
    "unconscious",
    "stroke",
    "heart attack",
    "difficulty breathing",
    "suicide",
    "overdose",
  ];

  const highKeywords = [
    "pain",
    "fever",
    "infection",
    "injury",
    "vomit",
    "diarrhea",
    "fracture",
    "burn",
  ];

  const issuesLower = issues.toLowerCase();

  if (urgentKeywords.some((keyword) => issuesLower.includes(keyword))) {
    return "High";
  } else if (highKeywords.some((keyword) => issuesLower.includes(keyword))) {
    return "Medium";
  } else {
    return "Low";
  }
}

/**
 * Utility function for combining class names
 */
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
