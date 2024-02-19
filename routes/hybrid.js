import express from "express";
const router = express.Router();
import { addNewHybrid, retrieveHybrids, updateHybrid, deleteHyrbid, retrievePsycTest } from "../controllers/hybrid.js"

router.post('/hybrid', addNewHybrid);
router.get('/hybridData', retrieveHybrids);
router.post('/hybrid/:id', updateHybrid);
router.delete('/hybrid/:id', deleteHyrbid);
router.get('/psycTest/:id', retrievePsycTest);

export default router;