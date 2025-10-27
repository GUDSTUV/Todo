"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateLogin = exports.validateSignup = exports.validateList = exports.validateTask = exports.checkValidation = void 0;
const express_validator_1 = require("express-validator");
// Middleware to check validation results
const checkValidation = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            error: "Validation failed",
            details: errors.array(),
        });
        return;
    }
    next();
};
exports.checkValidation = checkValidation;
// Task validation rules
exports.validateTask = [
    (0, express_validator_1.body)("title")
        .optional()
        .trim()
        .isLength({ min: 1, max: 500 })
        .withMessage("Title must be between 1 and 500 characters"),
    (0, express_validator_1.body)("description")
        .optional()
        .trim()
        .isLength({ max: 5000 })
        .withMessage("Description cannot exceed 5000 characters"),
    (0, express_validator_1.body)("status")
        .optional()
        .isIn(["todo", "in-progress", "done"])
        .withMessage("Status must be one of: todo, in-progress, done"),
    (0, express_validator_1.body)("priority")
        .optional()
        .isIn(["low", "medium", "high", "urgent"])
        .withMessage("Priority must be one of: low, medium, high, urgent"),
    (0, express_validator_1.body)("tags").optional().isArray().withMessage("Tags must be an array"),
    (0, express_validator_1.body)("tags.*")
        .optional()
        .isString()
        .trim()
        .withMessage("Each tag must be a string"),
    (0, express_validator_1.body)("dueDate")
        .optional()
        .isISO8601()
        .withMessage("Due date must be a valid ISO 8601 date"),
    (0, express_validator_1.body)("reminderDate")
        .optional()
        .isISO8601()
        .withMessage("Reminder date must be a valid ISO 8601 date"),
    (0, express_validator_1.body)("listId")
        .optional()
        .isMongoId()
        .withMessage("List ID must be a valid MongoDB ObjectId"),
    (0, express_validator_1.body)("order")
        .optional()
        .isInt({ min: 0 })
        .withMessage("Order must be a non-negative integer"),
    (0, express_validator_1.body)("subtasks")
        .optional()
        .isArray()
        .withMessage("Subtasks must be an array"),
    (0, express_validator_1.body)("subtasks.*.title")
        .optional()
        .trim()
        .isLength({ min: 1 })
        .withMessage("Subtask title is required"),
    (0, express_validator_1.body)("subtasks.*.done")
        .optional()
        .isBoolean()
        .withMessage("Subtask done must be a boolean"),
    exports.checkValidation,
];
// List validation rules
exports.validateList = [
    (0, express_validator_1.body)("name")
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage("List name must be between 1 and 100 characters"),
    (0, express_validator_1.body)("description")
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage("Description cannot exceed 500 characters"),
    (0, express_validator_1.body)("color")
        .optional()
        .matches(/^#[0-9A-F]{6}$/i)
        .withMessage("Color must be a valid hex color code"),
    (0, express_validator_1.body)("icon")
        .optional()
        .isString()
        .trim()
        .withMessage("Icon must be a string"),
    (0, express_validator_1.body)("order")
        .optional()
        .isInt({ min: 0 })
        .withMessage("Order must be a non-negative integer"),
    (0, express_validator_1.body)("isDefault")
        .optional()
        .isBoolean()
        .withMessage("isDefault must be a boolean"),
    (0, express_validator_1.body)("isArchived")
        .optional()
        .isBoolean()
        .withMessage("isArchived must be a boolean"),
    exports.checkValidation,
];
// Auth validation rules
exports.validateSignup = [
    (0, express_validator_1.body)("name")
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage("Name must be between 1 and 100 characters"),
    (0, express_validator_1.body)("email")
        .trim()
        .isEmail()
        .normalizeEmail()
        .withMessage("Please provide a valid email"),
    (0, express_validator_1.body)("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage("Password must contain at least one lowercase letter, one uppercase letter, and one number"),
    exports.checkValidation,
];
exports.validateLogin = [
    (0, express_validator_1.body)("email")
        .trim()
        .isEmail()
        .normalizeEmail()
        .withMessage("Please provide a valid email"),
    (0, express_validator_1.body)("password").notEmpty().withMessage("Password is required"),
    exports.checkValidation,
];
