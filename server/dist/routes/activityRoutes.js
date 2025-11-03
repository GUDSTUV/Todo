"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const activityController_1 = require("../controllers/activityController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// All routes require authentication
router.use(auth_1.protect);
// Activity routes
router.get("/", activityController_1.getActivities);
router.get("/lists/:listId", activityController_1.getListActivitiesController);
router.get("/tasks/:taskId", activityController_1.getTaskActivitiesController);
exports.default = router;
