import express from "express";
import {
  getTaskComments,
  createComment,
  updateComment,
  deleteComment,
} from "../controllers/commentController";
import { protect } from "../middleware/auth";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Comment routes
router
  .route("/tasks/:taskId/comments")
  .get(getTaskComments)
  .post(createComment);

router.route("/comments/:commentId").patch(updateComment).delete(deleteComment);

export default router;
