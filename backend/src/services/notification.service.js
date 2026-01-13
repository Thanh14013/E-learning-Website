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

const buildCourseLink = (courseId) => `/courses/${courseId}`;

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
    title: `Course Enrollment Successful`,
    content: `You have successfully enrolled in course "${course?.title ?? "Course"
      }" with ${teacherName}.`,
    link: courseId ? `/courses/${courseId}` : undefined,
    metadata: {
      courseId,
      teacherId: toId(teacherId),
      studentId: toId(studentId),
    },
  });

  await createNotifications([teacherId], {
    type: "course",
    title: "New Student Enrolled",
    content: `${studentName} has enrolled in your course "${course?.title ?? "your course"
      }".`,
    link: courseId ? `/teacher/courses/${courseId}/analytics` : undefined,
    metadata: {
      action: 'enrollment',
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
  // Filter out teacher
  const teacherId = toId(course?.teacherId?._id || course?.teacherId);
  const recipients = (enrolledStudents || [])
    .map((s) => s?._id || s)
    .filter(id => toId(id) !== teacherId);

  if (recipients.length === 0) return;

  await createNotifications(recipients, {
    type: "session",
    title: "New Live Session Scheduled",
    content: `Session "${session?.title ?? "Live Session"}" has been scheduled.
Time: ${session?.scheduledAt
        ? new Date(session.scheduledAt).toLocaleString()
        : "Pending"
      }.`,
    link: courseId ? `/courses/${courseId}` : "/courses",
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
  // Filter out teacher
  const teacherId = toId(course?.teacherId?._id || course?.teacherId);
  const recipients = (enrolledStudents || [])
    .map((s) => s?._id || s)
    .filter(id => toId(id) !== teacherId);

  if (recipients.length === 0) return;

  await createNotifications(recipients, {
    type: "session",
    title: "Session Schedule Updated",
    content: `Session "${session?.title ?? "Live Session"}" has been updated.
New time: ${session?.scheduledAt
        ? new Date(session.scheduledAt).toLocaleString()
        : "Pending"
      }.`,
    link: courseId ? `/courses/${courseId}` : "/courses",
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
  // Filter out teacher
  const teacherId = toId(course?.teacherId?._id || course?.teacherId);
  const recipients = (enrolledStudents || [])
    .map((s) => s?._id || s)
    .filter(id => toId(id) !== teacherId);

  if (recipients.length === 0) return;

  await createNotifications(recipients, {
    type: "session_live",
    title: "Live Session In Progress",
    content: `Session "${session?.title ?? "Live Session"
      }" has started. Join now!`,
    link: courseId ? `/courses/${courseId}` : "/courses",
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
  // Filter out teacher
  const teacherId = toId(course?.teacherId?._id || course?.teacherId);
  const recipients = (enrolledStudents || [])
    .map((s) => s?._id || s)
    .filter(id => toId(id) !== teacherId);

  if (recipients.length === 0) return;

  await createNotifications(recipients, {
    type: "session",
    title: "Session Canceled",
    content: `Session "${session?.title ?? "Live Session"
      }" has been canceled. Please wait for updates.
${session?.cancellationReason ? `Reason: ${session.cancellationReason}` : ""
      }`.trim(),
    link: courseId ? `/courses/${courseId}` : "/courses",
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

  // Split recipients into teacher and students
  const teacherId = toId(course.teacherId);
  const creatorId = toId(creator?.id);

  const isTeacherRecipient = teacherId !== creatorId;
  const studentRecipients = (course.enrolledStudents || [])
    .map(id => toId(id))
    .filter(id => id !== creatorId && id !== teacherId);

  // Notify Teacher if applicable
  if (isTeacherRecipient) {
    await createNotifications([teacherId], {
      type: "discussion",
      title: "New Discussion",
      content: `${creator?.fullName ?? "A user"} created a new discussion "${discussion?.title ?? "new discussion"}"`,
      link: `/teacher/courses/${courseId}/analytics`,
      metadata: {
        courseId: toId(courseId),
        discussionId: toId(discussion?._id),
        creatorId
      }
    });
  }

  // Notify Students
  if (studentRecipients.length > 0) {
    await createNotifications(studentRecipients, {
      type: "discussion",
      title: "New Discussion",
      content: `${creator?.fullName ?? "A user"} created a new discussion "${discussion?.title ?? "new discussion"}".`,
      link: `/courses/${courseId}`,
      metadata: {
        courseId: toId(courseId),
        discussionId: toId(discussion?._id),
        creatorId
      }
    });
  }
};

export const notifyDiscussionLiked = async (
  targetUserId,
  courseId,
  discussion,
  liker
) => {
  // Determine if target is teacher
  const course = await Course.findById(courseId).select("teacherId");
  const isTargetTeacher = course && toId(course.teacherId) === toId(targetUserId);

  await createNotifications([targetUserId], {
    type: "discussion",
    title: "Your Discussion Received a Like",
    content: `${liker?.fullName ?? "A user"} liked your discussion "${discussion?.title ?? "your discussion"}"`,
    link: isTargetTeacher ? `/teacher/courses/${courseId}/analytics` : `/courses/${courseId}`,
    metadata: {
      courseId: toId(courseId),
      discussionId: toId(discussion?._id),
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
    title: "Discussion Pinned",
    content: `${teacher?.fullName ?? "Teacher"} pinned the discussion "${discussion?.title ?? "in course"
      }".`,
    link:
      discussion?._id
        ? `/discussions/${discussion._id}`
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
  // Determine if target is teacher
  const course = await Course.findById(courseId).select("teacherId");
  const isTargetTeacher = course && toId(course.teacherId) === toId(targetUserId);

  await createNotifications([targetUserId], {
    type: "discussion",
    title: "New Comment on Your Discussion",
    content: `${commenter?.fullName ?? "A user"} commented on your discussion "${discussionTitle ?? "your discussion"}".`,
    link: isTargetTeacher ? `/teacher/courses/${courseId}/analytics` : `/courses/${courseId}`,
    metadata: {
      courseId: toId(courseId),
      discussionId: toId(comment?.discussionId),
      commentId: toId(comment?._id),
      commenterId: toId(commenter?.id),
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
  // Determine if target is teacher
  const course = await Course.findById(courseId).select("teacherId");
  const isTargetTeacher = course && toId(course.teacherId) === toId(targetUserId);

  await createNotifications([targetUserId], {
    type: "discussion",
    title: "Reply to Your Comment",
    content: `${commenter?.fullName ?? "A user"} replied to your comment in discussion "${discussionTitle ?? ""}".`,
    link: isTargetTeacher ? `/teacher/courses/${courseId}/analytics` : `/courses/${courseId}`,
    metadata: {
      courseId: toId(courseId),
      discussionId: toId(comment?.discussionId),
      commentId: toId(comment?._id),
      parentId: toId(comment?.parentId),
      commenterId: toId(commenter?.id),
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
