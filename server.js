import express from 'express';
import cors from 'cors';
import clientRoutes from "./routes/client.js";
import hybridRoutes from "./routes/hybrid.js";
import loginRoutes from "./routes/login.js";
import placeRoutes from "./routes/place.js";
import purchaseRoutes from "./routes/purchase.js";
import receiptRoutes from "./routes/receipt.js";
import salesRoutes from "./routes/sales.js";
import transactionRoutes from "./routes/transaction.js";
import userRoutes from "./routes/user.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use(clientRoutes);
app.use(hybridRoutes);
app.use(loginRoutes);
app.use(placeRoutes);
app.use(purchaseRoutes);
app.use(receiptRoutes);
app.use(salesRoutes);
app.use(transactionRoutes);
app.use(userRoutes);

const PORT = process.env.PORT || 8082;
app.get('/', (req, res) => {
  res.send(`Server is running : ${PORT}`);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
