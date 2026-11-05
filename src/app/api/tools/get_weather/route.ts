import { weatherTool } from "@/lib/bolna/assist-tools";
import { toolRoute } from "@/lib/bolna/tool-route";

export const POST = toolRoute("get_weather", [], weatherTool);
