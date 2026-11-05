import { searchTool } from "@/lib/bolna/assist-tools";
import { toolRoute } from "@/lib/bolna/tool-route";

export const POST = toolRoute("web_search", ["query"], searchTool);
