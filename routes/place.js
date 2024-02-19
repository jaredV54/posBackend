import express from "express";
const router = express.Router();
import {retrievePlace, addPlace, deletePlace, updatePlace } from "../controllers/place.js";

router.get("/store", retrievePlace);
router.post("/store", addPlace);
router.delete("/store/:id", deletePlace);
router.put("/store/:id", updatePlace);

export default router;