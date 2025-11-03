"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const listController_1 = require("../controllers/listController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = express_1.default.Router();
// All routes require authentication
router.use(auth_1.protect);
// Bulk operations
router.patch("/bulk", listController_1.bulkUpdateLists);
// CRUD operations
router.route("/").get(listController_1.getLists).post(validation_1.validateList, listController_1.createList);
router
    .route("/:id")
    .get(listController_1.getList)
    .patch(validation_1.validateList, listController_1.updateList)
    .delete(listController_1.deleteList);
// Additional operations
router.patch("/:id/archive", listController_1.archiveList);
router.post("/:id/refresh-count", listController_1.refreshListTaskCount);
// Collaboration operations
router.post("/:id/share", listController_1.shareList);
router.delete("/:id/collaborators/:collaboratorId", listController_1.removeCollaborator);
router.post("/:id/leave", listController_1.leaveSharedList);
exports.default = router;
