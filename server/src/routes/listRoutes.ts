import express from 'express';
import {
  getLists,
  getList,
  createList,
  updateList,
  deleteList,
  archiveList,
  bulkUpdateLists,
  refreshListTaskCount,
} from '../controllers/listController';
import { protect } from '../middleware/auth';
import { validateList } from '../middleware/validation';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Bulk operations
router.patch('/bulk', bulkUpdateLists);

// CRUD operations
router.route('/')
  .get(getLists)
  .post(validateList, createList);

router.route('/:id')
  .get(getList)
  .patch(validateList, updateList)
  .delete(deleteList);

// Additional operations
router.patch('/:id/archive', archiveList);
router.post('/:id/refresh-count', refreshListTaskCount);

export default router;
