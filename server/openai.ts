import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
// This is using OpenAI's API, which points to OpenAI's API servers and requires your own API key.
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function getChatCompletion(
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
  context?: { page: string; location: string }
): Promise<string> {
  try {
    const systemMessage = {
      role: "system" as const,
      content: `You are an AI assistant for BehaviorHub, a school behavior management system. You help teachers and administrators understand student behavior patterns, provide recommendations for interventions, and answer questions about behavior management best practices.

Context: The user is currently on the ${context?.page || "unknown"} page.

Your role:
- Provide helpful, actionable advice about student behavior management
- Analyze behavior patterns and trends when asked
- Suggest evidence-based intervention strategies
- Answer questions about behavior tracking and reporting
- Be supportive and professional in your tone
- Keep responses concise but informative

Remember: You're helping educators support students effectively.`,
    };

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [systemMessage, ...messages],
      max_completion_tokens: 2048,
    });

    return response.choices[0].message.content || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to get AI response");
  }
}
