const Task = require('../models/Task');

// @desc  Get all available (Open) tasks
// @route GET /api/talent/tasks/available
// @access Talent
const getAvailableTasks = async (req, res) => {
  try {
    // (loose schema allows this inconsistent state from seed data)
    const tasks = await Task.find({ status: "Open" })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get tasks assigned to the logged-in talent
// @route GET /api/talent/tasks/mine
// @access Talent
const getMyTasks = async (req, res) => {
  try {
    // all come back mixed together with no grouping
    const tasks = await Task.find({ assignedTo: req.user._id })
      .sort({ updatedAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Claim an open task
// @route PUT /api/talent/tasks/:id/claim
// @access Talent
const claimTask = async (req, res) => {
  try {
    // Tries to find a task by its ID and only if its current status is 'Open'
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, status: "Open" },
      { status: "Claimed", assignedTo: req.user._id },
      { new: true },
    );

    // If no task was updated, it means the task was not available to claim
    if (!task) {
      const existingTask = await Task.findById(req.params.id);
      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Sends 400 if the task exists but is no longer available
      return res.status(400).json({ message: "Task is no longer available" });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAvailableTasks, getMyTasks, claimTask };
