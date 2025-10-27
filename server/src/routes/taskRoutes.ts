import express from "express";
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  bulkUpdateTasks,
  getTaskStats,
} from "../controllers/taskController";
import { protect } from "../middleware/auth";
import { validateTask } from "../middleware/validation";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Task statistics
router.get("/stats", getTaskStats);

// Bulk operations
router.patch("/bulk", bulkUpdateTasks);

// CRUD operations
router.route("/").get(getTasks).post(validateTask, createTask);

router
  .route("/:id")
  .get(getTask)
  .patch(validateTask, updateTask)
  .delete(deleteTask);

export default router;
