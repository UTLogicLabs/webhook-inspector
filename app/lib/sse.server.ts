import { EventEmitter } from "node:events";

export interface SsePayload {
  type: "request" | "replay";
  record: unknown;
}

const emitters = new Map<string, EventEmitter>();

function bus(bucketId: string): EventEmitter {
  let emitter = emitters.get(bucketId);
  if (!emitter) {
    emitter = new EventEmitter();
    emitter.setMaxListeners(50);
    emitters.set(bucketId, emitter);
  }
  return emitter;
}

export function publish(bucketId: string, payload: SsePayload): void {
  bus(bucketId).emit("event", payload);
}

export function subscribe(
  bucketId: string,
  callback: (payload: SsePayload) => void,
): () => void {
  const emitter = bus(bucketId);
  emitter.on("event", callback);
  return () => emitter.off("event", callback);
}
