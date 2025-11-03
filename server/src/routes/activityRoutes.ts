import express from "express";
import {
  getActivities,
  getListActivitiesController,
  getTaskActivitiesController,
} from "../controllers/activityController";
import { protect } from "../middleware/auth";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Activity routes
router.get("/", getActivities);
router.get("/lists/:listId", getListActivitiesController);
router.get("/tasks/:taskId", getTaskActivitiesController);

export default router;
