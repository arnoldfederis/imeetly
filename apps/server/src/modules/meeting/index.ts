import { meetingModel } from "@repo/server/modules/meeting/model";
import { MeetingService } from "@repo/server/modules/meeting/service";
import { base, privateProcedure } from "@repo/server/procedure";

export const meetingController = base.router({
  create: privateProcedure
    .input(meetingModel.createRequest)
    .handler(async ({ input, context }) =>
      MeetingService.create(context.user.id, input),
    ),

  list: privateProcedure
    .input(meetingModel.listQuery)
    .handler(async ({ input, context }) =>
      MeetingService.list(context.user.id, input),
    ),

  dashboard: privateProcedure.handler(async ({ context }) => {
    const [stats, recent] = await Promise.all([
      MeetingService.getDashboardStats(context.user.id),
      MeetingService.getRecentMeetings(context.user.id),
    ]);
    return { stats, recent };
  }),

  getById: privateProcedure
    .input(meetingModel.byId)
    .handler(async ({ input, context }) =>
      MeetingService.getById(context.user.id, input.id),
    ),

  update: privateProcedure
    .input(meetingModel.updateRequest)
    .handler(async ({ input, context }) =>
      MeetingService.update(context.user.id, input),
    ),

  remove: privateProcedure
    .input(meetingModel.byId)
    .handler(async ({ input, context }) =>
      MeetingService.remove(context.user.id, input.id),
    ),

  process: privateProcedure
    .input(meetingModel.byId)
    .handler(async ({ input, context }) =>
      MeetingService.process(context.user.id, input.id),
    ),

  getStatus: privateProcedure
    .input(meetingModel.byId)
    .handler(async ({ input, context }) =>
      MeetingService.getStatus(context.user.id, input.id),
    ),

  getSummary: privateProcedure
    .input(meetingModel.byId)
    .handler(async ({ input, context }) =>
      MeetingService.getSummary(context.user.id, input.id),
    ),

  updateSummary: privateProcedure
    .input(meetingModel.updateSummaryRequest)
    .handler(async ({ input, context }) =>
      MeetingService.updateSummary(context.user.id, input),
    ),

  requestUpload: privateProcedure
    .input(meetingModel.uploadRequest)
    .handler(async ({ input, context }) =>
      MeetingService.requestUpload(context.user.id, input),
    ),

  completeUpload: privateProcedure
    .input(meetingModel.completeUpload)
    .handler(async ({ input, context }) =>
      MeetingService.completeUpload(context.user.id, input),
    ),

  usage: privateProcedure.handler(async ({ context }) =>
    MeetingService.getUsage(context.user.id),
  ),
});

export default meetingController;
