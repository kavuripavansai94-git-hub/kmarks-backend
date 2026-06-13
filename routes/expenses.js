const express = require('express');
const router = express.Router();
const expensesController = require('../controllers/expensesController');

// Standard CRUD operations
router.get('/', expensesController.getAllExpenses);
router.post('/', expensesController.createExpense);
router.put('/:id', expensesController.updateExpense);
router.delete('/:id', expensesController.deleteExpense);

module.exports = router;
