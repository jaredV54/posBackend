import express from "express";
const router = express.Router();
import { retrieveReceiptById, splitReceipt } from "../controllers/receipt.js";

router.get("/receipt/:transId", retrieveReceiptById);
router.get("/splitReceipt/:id", splitReceipt);

export default router;
