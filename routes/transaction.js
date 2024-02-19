import express from "express";
const router = express.Router();
import { 
    retrieveTransactionPerId, 
    retrieveTransactions, 
    salesRecord, 
    recordSplitPayment, 
    retrieveBalance, 
    splitPaymentRecords 
} from "../controllers/transaction.js";

router.get("/transactions/:id", retrieveTransactionPerId);
router.get("/transactions", retrieveTransactions);
router.get("/salesRecord", salesRecord);
router.post("/splitPayment", recordSplitPayment);
router.get("/splitPayment", retrieveBalance);
router.get("/splitPaymentRecords", splitPaymentRecords);

export default router;