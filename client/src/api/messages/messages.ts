import apiClient from "../client/client";

export interface Message {
  _id: string;
  senderId: {
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  receiverId: {
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  content: string;
  isRead: boolean;
  readAt?: string;
  conversationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  conversationId: string;
  otherUser: {
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  lastMessage: {
    content: string;
    createdAt: string;
    isFromMe: boolean;
  };
  unreadCount: number;
}

// Get all conversations
export const getConversations = async (): Promise<Conversation[]> => {
  const response = await apiClient.get("/messages/conversations");
  return response.data;
};

// Get messages with a specific user
export const getMessages = async (otherUserId: string): Promise<Message[]> => {
  const response = await apiClient.get(`/messages/${otherUserId}`);
  return response.data;
};

// Send a message
export const sendMessage = async (receiverId: string, content: string): Promise<Message> => {
  const response = await apiClient.post("/messages", { receiverId, content });
  return response.data;
};

// Mark a message as read
export const markMessageAsRead = async (messageId: string): Promise<Message> => {
  const response = await apiClient.patch(`/messages/${messageId}/read`);
  return response.data;
};

// Get unread message count
export const getUnreadMessageCount = async (): Promise<number> => {
  const response = await apiClient.get("/messages/unread-count");
  return response.data.count;
};
