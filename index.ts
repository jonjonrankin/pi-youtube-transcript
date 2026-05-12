import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { fetchTranscript } from "youtube-transcript";
import type { TranscriptResponse } from "youtube-transcript";

/** Extract a video ID from a URL or bare ID string. */
export function extractVideoId(input: string): string {
  // Bare 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;

  // Match known YouTube URL patterns
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/i,                              // ?v= or &v=
    /youtu\.be\/([a-zA-Z0-9_-]{11})/i,                         // youtu.be/ID
    /(?:www\.)?youtube\.com\/(?:embed|v|e)\/([a-zA-Z0-9_-]{11})/i,      // /embed/, /v/, /e/
    /(?:www\.)?youtube\.com\/(?:shorts|live)\/([a-zA-Z0-9_-]{11})(?:\/|$)/i, // /shorts/, /live/
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1];
  }

  // Pass through and let the library throw if invalid
  return input;
}

/** Format offset (ms) as a human-readable [MM:SS] or [HH:MM:SS] label. */
export function formatOffset(offsetMs: number): string {
  const totalSeconds = Math.floor(offsetMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `[${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}]`;
  }
  return `[${minutes}:${String(seconds).padStart(2, "0")}]`;
}

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "youtube_transcript",
    label: "YouTube Transcript",
    description: "Fetch the transcript of a YouTube video by URL or video ID.",
    promptSnippet: "Fetch a YouTube video transcript by URL or video ID.",
    promptGuidelines: [
      "Use youtube_transcript when the user asks about the content of a YouTube video.",
    ],
    parameters: Type.Object({
      videoIdOrUrl: Type.String({
        description: "YouTube video ID or full URL",
      }),
      lang: Type.Optional(
        Type.String({
          description:
            "Preferred language code (e.g., 'en'). Falls back to available transcript if omitted.",
        }),
      ),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const videoId = extractVideoId(params.videoIdOrUrl);
      const config = params.lang ? { lang: params.lang } : undefined;

      const segments: TranscriptResponse[] =
        await fetchTranscript(videoId, config);

      if (segments.length === 0) {
        throw new Error("No transcript available for this video.");
      }

      const text = segments
        .map((s) => `${formatOffset(s.offset)} ${s.text}`)
        .join("\n");

      return {
        content: [{ type: "text", text }],
        details: {
          videoId,
          language: segments[0]?.lang ?? undefined,
          segments: segments.map((s) => ({
            text: s.text,
            duration: s.duration,
            offset: s.offset,
          })),
        },
      };
    },
  });
}
