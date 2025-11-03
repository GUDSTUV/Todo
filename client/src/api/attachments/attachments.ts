import apiClient from '../client/client';

export interface Attachment {
  _id?: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
}

// Upload attachment to a task
export const uploadAttachment = async (taskId: string, file: File): Promise<Attachment> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<Attachment>(`/tasks/${taskId}/attachments`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

// Delete attachment from a task
export const deleteAttachment = async (taskId: string, attachmentId: string): Promise<void> => {
  await apiClient.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
};

// Get file URL
export const getFileUrl = (filename: string): string => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return `${baseUrl}/uploads/${filename}`;
};
