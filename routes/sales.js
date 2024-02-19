import express from "express";
const router = express.Router();
import { salesRecord } from "../controllers/sales.js";

router.get("/sales", salesRecord);

export default router;