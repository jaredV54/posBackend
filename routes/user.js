import express from "express";
const router = express.Router();
import { addUser, retrieveUser, updateUserAcc, deleteUserAcc } from "../controllers/user.js" 

router.post("/user", addUser);
router.get("/user", retrieveUser);
router.put("/user/:id", updateUserAcc);
router.delete("/deleteUser/:id", deleteUserAcc);

export default router;