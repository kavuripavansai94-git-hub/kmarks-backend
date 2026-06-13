const express = require('express');
const router = express.Router();
const expensesController = require('../controllers/expensesController');

const { authMiddleware } = require('../middleware/auth');

// Standard CRUD operations
router.get('/', authMiddleware, expensesController.getAllExpenses);
router.post('/', authMiddleware, expensesController.createExpense);
router.put('/:id', authMiddleware, expensesController.updateExpense);
router.delete('/:id', authMiddleware, expensesController.deleteExpense);

module.exports = router;
