import { pool } from "../db.js";

//Get sales record
export const salesRecord = (req, res) => {
  const sql = "SELECT s.salesId, p.name, p.description, s.dateTimePurchased, s.price, s.quantity, s.transId, s.hybrid FROM sales s JOIN product p ON s.productId = p.id ORDER BY s.salesId DESC, s.transId DESC;";

  pool.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.json("Error retrieving sales record");
    }
    return res.json(result);
  });
};