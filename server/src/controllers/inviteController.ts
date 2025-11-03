import { Request, Response } from "express";
import ListInvite from "../models/ListInvite";
import List from "../models/List";
import User from "../models/User";
import * as notificationService from "../services/notificationService";

// Get invite details (public - no auth required)
export const getInvite = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;

    const invite = await ListInvite.findOne({ token, status: "pending" })
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
  } catch (error: any) {
    console.error("Get invite error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch invitation",
    });
  }
};

// Accept invite (requires authentication)
export const acceptInvite = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token } = req.params;
    const userId = (req as any).user.userId;

    const invite = await ListInvite.findOne({ token, status: "pending" })
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
    const user = await User.findById(userId).select("email name");

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
    const list = await List.findById(invite.listId);

    if (!list) {
      res.status(404).json({
        success: false,
        error: "List not found",
      });
      return;
    }

    // Check if already shared
    const alreadyShared = list.sharedWith.some(
      (share: any) => share.userId.toString() === userId.toString()
    );

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
    const inviterName =
      typeof invite.invitedBy === "object" && "name" in invite.invitedBy
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
    const updatedList = await List.findById(list._id)
      .populate("userId", "name email avatarUrl")
      .populate("sharedWith.userId", "name email avatarUrl");

    res.status(200).json({
      success: true,
      message: "Invitation accepted successfully",
      data: updatedList,
    });
  } catch (error: any) {
    console.error("Accept invite error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to accept invitation",
    });
  }
};
