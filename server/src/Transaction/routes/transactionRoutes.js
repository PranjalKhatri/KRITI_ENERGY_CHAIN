import express from 'express';
import {
  createTransaction,
  getAllTransactions,
  getTransactionsByUser,
  deleteTransaction
} from '../controllers/transactionController.js';

const router = express.Router();

router.post('/create', createTransaction);
router.get('/', getAllTransactions);
router.get('/user/:accountNumber', getTransactionsByUser);
router.delete('/:id', deleteTransaction);

export default router;
