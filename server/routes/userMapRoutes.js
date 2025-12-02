const express = require("express");
const router = express.Router();
const { getUserMapData } = require("../controllers/userMapController");
const authMiddleware = require("../middleware/auth");

// GET /api/admin/user-map - Get all users with working regions for map visualization
router.get("/", authMiddleware(["superadmin", "admin"]), getUserMapData);

module.exports = router;