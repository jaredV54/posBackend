import express from "express";
const router = express.Router();
import { userLogin, userTypeAndPlace, placeInfo } from "../controllers/login.js"

router.post("/login", userLogin);
router.post("/userTypeAndStore", userTypeAndPlace);
router.post("/placeInfo", placeInfo);

export default router;

