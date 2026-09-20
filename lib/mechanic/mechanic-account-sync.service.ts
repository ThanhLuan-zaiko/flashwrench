import { MECHANIC_DIRECTORY_TOPIC } from "@/lib/realtime/protocol";
import { publishRealtimeEvent } from "@/lib/realtime/publish";
import { syncMechanicDirectory } from "./mechanic-directory.service";

export async function syncMechanicAccount(userId: string): Promise<void> {
  await syncMechanicDirectory(userId);
  void publishRealtimeEvent(MECHANIC_DIRECTORY_TOPIC, {
    kind: "mechanic-updated",
  });
}
