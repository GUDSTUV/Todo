"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.acceptInvite = exports.getInvite = void 0;
const ListInvite_1 = __importDefault(require("../models/ListInvite"));
const List_1 = __importDefault(require("../models/List"));
const User_1 = __importDefault(require("../models/User"));
const notificationService = __importStar(require("../services/notificationService"));
// Get invite details (public - no auth required)
const getInvite = async (req, res) => {
    try {
        const { token } = req.params;
        const invite = await ListInvite_1.default.findOne({ token, status: "pending" })
            .populate("listId", "name description")
            .populate("invitedBy", "name email avatarUrl");
        if (!invite) {
            res.status(404).json({
                success: false,
                error: "Invitation not found or has expired",
            });
            return;
        }
        // Check if expired
        if (invite.expiresAt < new Date()) {
            invite.status = "expired";
            await invite.save();
            res.status(410).json({
                success: false,
                error: "This invitation has expired",
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: {
                email: invite.email,
                role: invite.role,
                list: invite.listId,
                invitedBy: invite.invitedBy,
                expiresAt: invite.expiresAt,
            },
        });
    }
    catch (error) {
        console.error("Get invite error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch invitation",
        });
    }
};
exports.getInvite = getInvite;
// Accept invite (requires authentication)
const acceptInvite = async (req, res) => {
    try {
        const { token } = req.params;
        const userId = req.user.userId;
        const invite = await ListInvite_1.default.findOne({ token, status: "pending" })
            .populate("listId")
            .populate("invitedBy", "name");
        if (!invite) {
            res.status(404).json({
                success: false,
                error: "Invitation not found or has expired",
            });
            return;
        }
        // Check if expired
        if (invite.expiresAt < new Date()) {
            invite.status = "expired";
            await invite.save();
            res.status(410).json({
                success: false,
                error: "This invitation has expired",
            });
            return;
        }
        // Get the user's email to verify
        const user = await User_1.default.findById(userId).select("email name");
        if (!user) {
            res.status(404).json({
                success: false,
                error: "User not found",
            });
            return;
        }
        // Check if email matches (optional - can remove if you want to allow anyone with the link)
        if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
            res.status(403).json({
                success: false,
                error: "This invitation is for a different email address",
                invitedEmail: invite.email,
                yourEmail: user.email,
            });
            return;
        }
        // Get the list
        const list = await List_1.default.findById(invite.listId);
        if (!list) {
            res.status(404).json({
                success: false,
                error: "List not found",
            });
            return;
        }
        // Check if already shared
        const alreadyShared = list.sharedWith.some((share) => share.userId.toString() === userId.toString());
        if (alreadyShared) {
            // Mark invite as accepted anyway
            invite.status = "accepted";
            invite.acceptedAt = new Date();
            invite.acceptedBy = userId;
            await invite.save();
            res.status(200).json({
                success: true,
                message: "List is already shared with you",
                data: list,
            });
            return;
        }
        // Add user to sharedWith
        list.sharedWith.push({
            userId: userId,
            role: invite.role,
            invitedAt: invite.createdAt,
        });
        await list.save();
        // Mark invite as accepted
        invite.status = "accepted";
        invite.acceptedAt = new Date();
        invite.acceptedBy = userId;
        await invite.save();
        // Create notification for successful sharing
        const inviterName = typeof invite.invitedBy === "object" && "name" in invite.invitedBy
            ? invite.invitedBy.name
            : "Someone";
        await notificationService.createNotification({
            userId: userId,
            type: "list_shared",
            title: "List Shared With You",
            message: `${inviterName} shared the list "${list.name}" with you`,
            actionUrl: `/dashboard?list=${list._id}`,
            metadata: {
                listId: String(list._id),
                listName: list.name,
                sharedBy: inviterName,
                role: invite.role,
            },
        });
        // Populate and return
        const updatedList = await List_1.default.findById(list._id)
            .populate("userId", "name email avatarUrl")
            .populate("sharedWith.userId", "name email avatarUrl");
        res.status(200).json({
            success: true,
            message: "Invitation accepted successfully",
            data: updatedList,
        });
    }
    catch (error) {
        console.error("Accept invite error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to accept invitation",
        });
    }
};
exports.acceptInvite = acceptInvite;
