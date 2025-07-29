const express = require('express');
const router = express.Router();
const authMiddleware = require("../middleware/auth");

const {
  assignBatchToDistributor,
  getAssignments,
  updateAssignmentStatus
} = require('../controllers/assignmentController');

const { getRecentAssignments } = require('../controllers/recentAssignmentsController');

// Assign batch to distributor
router.post('/batches/:batchNumber/assign', authMiddleware(["manufacturer"]), assignBatchToDistributor);

// Get all assignments for manufacturer
router.get('/assignments', authMiddleware(["manufacturer"]), getAssignments);

// Update assignment status
router.patch('/assignments/:assignmentId', authMiddleware(["manufacturer"]), updateAssignmentStatus);

// Get recent assignments with tracking info
router.get('/recent-assignments', authMiddleware(["manufacturer"]), getRecentAssignments);

module.exports = router;
