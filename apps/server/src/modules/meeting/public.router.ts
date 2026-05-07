import { Elysia } from "elysia";
import { MeetingService } from "./service";

export const publicMeetingRouter = new Elysia({ prefix: "/public" })
  .options("/meetings/:token", ({ set }) => {
    set.headers["Access-Control-Allow-Origin"] = "*";
    set.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS";
    return "";
  })
  .get("/meetings", async ({ set }) => {
    set.headers["Access-Control-Allow-Origin"] = "*";
    return MeetingService.listPublicIndexed();
  })
  .get("/meetings/:token", async ({ params, set }) => {
    set.headers["Access-Control-Allow-Origin"] = "*";
    const meeting = await MeetingService.getByShareToken(params.token);
    if (!meeting) {
      set.status = 404;
      return { error: "Meeting not found" };
    }
    return meeting;
  });
