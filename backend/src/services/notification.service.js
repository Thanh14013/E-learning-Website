import Notification from "../models/notification.model.js";
import Course from "../models/course.model.js";
import { getSocketIOInstance } from "../config/socket.config.js";
import { sendNotificationToUser } from "../socket/index.js";

const toId = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value._id) return value._id.toString();
  if (value.id) return value.id.toString();
  return value.toString();
};

const uniqueUserIds = (userIds = []) => {
  return Array.from(
    new Set(
      userIds
        .map((id) => toId(id))
        .filter((id) => typeof id === "string" && id.length > 0)
    )
  );
};

const safeGetIO = () => {
  try {
    return getSocketIOInstance();
  } catch (error) {
    console.error("Socket.IO not initialized:", error.message);
    return null;
  }
};

const buildSessionLink = (courseId, sessionId) =>
  `/courses/${courseId}/sessions/${sessionId}/join`;

const createNotifications = async (userIds, payload) => {
  const ids = uniqueUserIds(userIds);
  if (ids.length === 0) return [];

  const docs = await Notification.insertMany(
    ids.map((userId) => ({ ...payload, userId }))
  );

  const io = safeGetIO();
  if (io) {
    docs.forEach((doc) => {
      sendNotificationToUser(io, doc.userId.toString(), {
        _id: doc._id,
        userId: doc.userId,
        type: doc.type,
        title: doc.title,
        content: doc.content,
        link: doc.link,
        metadata: doc.metadata,
        isRead: doc.isRead,
        createdAt: doc.createdAt,
      });
    });
  }

  return docs;
};

export const notifyEnrollment = async (
  studentId,
  student,
  teacherId,
  teacher,
  course
) => {
  const courseId = toId(course?._id ?? course?.id ?? course);
  const studentName = student?.fullName || "Học viên";
  const teacherName = teacher?.fullName || "Giảng viên";

  await createNotifications([studentId], {
    type: "course",
    title: `Đăng ký khóa học thành công`,
    content: `Bạn đã đăng ký khóa học "${
      course?.title ?? "Khóa học"
    }" với ${teacherName}.`,
    link: courseId ? `/courses/${courseId}` : undefined,
    metadata: {
      courseId,
      teacherId: toId(teacherId),
      studentId: toId(studentId),
    },
  });

  await createNotifications([teacherId], {
    type: "course",
    title: "Học viên mới đăng ký",
    content: `${studentName} vừa đăng ký khóa học "${
      course?.title ?? "của bạn"
    }".`,
    link: courseId ? `/courses/${courseId}/students` : undefined,
    metadata: {
      courseId,
      teacherId: toId(teacherId),
      studentId: toId(studentId),
    },
  });
};

export const notifySessionScheduled = async (
  enrolledStudents,
  session,
  course
) => {
  const courseId = toId(course?._id ?? session?.courseId);
  const sessionId = toId(session?._id ?? session?.id);
  const recipients = (enrolledStudents || []).map((s) => s?._id || s);

  await createNotifications(recipients, {
    type: "session",
    title: "Buổi học trực tuyến mới",
    content: `Buổi học "${session?.title ?? "trực tuyến"}" đã được lên lịch.
Thời gian: ${
      session?.scheduledAt
        ? new Date(session.scheduledAt).toLocaleString()
        : "Đang cập nhật"
    }.`,
    link:
      courseId && sessionId ? buildSessionLink(courseId, sessionId) : undefined,
    metadata: {
      courseId,
      sessionId,
      status: session?.status ?? "scheduled",
      scheduledAt: session?.scheduledAt ?? null,
    },
  });
};

export const notifySessionUpdated = async (
  enrolledStudents,
  session,
  course
) => {
  const courseId = toId(course?._id ?? session?.courseId);
  const sessionId = toId(session?._id ?? session?.id);
  const recipients = (enrolledStudents || []).map((s) => s?._id || s);

  await createNotifications(recipients, {
    type: "session",
    title: "Cập nhật lịch buổi học",
    content: `Buổi học "${session?.title ?? "trực tuyến"}" đã được cập nhật.
Thời gian mới: ${
      session?.scheduledAt
        ? new Date(session.scheduledAt).toLocaleString()
        : "Đang cập nhật"
    }.`,
    link:
      courseId && sessionId ? buildSessionLink(courseId, sessionId) : undefined,
    metadata: {
      courseId,
      sessionId,
      status: session?.status ?? "scheduled",
      scheduledAt: session?.scheduledAt ?? null,
    },
  });
};

export const notifySessionStarted = async (
  enrolledStudents,
  session,
  course
) => {
  const courseId = toId(course?._id ?? session?.courseId);
  const sessionId = toId(session?._id ?? session?.id);
  const recipients = (enrolledStudents || []).map((s) => s?._id || s);

  await createNotifications(recipients, {
    type: "session",
    title: "Buổi học đang diễn ra",
    content: `Buổi học "${
      session?.title ?? "trực tuyến"
    }" đã bắt đầu. Tham gia ngay!`,
    link:
      courseId && sessionId ? buildSessionLink(courseId, sessionId) : undefined,
    metadata: {
      courseId,
      sessionId,
      status: "live",
      startedAt: session?.startedAt ?? new Date(),
    },
  });
};

