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

export async function transcribeAudio(audioBuffer: Buffer, filename: string = "audio.webm"): Promise<{
  text: string;
  language?: string;
  segments?: Array<{ start: number; end: number; text: string }>;
}> {
  try {
    // Create a File-like object from Buffer for OpenAI SDK
    // Node.js 18+ supports File and Blob natively
    const audioFile = new File([audioBuffer], filename, { 
      type: filename.endsWith('.webm') ? "audio/webm" : 
            filename.endsWith('.mp3') ? "audio/mpeg" :
            filename.endsWith('.m4a') ? "audio/mp4" :
            "audio/webm"
    });
    
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "en", // Optional: specify language for better accuracy
      response_format: "verbose_json", // Get detailed response with timestamps
    });

    // Type assertion for verbose_json response which includes segments
    const verboseResponse = transcription as any;

    return {
      text: transcription.text || "",
      language: transcription.language,
      segments: verboseResponse.segments || [], // Whisper segments with timestamps
    };
  } catch (error: any) {
    console.error("Whisper API error:", error);
    const errorMessage = error?.message || "Unknown error";
    throw new Error(`Failed to transcribe audio: ${errorMessage}`);
  }
}
