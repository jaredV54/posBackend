import express from "express";
const router = express.Router();
import {retrievePlace, addPlace, deletePlace, updatePlace, retrievePlaceByID, retrieveTransRecordByPlace } from "../controllers/place.js";

router.get("/store", retrievePlace);
router.post("/store", addPlace);
router.delete("/store/:id", deletePlace);
router.put("/store/:id", updatePlace);
router.get("/place/:id", retrievePlaceByID);
router.get("/transactionPlace/:id", retrieveTransRecordByPlace);

export default router;