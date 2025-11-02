import { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RichTextEditor } from "./RichTextEditor";
import { Calendar, Mic, Square, User, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.date(),
  participants: z.array(z.string()),
  notes: z.string().optional(),
  transcript: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AddMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormData) => Promise<void>;
  isPending?: boolean;
}

// Waveform animation component with real-time audio visualization
function Waveform({ isRecording, audioStream }: { isRecording: boolean; audioStream: MediaStream | null }) {
  const [audioData, setAudioData] = useState<number[]>(Array(20).fill(0));
  const animationFrameRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!isRecording || !audioStream) {
      // Reset to default when not recording
      setAudioData(Array(20).fill(0));
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      return;
    }

    // Create AudioContext and AnalyserNode for real-time audio analysis
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 32; // Smaller FFT size for faster updates
    analyser.smoothingTimeConstant = 0.8; // Smooth transitions
    
    const source = audioContext.createMediaStreamSource(audioStream);
    source.connect(analyser);
    
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateWaveform = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Convert frequency data to bar heights (20 bars)
      const barCount = 20;
      const samplesPerBar = Math.floor(dataArray.length / barCount);
      const newAudioData: number[] = [];
      
      for (let i = 0; i < barCount; i++) {
        let sum = 0;
        for (let j = 0; j < samplesPerBar; j++) {
          sum += dataArray[i * samplesPerBar + j] || 0;
        }
        // Normalize to 0-100% (dataArray values are 0-255)
        const average = sum / samplesPerBar;
        newAudioData.push((average / 255) * 100);
      }
      
      setAudioData(newAudioData);
      animationFrameRef.current = requestAnimationFrame(updateWaveform);
    };

    updateWaveform();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [isRecording, audioStream]);

  return (
    <div className="flex items-center gap-0.5 h-6">
      {audioData.map((height, i) => {
        // Minimum height for visibility, scale up the visual impact
        const barHeight = Math.max(10, height * 0.8 + 10); // Scale 0-100% to 10-90%
        return (
          <div
            key={i}
            className="w-0.5 bg-primary rounded-full transition-all duration-75"
            style={{
              height: `${barHeight}%`,
              minHeight: "4px",
            }}
          />
        );
      })}
    </div>
  );
}

