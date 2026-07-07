import { useEffect, useRef } from "react";
import { useRevalidator } from "react-router";

export function useBucketStream(
  bucketId: string,
  onEvent: (type: "request" | "replay", record: any) => void,
) {
  const revalidator = useRevalidator();
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    const source = new EventSource(`/api/stream/${bucketId}`);

    const onOpen = () => revalidator.revalidate();
    const onRequest = (evt: MessageEvent) =>
      onEventRef.current("request", JSON.parse(evt.data));
    const onReplay = (evt: MessageEvent) =>
      onEventRef.current("replay", JSON.parse(evt.data));

    source.addEventListener("open", onOpen);
    source.addEventListener("request", onRequest);
    source.addEventListener("replay", onReplay);

    return () => {
      source.removeEventListener("open", onOpen);
      source.removeEventListener("request", onRequest);
      source.removeEventListener("replay", onReplay);
      source.close();
    };
  }, [bucketId]);
}
