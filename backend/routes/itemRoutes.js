const express = require('express');
const ctrl = require('../controllers/itemController');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Static routes must come before "/:id"
router.get('/categories', ctrl.getCategories);
router.get('/stats', asyncHandler(ctrl.getStats));

router.route('/')
  .get(asyncHandler(ctrl.getItems))      // Read all (with filters)
  .post(asyncHandler(ctrl.createItem));  // Create

router.route('/:id')
  .get(asyncHandler(ctrl.getItem))       // Read one
  .put(asyncHandler(ctrl.updateItem))    // Update
  .delete(asyncHandler(ctrl.deleteItem)); // Delete

router.patch('/:id/status', asyncHandler(ctrl.updateStatus));
router.get('/:id/matches', asyncHandler(ctrl.getMatches));

module.exports = router;
