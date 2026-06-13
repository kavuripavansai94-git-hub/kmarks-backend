const express = require('express');
const router = express.Router();
const leadsController = require('../controllers/leadsController');
const { authMiddleware } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Standard CRUD operations
router.get('/', leadsController.getAllLeads);
router.post('/', leadsController.createLead);
router.put('/:id', leadsController.updateLead);
router.delete('/:id', leadsController.deleteLead);

module.exports = router;
