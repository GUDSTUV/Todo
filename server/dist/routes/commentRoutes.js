"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const commentController_1 = require("../controllers/commentController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// All routes require authentication
router.use(auth_1.protect);
// Comment routes
router
    .route("/tasks/:taskId/comments")
    .get(commentController_1.getTaskComments)
    .post(commentController_1.createComment);
router.route("/comments/:commentId").patch(commentController_1.updateComment).delete(commentController_1.deleteComment);
exports.default = router;
