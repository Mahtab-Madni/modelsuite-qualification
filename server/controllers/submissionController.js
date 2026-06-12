const Submission = require("../models/Submission");
const Task = require("../models/Task");

// @desc  Submit a task with a file upload
// @route POST /api/submissions/:taskId
// @access Talent (protect middleware only — no role check)
const submitTask = async (req, res) => {
  const { taskId } = req.params;
  const { notes } = req.body;

  try {
    if (req.user.role !== "Talent") {
      return res.status(403).json({ message: "Only talents can submit tasks" });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (task.assignedTo?.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You are not assigned to this task" });
    }

    if (!["Claimed", "Submitted", "Request Revision"].includes(task.status)) {
      return res
        .status(400)
        .json({ message: "Task is not available for submission" });
    }

    const fileUrl = req.file
      ? `${process.env.BASE_URL || "http://localhost:5000"}/uploads/${req.file.filename}`
      : req.body.fileUrl || null;

    let submission = await Submission.findOne({
      taskId,
      talentId: req.user._id,
    });

    if (submission) {
      submission.fileUrl = fileUrl;
      submission.notes = notes;
      submission.reviewStatus = "Pending";
      await submission.save();
    } else {
      submission = await Submission.create({
        taskId,
        talentId: req.user._id,
        fileUrl,
        notes,
        reviewStatus: "Pending",
      });
    }

    await Task.findByIdAndUpdate(taskId, { status: "Submitted" });

    res.status(201).json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get submission for a specific task (admin use)
// @route GET /api/submissions/:taskId
// @access Protect only — no admin guard
const getSubmission = async (req, res) => {
  try {
    const submission = await Submission.findOne({
      taskId: req.params.taskId,
    }).populate("talentId", "name email");

    if (!submission) {
      return res.status(404).json({ message: "No submission found for this task" });
    }

    const ownerId = submission.talentId?._id
      ? submission.talentId._id.toString()
      : submission.talentId?.toString();
      
    if (req.user.role !== "Admin" && ownerId !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get ALL submissions (for Admin review queue)
// @route GET /api/submissions/admin/all
// @access Admin
const getAllSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({})
      .populate("taskId", "title dueDate status")
      .populate("talentId", "name email")
      .sort({ createdAt: -1 });

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Approve or Reject a submission
// @route PUT /api/submissions/:id/review
// @access Admin
const reviewSubmission = async (req, res) => {
  const { reviewStatus } = req.body;

  try {
    if (!["Approved", "Rejected", "Request Revision"].includes(reviewStatus)) {
      return res.status(400).json({ message: "Invalid review status" });
    }

    const submission = await Submission.findByIdAndUpdate(
      req.params.id,
      { reviewStatus },
      { new: true },
    )
      .populate("taskId", "title status")
      .populate("talentId", "name email");

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    const taskId = submission.taskId?._id || submission.taskId;
    const taskStatus =
      reviewStatus === "Request Revision" ? "Request Revision" : reviewStatus;
    await Task.findByIdAndUpdate(taskId, { status: taskStatus });

    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  submitTask,
  getSubmission,
  getAllSubmissions,
  reviewSubmission,
};
