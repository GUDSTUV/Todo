import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getLists,
  getList,
  createList,
  updateList,
  deleteList,
  archiveList,
  bulkUpdateLists,
  CreateListData,
  UpdateListData,
} from '../api/lists';
import toast from 'react-hot-toast';

// Query keys
export const listKeys = {
  all: ['lists'] as const,
  lists: (includeArchived: boolean) => [...listKeys.all, { includeArchived }] as const,
  details: () => [...listKeys.all, 'detail'] as const,
  detail: (id: string) => [...listKeys.details(), id] as const,
};

// Get all lists
export const useLists = (includeArchived = false) => {
  return useQuery({
    queryKey: listKeys.lists(includeArchived),
    queryFn: () => getLists(includeArchived),
  });
};

// Get single list
export const useList = (id: string) => {
  return useQuery({
    queryKey: listKeys.detail(id),
    queryFn: () => getList(id),
    enabled: !!id,
  });
};

// Create list mutation
export const useCreateList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateListData) => createList(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listKeys.all });
      toast.success('List created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create list');
    },
  });
};

// Update list mutation
export const useUpdateList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateListData }) =>
      updateList(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: listKeys.detail(id) });
      const previousList = queryClient.getQueryData(listKeys.detail(id));

      queryClient.setQueryData(listKeys.detail(id), (old: any) => ({
        ...old,
        data: { ...old?.data, ...data },
      }));

      return { previousList };
    },
    onError: (error: any, variables, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(listKeys.detail(variables.id), context.previousList);
      }
      toast.error(error.response?.data?.error || 'Failed to update list');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listKeys.all });
      toast.success('List updated successfully');
    },
  });
};

// Delete list mutation
export const useDeleteList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, moveTasksToListId }: { id: string; moveTasksToListId?: string }) =>
      deleteList(id, moveTasksToListId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listKeys.all });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('List deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete list');
    },
  });
};

// Archive/unarchive list mutation
export const useArchiveList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isArchived }: { id: string; isArchived: boolean }) =>
      archiveList(id, isArchived),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: listKeys.all });
      toast.success(
        variables.isArchived ? 'List archived successfully' : 'List unarchived successfully'
      );
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to archive list');
    },
  });
};

// Bulk update lists mutation
export const useBulkUpdateLists = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: Array<{ id: string; updates: UpdateListData }>) =>
      bulkUpdateLists(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listKeys.all });
      toast.success('Lists updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update lists');
    },
  });
};
