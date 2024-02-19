import express from "express";
const router = express.Router();
import { selectHybrid, recordTransactions } from "../controllers/purchase.js";

router.get("/purchase/:id", selectHybrid);
router.post("/recordTransactions", recordTransactions);

export default router;