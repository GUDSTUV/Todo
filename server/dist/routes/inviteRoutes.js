"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const inviteController_1 = require("../controllers/inviteController");
const router = (0, express_1.Router)();
// Get invite details (public - no auth required)
router.get("/:token", inviteController_1.getInvite);
// Accept invite (requires authentication)
router.post("/:token/accept", auth_1.protect, inviteController_1.acceptInvite);
exports.default = router;
