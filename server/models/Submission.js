const mongoose = require("mongoose");
const submissionSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    talentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fileUrl: {
      type: String,
    },
    notes: {
      type: String,
    },
    reviewStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Request Revision"],
      default: "Pending",
    },
  },
  { timestamps: true },
);

submissionSchema.index({ taskId: 1, talentId: 1 }, { unique: true });

module.exports = mongoose.model("Submission", submissionSchema);
