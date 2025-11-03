import apiClient from "../client/client";

export interface InviteDetails {
  email: string;
  role: "viewer" | "editor";
  list: {
    _id: string;
    name: string;
    description?: string;
  };
  invitedBy: {
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  expiresAt: string;
}

// Get invite details (public - no auth required)
export const getInvite = async (token: string): Promise<InviteDetails> => {
  const response = await apiClient.get(`/invites/${token}`);
  return response.data.data;
};

// Accept invite (requires authentication)
export const acceptInvite = async (token: string): Promise<{
  success: boolean;
  message: string;
  data: {
    _id: string;
    name: string;
    [key: string]: unknown;
  };
}> => {
  const response = await apiClient.post(`/invites/${token}/accept`);
  return response.data;
};