export const notifySessionCanceled = async (
  enrolledStudents,
  session,
  course
) => {
  const courseId = toId(course?._id ?? session?.courseId);
  const sessionId = toId(session?._id ?? session?.id);
  const recipients = (enrolledStudents || []).map((s) => s?._id || s);

  await createNotifications(recipients, {
    type: "session",
    title: "Buổi học đã bị hủy",
    content: `Buổi học "${
      session?.title ?? "trực tuyến"
    }" đã bị hủy. Vui lòng chờ lịch cập nhật.
${
  session?.cancellationReason ? `Lý do: ${session.cancellationReason}` : ""
}`.trim(),
    link:
      courseId && sessionId ? buildSessionLink(courseId, sessionId) : undefined,
    metadata: {
      courseId,
      sessionId,
      status: "cancelled",
      scheduledAt: session?.scheduledAt ?? null,
      cancellationReason: session?.cancellationReason ?? null,
    },
  });
};

export const notifyDiscussionCreated = async (
  courseId,
  discussion,
  creator
) => {
  const course = await Course.findById(courseId).select(
    "teacherId enrolledStudents"
  );
  if (!course) return;

  const recipients = uniqueUserIds([
    course.teacherId,
    ...(course.enrolledStudents || []),
  ]).filter((id) => id !== toId(creator?.id));

  await createNotifications(recipients, {
    type: "discussion",
    title: "Thảo luận mới",
    content: `${creator?.fullName ?? "Một người dùng"} đã tạo thảo luận "${
      discussion?.title ?? "mới"
    }".
Tham gia trao đổi ngay!`,
    link:
      courseId && discussion?._id
        ? `/courses/${courseId}/discussions/${discussion._id}`
        : undefined,
    metadata: {
      courseId: toId(courseId),
      discussionId: toId(discussion?._id ?? discussion?.id),
      creatorId: toId(creator?.id),
    },
  });
};

export const notifyDiscussionLiked = async (
  targetUserId,
  courseId,
  discussion,
  liker
) => {
  await createNotifications([targetUserId], {
    type: "discussion",
    title: "Thảo luận của bạn được thích",
    content: `${liker?.fullName ?? "Một người dùng"} đã thích thảo luận "${
      discussion?.title ?? "của bạn"
    }".`,
    link:
      courseId && discussion?._id
        ? `/courses/${courseId}/discussions/${discussion._id}`
        : undefined,
    metadata: {
      courseId: toId(courseId),
      discussionId: toId(discussion?._id ?? discussion?.id),
      likerId: toId(liker?.id),
    },
  });
};

export const notifyDiscussionPinned = async (courseId, discussion, teacher) => {
  const course = await Course.findById(courseId).select(
    "teacherId enrolledStudents"
  );
  if (!course) return;

  const recipients = uniqueUserIds([
    course.teacherId,
    ...(course.enrolledStudents || []),
  ]).filter((id) => id !== toId(teacher?.id));

  await createNotifications(recipients, {
    type: "discussion",
    title: "Thảo luận được ghim",
    content: `${teacher?.fullName ?? "Giảng viên"} đã ghim thảo luận "${
      discussion?.title ?? "trong khóa học"
    }".`,
    link:
      courseId && discussion?._id
        ? `/courses/${courseId}/discussions/${discussion._id}`
        : undefined,
    metadata: {
      courseId: toId(courseId),
      discussionId: toId(discussion?._id ?? discussion?.id),
      teacherId: toId(teacher?.id),
    },
  });
};

export const notifyCommentCreated = async (
  courseId,
  targetUserId,
  comment,
  commenter,
  discussionTitle
) => {
  await createNotifications([targetUserId], {
    type: "discussion",
    title: "Bình luận mới trên thảo luận của bạn",
    content: `${
      commenter?.fullName ?? "Một người dùng"
    } đã bình luận trên thảo luận "${discussionTitle ?? "của bạn"}".`,
    link:
      courseId && comment?.discussionId
        ? `/courses/${courseId}/discussions/${comment.discussionId}`
        : undefined,
    metadata: {
      courseId: toId(courseId),
      discussionId: toId(comment?.discussionId),
      commentId: toId(comment?._id ?? comment?.id),
      commenterId: toId(commenter?.id ?? commenter?._id),
    },
  });
};

export const notifyCommentReply = async (
  courseId,
  targetUserId,
  comment,
  commenter,
  discussionTitle
) => {
  await createNotifications([targetUserId], {
    type: "discussion",
    title: "Có phản hồi cho bình luận của bạn",
    content: `${
      commenter?.fullName ?? "Một người dùng"
    } đã trả lời bình luận của bạn trong thảo luận "${discussionTitle ?? ""}".`,
    link:
      courseId && comment?.discussionId
        ? `/courses/${courseId}/discussions/${comment.discussionId}`
        : undefined,
    metadata: {
      courseId: toId(courseId),
      discussionId: toId(comment?.discussionId),
      commentId: toId(comment?._id ?? comment?.id),
      parentId: toId(comment?.parentId),
      commenterId: toId(commenter?.id ?? commenter?._id),
    },
  });
};

export default {
  notifyEnrollment,
  notifySessionScheduled,
  notifySessionUpdated,
  notifySessionStarted,
  notifySessionCanceled,
  notifyDiscussionCreated,
  notifyDiscussionLiked,
  notifyDiscussionPinned,
  notifyCommentCreated,
  notifyCommentReply,
};
