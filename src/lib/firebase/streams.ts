import streamsConfig from "../../../data/streams.json";

export type StreamMapping = { court: number; youtubeVideoId: string | null };

export const STREAMS: StreamMapping[] = streamsConfig.courts;

export function streamForCourt(court: number): StreamMapping | null {
  return STREAMS.find((s) => s.court === court) ?? null;
}