export function AddMeetingDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending = false,
}: AddMeetingDialogProps) {
  const { user } = useAuth();
  const [notesContent, setNotesContent] = useState("");
  const [transcriptContent, setTranscriptContent] = useState("");
  const [transcriptEntries, setTranscriptEntries] = useState<Array<{
    timestamp: string;
    speaker: string;
    text: string;
  }>>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [participants, setParticipants] = useState<string[]>(["Me"]);
  const [aiSummary, setAiSummary] = useState("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  
  // Recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const speakerCountRef = useRef<number>(1);
  const pendingChunksRef = useRef<Array<{ blob: Blob; timestamp: Date }>>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "Untitled meeting",
      date: new Date(),
      participants: ["Me"],
      notes: "",
      transcript: "",
    },
  });

  // Cleanup recording on unmount or close
  const cleanupRecording = useCallback(async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (open) {
      form.reset({
        title: "Untitled meeting",
        date: new Date(),
        participants: ["Me"],
        notes: "",
        transcript: "",
      });
      setNotesContent("");
      setTranscriptContent("");
      setTranscriptEntries([]);
      setParticipants(["Me"]);
      setIsRecording(false);
      setIsProcessing(false);
      setAiSummary("");
      setIsGeneratingSummary(false);
      speakerCountRef.current = 1;
      audioChunksRef.current = [];
      pendingChunksRef.current = [];
    }
    
    // Cleanup on unmount or close
    return () => {
      cleanupRecording();
    };
  }, [open, form, cleanupRecording]);

  // Generate AI summary from notes and transcript
  const generateSummary = async () => {
    if (!notesContent && !transcriptContent) {
      alert("Please add notes or transcript before generating a summary.");
      return;
    }

    setIsGeneratingSummary(true);
    try {
      const response = await fetch("/api/generate-meeting-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          notes: notesContent,
          transcript: transcriptContent,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate summary");
      }

      const data = await response.json();
      setAiSummary(data.summary);
    } catch (error: any) {
      console.error("Error generating summary:", error);
      alert(`Failed to generate summary: ${error.message}`);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Send audio chunk to Whisper API
  const transcribeChunk = async (audioBlob: Blob, timestamp: Date) => {
    try {
      console.log(`Transcribing chunk: ${audioBlob.size} bytes, type: ${audioBlob.type}`);
      
      // Convert blob to base64 (properly handle binary data)
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Convert to base64 more reliably
      let binaryString = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binaryString += String.fromCharCode(uint8Array[i]);
      }
      const base64Audio = btoa(binaryString);

      // Determine file extension from blob type
      let extension = "webm";
      if (audioBlob.type.includes("ogg")) extension = "ogg";
      else if (audioBlob.type.includes("mp4")) extension = "m4a";

      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          audio: base64Audio,
          filename: `chunk-${Date.now()}.${extension}`,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Transcription API error: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Transcription failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Transcription response:", data);
      
      // Only add entry if there's actual text (filter out empty or very short transcriptions)
      if (data.text && data.text.trim().length > 0) {
        // Remove common filler words and very short phrases that are likely noise
        const cleanedText = data.text.trim();
        
        // Only add if text seems meaningful (more than 2 characters and not just punctuation)
        if (cleanedText.length > 2 && /[a-zA-Z]/.test(cleanedText)) {
          // Add to transcript entries with timestamp and speaker
          const entry = {
            timestamp: format(timestamp, "HH:mm:ss"),
            speaker: `Speaker ${speakerCountRef.current}`,
            text: cleanedText,
          };

          setTranscriptEntries((prev) => {
            const updated = [...prev, entry];
            
            // Update full transcript content - simple format with timestamps
            const fullContent = updated.map(e => `[${e.timestamp}] ${e.speaker}: ${e.text}`).join('\n\n');
            
            setTranscriptContent(fullContent);
            
            // Auto-save to form
            form.setValue("transcript", fullContent);
            
            return updated;
          });
        } else {
          console.log("Skipping transcription - text too short or meaningless:", cleanedText);
        }
      } else {
        console.log("Empty transcription received");
      }

      return true;
    } catch (error: any) {
      console.error("Transcription error:", error);
      // Store chunk for retry only if it's a network/server error
      if (error.message && !error.message.includes("Invalid")) {
        pendingChunksRef.current.push({ blob: audioBlob, timestamp });
      }
      return false;
    }
  };

  // Retry failed chunks with exponential backoff
  const retryPendingChunks = async () => {
    const chunks = [...pendingChunksRef.current];
    pendingChunksRef.current = [];
    let retryCount = 0;
    const maxRetries = 3;

    for (const { blob, timestamp } of chunks) {
      let success = false;
      let attempts = 0;
      
      while (!success && attempts < maxRetries) {
        success = await transcribeChunk(blob, timestamp);
        if (!success) {
          attempts++;
          // Exponential backoff: wait 2^attempts seconds
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
        }
      }
      
      if (!success) {
        // Put back in queue if all retries failed
        pendingChunksRef.current.push({ blob, timestamp });
      }
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    setIsRecording(false);
    setIsProcessing(true);

    console.log("Stopping recording, processing final chunks...");

    // Wait a moment for any pending ondataavailable events
    await new Promise(resolve => setTimeout(resolve, 500));

    // Process any remaining chunks from the recorder
    if (audioChunksRef.current.length > 0) {
      console.log(`Processing ${audioChunksRef.current.length} remaining chunks`);
      const finalBlob = new Blob(audioChunksRef.current, { 
        type: mediaRecorderRef.current?.mimeType || "audio/webm" 
      });
      if (finalBlob.size > 1024) {
        await transcribeChunk(finalBlob, new Date());
      }
      audioChunksRef.current = [];
    }

    // Retry any pending chunks that failed
    if (pendingChunksRef.current.length > 0) {
      console.log(`Retrying ${pendingChunksRef.current.length} failed chunks`);
      await retryPendingChunks();
    }

    // Final transcription message
    setTranscriptContent((prev) => {
      let finalContent = prev;
      if (!prev || !prev.includes("[Transcription complete]")) {
        finalContent = prev ? prev + "\n\n[Transcription complete]" : "[Transcription complete]";
      }
      // Update form with final transcript
      form.setValue("transcript", finalContent);
      return finalContent;
    });
    
    setIsProcessing(false);
  };

  const startRecording = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000, // Whisper works best with 16kHz
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      console.log("Microphone access granted, stream active:", stream.active);
      audioStreamRef.current = stream;

      // Check for supported MIME types
      const mimeTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/mp4",
      ];
      
      let selectedMimeType = "audio/webm";
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          console.log("Selected audio format:", selectedMimeType);
          break;
        }
      }

      // Create MediaRecorder with supported format
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Handle errors
      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
      };

      // Collect and immediately transcribe audio chunks
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data && event.data.size > 0) {
          console.log(`Audio chunk received: ${event.data.size} bytes`);
          
          // Immediately send chunk for transcription (don't accumulate)
          const chunkBlob = new Blob([event.data], { type: selectedMimeType });
          
          // Only transcribe if chunk is large enough (at least 1KB to avoid empty chunks)
          if (chunkBlob.size > 1024) {
            transcribeChunk(chunkBlob, new Date()).catch((error) => {
              console.error("Error transcribing chunk:", error);
            });
          } else {
            console.log("Chunk too small, skipping transcription");
          }
        }
      };

      // Start recording with 3-second chunks for more responsive transcription
      // Whisper API works well with chunks as small as 0.1 seconds, but 3 seconds gives better context
      const chunkInterval = 3000; // 3 seconds
      mediaRecorder.start(chunkInterval);
      console.log(`Recording started with ${chunkInterval}ms intervals`);

      setIsRecording(true);
      setTranscriptContent("");
      setTranscriptEntries([]);
      speakerCountRef.current = 1;

      // Add initial feedback message
      setTranscriptContent("Listening... Speak now.");

    } catch (error: any) {
      console.error("Error starting recording:", error);
      alert(`Failed to start recording: ${error.message}. Please grant microphone permissions and ensure your microphone is working.`);
      setIsRecording(false);
    }
  };

  const handleRecord = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const handleSubmit = async (data: FormData) => {
    // Close dialog immediately for seamless UX (mutation handles optimistic updates)
    form.reset();
    setNotesContent("");
    setTranscriptContent("");
    setIsRecording(false);
    onOpenChange(false);
    // Fire mutation after closing dialog so UI updates immediately
    onSubmit({
      ...data,
      participants,
      notes: notesContent,
      transcript: transcriptContent,
    });
  };

  const addParticipant = () => {
    const name = prompt("Enter participant name:");
    if (name && name.trim()) {
      setParticipants([...participants, name.trim()]);
    }
  };

  const removeParticipant = (index: number) => {
    if (participants[index] !== "Me") {
      setParticipants(participants.filter((_, i) => i !== index));
    }
  };

  useEffect(() => {
    form.setValue("participants", participants);
  }, [participants, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 bg-background border-0 shadow-2xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-8">
              {/* Header Section */}
              <div className="space-y-6 mb-8">
                {/* Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          className="text-2xl font-semibold border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto bg-transparent"
                          placeholder="Untitled meeting"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Date and Participants */}
                <div className="flex items-center gap-6 flex-wrap">
                  {/* Date Selector */}
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <Input
                              type="date"
                              value={format(field.value, "yyyy-MM-dd")}
                              onChange={(e) => field.onChange(new Date(e.target.value))}
                              className="w-auto border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto bg-transparent text-muted-foreground"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

              {/* Participants */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Participants:</span>
                {participants.map((participant, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-2 px-3 py-1"
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-xs">
                        {participant === "Me" && user?.firstName
                          ? `${user.firstName[0]}${user.lastName?.[0] || ""}`
                          : participant[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs">{participant}</span>
                    {participant !== "Me" && (
                      <button
                        onClick={() => removeParticipant(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    )}
                  </Badge>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addParticipant}
                  className="h-7 text-xs"
                >
                  <User className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </div>

              {/* Tabs Section */}
              <Tabs defaultValue="notes" className="w-full">
                <TabsList className={`grid w-full max-w-md ${aiSummary ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                  <TabsTrigger value="transcript">Transcript</TabsTrigger>
                  {aiSummary && <TabsTrigger value="summary">Summary</TabsTrigger>}
                </TabsList>

                <TabsContent value="notes" className="mt-6">
                  <div className="border rounded-lg p-4 min-h-[400px]">
                    <RichTextEditor
                      content={notesContent}
                      onChange={setNotesContent}
                      placeholder="Start taking notes... (supports bullet lists, headings, etc.)"
                      className="min-h-[400px]"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="transcript" className="mt-6">
                  <div className="border rounded-lg p-4 min-h-[400px] max-h-[500px] overflow-y-auto">
                    {isRecording || isProcessing ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                          <span>{isProcessing ? "Finalizing transcription..." : "Recording in progress..."}</span>
                        </div>
                        {transcriptEntries.length > 0 ? (
                          <div className="space-y-3">
                            {transcriptEntries.map((entry, index) => (
                              <div key={index} className="border-l-2 border-primary pl-3 py-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-semibold text-muted-foreground">{entry.timestamp}</span>
                                  <span className="text-xs font-medium text-primary">{entry.speaker}</span>
                                </div>
                                <p className="text-sm text-foreground">{entry.text}</p>
                              </div>
                            ))}
                            {isRecording && (
                              <div className="text-xs text-muted-foreground italic">
                                Listening...
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-muted-foreground text-sm">
                            Transcription will appear here as you speak...
                          </div>
                        )}
                      </div>
                    ) : transcriptEntries.length > 0 ? (
                      <div className="space-y-3">
                        {transcriptEntries.map((entry, index) => (
                          <div key={index} className="border-l-2 border-primary/50 pl-3 py-2">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-muted-foreground">{entry.timestamp}</span>
                              <span className="text-xs font-medium text-primary">{entry.speaker}</span>
                            </div>
                            <p className="text-sm text-foreground">{entry.text}</p>
                          </div>
                        ))}
                        {transcriptContent.includes("[Transcription complete]") && (
                          <div className="text-xs text-green-600 dark:text-green-400 font-medium mt-2">
                            ✓ Transcription complete
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                        No transcript yet. Start recording to generate transcript.
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Summary Tab - Only shown after summary is generated */}
                {aiSummary && (
                  <TabsContent value="summary" className="mt-6">
                    <div className="border rounded-lg p-6 min-h-[400px] bg-muted/20">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-lg">AI-Generated Summary</h3>
                      </div>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <p className="whitespace-pre-wrap text-foreground leading-relaxed">
                          {aiSummary}
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </div>

        {/* Floating Record Button */}
        <div className="sticky bottom-0 left-0 right-0 p-6 bg-background/95 backdrop-blur-sm border-t flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              onClick={handleRecord}
              variant={isRecording ? "destructive" : "default"}
              size="lg"
              className="rounded-full h-14 w-14 p-0 shadow-lg hover:scale-105 transition-transform"
              data-testid="button-record"
            >
              {isRecording ? (
                <Square className="h-6 w-6" />
              ) : (
                <Mic className="h-6 w-6" />
              )}
            </Button>
                {isRecording && (
              <div className="flex items-center gap-3">
                <Waveform isRecording={isRecording} audioStream={audioStreamRef.current} />
                <span className="text-sm text-muted-foreground animate-pulse">Recording...</span>
              </div>
            )}
            {!isRecording && !aiSummary && (notesContent || transcriptContent) && (
              <Button
                type="button"
                onClick={generateSummary}
                disabled={isGeneratingSummary}
                variant="outline"
                className="gap-2"
                data-testid="button-generate-summary"
              >
                <Sparkles className="h-4 w-4" />
                {isGeneratingSummary ? "Generating..." : "Generate Summary"}
              </Button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending || isRecording}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || isRecording || isProcessing}
            >
              {isPending ? "Saving..." : "Save Meeting"}
            </Button>
          </div>
        </div>
        </form>
      </Form>
      </DialogContent>
    </Dialog>
  );
}
