import { Router } from "express";
import { protect } from "../middleware/auth";
import { getInvite, acceptInvite } from "../controllers/inviteController";

const router = Router();

// Get invite details (public - no auth required)
router.get("/:token", getInvite);

// Accept invite (requires authentication)
router.post("/:token/accept", protect, acceptInvite);

export default router;
