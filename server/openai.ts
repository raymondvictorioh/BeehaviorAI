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
      content: `You are an AI assistant for Beehave, a school behavior management system. You help teachers and administrators understand student behavior patterns, provide recommendations for interventions, and answer questions about behavior management best practices.

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

export async function generateMeetingSummary(notes: string, transcript: string): Promise<string> {
  try {
    const prompt = `You are an AI assistant helping to summarize a school meeting about student behavior. Based on the following notes and transcript, create a comprehensive, well-structured summary that captures:

1. Key discussion points
2. Important decisions made
3. Action items and next steps
4. Concerns raised
5. Positive observations

Meeting Notes:
${notes || "No notes provided"}

Meeting Transcript:
${transcript || "No transcript available"}

Please provide a clear, professional summary that would be useful for teachers and administrators reviewing this meeting later.`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an expert at summarizing educational meetings about student behavior. Create concise, actionable summaries that highlight key points, decisions, and task actions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_completion_tokens: 1500,
      temperature: 0.7,
    });

    return response.choices[0].message.content || "Unable to generate summary.";
  } catch (error) {
    console.error("OpenAI summary generation error:", error);
    throw new Error("Failed to generate meeting summary");
  }
}

export async function transcribeAudio(audioBuffer: Buffer, filename: string = "audio.webm"): Promise<{
  text: string;
  language?: string;
  segments?: Array<{ start: number; end: number; text: string }>;
}> {
  try {
    // Validate API key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }

    // Validate audio buffer
    if (!audioBuffer || audioBuffer.length === 0) {
      throw new Error("Audio buffer is empty");
    }

    // Determine MIME type from filename
    let mimeType = "audio/webm";
    if (filename.endsWith('.mp3')) mimeType = "audio/mpeg";
    else if (filename.endsWith('.m4a') || filename.endsWith('.mp4')) mimeType = "audio/mp4";
    else if (filename.endsWith('.ogg')) mimeType = "audio/ogg";
    else if (filename.endsWith('.wav')) mimeType = "audio/wav";

    console.log(`Creating File object: ${filename}, type: ${mimeType}, size: ${audioBuffer.length} bytes`);

    // Create a File-like object from Buffer for OpenAI SDK
    // Node.js 18+ supports File and Blob natively
    const audioFile = new File([audioBuffer], filename, { type: mimeType });
    
    console.log("Calling OpenAI Whisper API...");
    
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "en", // Optional: specify language for better accuracy
      response_format: "verbose_json", // Get detailed response with timestamps
    });

    // Type assertion for verbose_json response which includes segments
    const verboseResponse = transcription as any;

    const result = {
      text: transcription.text || "",
      language: transcription.language,
      segments: verboseResponse.segments || [], // Whisper segments with timestamps
    };

    console.log(`Whisper transcription completed: ${result.text.length} characters, ${result.segments.length} segments`);

    return result;
  } catch (error: any) {
    console.error("Whisper API error details:", {
      message: error.message,
      status: error.status,
      response: error.response?.data,
      name: error.name,
    });
    
    // Re-throw with more context
    if (error.response?.data) {
      throw new Error(`OpenAI API error: ${JSON.stringify(error.response.data)}`);
    }
    
    const errorMessage = error?.message || "Unknown error";
    throw new Error(`Failed to transcribe audio: ${errorMessage}`);
  }
}
