"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const validation_1 = require("../middleware/validation");
const router = express_1.default.Router();
// POST /api/auth/signup
router.post('/signup', validation_1.validateSignup, authController_1.signup);
// POST /api/auth/login
router.post('/login', validation_1.validateLogin, authController_1.login);
exports.default = router;
