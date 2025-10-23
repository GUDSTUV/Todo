import { Request, Response } from 'express';
import List from '../models/List';
import Task from '../models/Task';

// Get all lists for the authenticated user
export const getLists = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { includeArchived = false } = req.query;

    const query: any = { userId };
    if (!includeArchived || includeArchived === 'false') {
      query.isArchived = false;
    }

    const lists = await List.find(query).sort({ order: 1 }).lean();

    res.status(200).json({
      success: true,
      count: lists.length,
      data: lists,
    });
  } catch (error: any) {
    console.error('Get lists error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch lists',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Get a single list
export const getList = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const list = await List.findOne({ _id: id, userId });

    if (!list) {
      res.status(404).json({ success: false, error: 'List not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: list,
    });
  } catch (error: any) {
    console.error('Get list error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch list',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Create a new list
export const createList = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const listData = { ...req.body, userId };

    // Prevent multiple default lists
    if (listData.isDefault) {
      await List.updateMany({ userId, isDefault: true }, { isDefault: false });
    }

    // Get the highest order value for the user
    if (listData.order === undefined) {
      const lastList = await List.findOne({ userId }).sort({ order: -1 });
      listData.order = lastList ? lastList.order + 1 : 0;
    }

    const list = await List.create(listData);

    res.status(201).json({
      success: true,
      data: list,
    });
  } catch (error: any) {
    console.error('Create list error:', error);
    
    if (error.name === 'ValidationError') {
      res.status(400).json({ 
        success: false,
        error: 'Validation error',
        details: error.errors 
      });
      return;
    }

    res.status(500).json({ 
      success: false,
      error: 'Failed to create list',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Update a list
export const updateList = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    const updates = req.body;

    const list = await List.findOne({ _id: id, userId });

    if (!list) {
      res.status(404).json({ success: false, error: 'List not found' });
      return;
    }

    // Handle default list change
    if (updates.isDefault && !list.isDefault) {
      await List.updateMany({ userId, isDefault: true }, { isDefault: false });
    }

    // Update list fields
    Object.keys(updates).forEach(key => {
      (list as any)[key] = updates[key];
    });

    await list.save();

    res.status(200).json({
      success: true,
      data: list,
    });
  } catch (error: any) {
    console.error('Update list error:', error);
    
    if (error.name === 'ValidationError') {
      res.status(400).json({ 
        success: false,
        error: 'Validation error',
        details: error.errors 
      });
      return;
    }

    res.status(500).json({ 
      success: false,
      error: 'Failed to update list',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Delete a list (and optionally move tasks)
export const deleteList = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    const { moveTasksToListId } = req.query;

    const list = await List.findOne({ _id: id, userId });

    if (!list) {
      res.status(404).json({ success: false, error: 'List not found' });
      return;
    }

    // Prevent deletion of default list
    if (list.isDefault) {
      res.status(400).json({ success: false, error: 'Cannot delete default list' });
      return;
    }

    // Handle tasks in the list
    if (moveTasksToListId) {
      // Move tasks to another list
      const targetList = await List.findOne({ _id: moveTasksToListId, userId });
      if (!targetList) {
        res.status(404).json({ success: false, error: 'Target list not found' });
        return;
      }
      await Task.updateMany({ listId: id, userId }, { listId: moveTasksToListId });
      await (targetList as any).updateTaskCount();
    } else {
      // Move tasks to inbox (null listId)
      await Task.updateMany({ listId: id, userId }, { listId: null });
    }

    await list.deleteOne();

    res.status(200).json({
      success: true,
      message: 'List deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete list error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete list',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Archive/Unarchive a list
export const archiveList = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    const { isArchived } = req.body;

    const list = await List.findOne({ _id: id, userId });

    if (!list) {
      res.status(404).json({ success: false, error: 'List not found' });
      return;
    }

    list.isArchived = isArchived;
    await list.save();

    res.status(200).json({
      success: true,
      data: list,
    });
  } catch (error: any) {
    console.error('Archive list error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to archive list',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Bulk update lists (e.g., for reordering)
export const bulkUpdateLists = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { updates } = req.body; // Array of { id, updates }

    if (!Array.isArray(updates)) {
      res.status(400).json({ success: false, error: 'Updates must be an array' });
      return;
    }

    const results = [];
    for (const update of updates) {
      const list = await List.findOne({ _id: update.id, userId });
      if (list) {
        Object.keys(update.updates).forEach(key => {
          (list as any)[key] = update.updates[key];
        });
        await list.save();
        results.push(list);
      }
    }

    res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error: any) {
    console.error('Bulk update lists error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to bulk update lists',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Refresh task count for a list
export const refreshListTaskCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const list = await List.findOne({ _id: id, userId });

    if (!list) {
      res.status(404).json({ success: false, error: 'List not found' });
      return;
    }

    await (list as any).updateTaskCount();

    res.status(200).json({
      success: true,
      data: list,
    });
  } catch (error: any) {
    console.error('Refresh list task count error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to refresh task count',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};
