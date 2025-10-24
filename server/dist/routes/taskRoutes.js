"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const taskController_1 = require("../controllers/taskController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = express_1.default.Router();
// All routes require authentication
router.use(auth_1.protect);
// Task statistics
router.get('/stats', taskController_1.getTaskStats);
// Bulk operations
router.patch('/bulk', taskController_1.bulkUpdateTasks);
// CRUD operations
router.route('/')
    .get(taskController_1.getTasks)
    .post(validation_1.validateTask, taskController_1.createTask);
router.route('/:id')
    .get(taskController_1.getTask)
    .patch(validation_1.validateTask, taskController_1.updateTask)
    .delete(taskController_1.deleteTask);
exports.default = router;
