import mongoose from "mongoose";
import Report from "../models/report.model.js";
import Discussion from "../models/discussion.model.js";
import Comment from "../models/comment.model.js";
import Course from "../models/course.model.js";

const getContentInfo = async (type, contentId) => {
  if (!mongoose.Types.ObjectId.isValid(contentId)) return null;

  if (type === "discussion") {
    const discussion = await Discussion.findById(contentId)
      .populate("userId", "fullName email")
      .lean();
    if (!discussion) return null;
    return {
      authorId: discussion.userId?._id,
      preview: discussion.title || discussion.content?.slice(0, 200),
    };
  }

  if (type === "comment") {
    const comment = await Comment.findById(contentId)
      .populate("userId", "fullName email")
      .lean();
    if (!comment) return null;
    return {
      authorId: comment.userId?._id,
      preview: comment.content?.slice(0, 200),
    };
  }

  if (type === "course") {
    const course = await Course.findById(contentId)
      .populate("teacherId", "fullName email")
      .lean();
    if (!course) return null;
    return {
      authorId: course.teacherId?._id,
      preview: course.description?.slice(0, 200) || course.title,
    };
  }

  return null;
};

export const createReport = async (req, res) => {
  try {
    const { type, contentId, reason, description } = req.body;
    const reporterId = req.user.id;

    if (!type || !contentId || !reason) {
      return res.status(400).json({
        success: false,
        message: "type, contentId and reason are required.",
      });
    }

    if (!["discussion", "comment", "course"].includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid type." });
    }

    const contentInfo = await getContentInfo(type, contentId);
    if (!contentInfo) {
      return res
        .status(404)
        .json({ success: false, message: "Content not found." });
    }

    const report = await Report.create({
      type,
      contentId,
      reason,
      description,
      reportedBy: reporterId,
      author: contentInfo.authorId,
      contentPreview: contentInfo.preview,
    });

    return res.status(201).json({
      success: true,
      message: "Report submitted successfully.",
      data: report,
    });
  } catch (error) {
    console.error("Create report error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error while creating report." });
  }
};

export const getReports = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      filter.status = status;
    }

    const reports = await Report.find(filter)
      .populate("reportedBy", "fullName email")
      .populate("author", "fullName email")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error("Get reports error:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Server error while fetching reports.",
      });
  }
};

const updateReportStatus = async (req, res, status) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid report id." });
    }

    const report = await Report.findById(id);
    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Report not found." });
    }

    report.status = status;
    report.reviewedBy = req.user.id;
    if (status === "approved") {
      report.approvedAt = new Date();
      report.rejectedAt = null;
    }
    if (status === "rejected") {
      report.rejectedAt = new Date();
      report.approvedAt = null;
    }
    await report.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: `Report ${status}.`,
      data: report,
    });
  } catch (error) {
    console.error("Update report status error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error while updating report." });
  }
};

export const approveReport = (req, res) =>
  updateReportStatus(req, res, "approved");
export const rejectReport = (req, res) =>
  updateReportStatus(req, res, "rejected");
