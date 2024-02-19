import express from "express";
const router = express.Router();
import { clientInfo, clientInfoPerId, updateClientInfo, addNewClient, deleteClient } from "../controllers/client.js"

router.get('/customer', clientInfo);
router.get('/customerId', clientInfoPerId);
router.put('/customer/:id', updateClientInfo);
router.post('/customer', addNewClient);
router.delete('/deleteCustomer/:id', deleteClient);

export default router;