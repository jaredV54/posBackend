import express from "express";
const router = express.Router();
import {retrievePlace, addPlace, deletePlace, updatePlace, retrievePlaceByID } from "../controllers/place.js";

router.get("/store", retrievePlace);
router.post("/store", addPlace);
router.delete("/store/:id", deletePlace);
router.put("/store/:id", updatePlace);
router.get("/place/:id", retrievePlaceByID)

export default router;