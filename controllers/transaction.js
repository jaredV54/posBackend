import { pool } from "../db.js";

// Retrieve transaction by id
export const retrieveTransactionPerId = (req, res) => {
  const transactionId = req.params.id;
  const sql = "SELECT t.id, t.items, t.amount, t.cash, t.changeAmount, t.transDate, t.customerId, c.fName, c.lName, t.receiptNo, t.modeOfPayment, t.accNo, t.typeOfPayment, t.platform, t.balance FROM transactions t JOIN customer c ON c.id = t.customerId WHERE t.id = ? ORDER BY t.id DESC;";

  pool.query(sql, [transactionId], (err, result) => {
    if (err) {
      console.error(err);
      return res.json("Error retrieving transaction records");
    }
    console.log(result);
    return res.json(result);
  });
};

// Retrieve transactions
export const retrieveTransactions = (req, res) => {
  const sql = "SELECT t.id, t.items, t.amount, t.cash, t.changeAmount, t.transDate, t.customerId, c.fName, c.lName, t.receiptNo, t.modeOfPayment, t.accNo, t.typeOfPayment, t.platform, t.remarks, t.providers, t.balance FROM transactions t JOIN customer c ON c.id = t.customerId ORDER BY t.id DESC;";

  pool.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.json("Error retrieving transaction records");
    }
    console.log(result);
    return res.json(result);
  });
};

// Retrieve sales record by ID for transactions
export const salesRecord = (req, res) => {
  const { id } = req.query;
  const sql = "SELECT s.salesId, p.name, p.description, s.dateTimePurchased, s.price, s.quantity, s.transId FROM sales s JOIN product p ON s.productId = p.id WHERE s.transId = ?";

  pool.query(sql, [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({isSuccessful: false, message: "Error retrieving sales records"});
    }
    if (result.length > 0) {
      return res.status(404).json({isSuccessful: false, message: "Internal error. Please try again." })
    }
    return res.status(200).json({isSuccessful: true, result: result});
  });
};

// Record Split Payment
export const recordSplitPayment = (req, res) => {
  const {
    transId,
    items,
    amount,
    money,
    balance,
    customerId,
    modeOfPayment,
    accNo,
    receiptNo
  } = req.body;
  const sql = "INSERT INTO splitpayment (`transId`, `items`, `amount`, `cash`, `balance`, `transDate`, `receiptNo`, `customerId`, `modeOfPayment`, `accNo`) VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?)";
      
  pool.query(sql, [transId, items, amount, money, balance, receiptNo, customerId, modeOfPayment, accNo], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: "Split payment error" });
    }

    if (result.affectedRows > 0)  {
      return updateTransactionBalance(transId, balance, res, result.insertId, receiptNo);
    } else {
      return res.status(404).json({ success: false, message: "Internal error!"})
    }
  });
};

const updateTransactionBalance = (id, balance, res, insertedID, receiptNo) => {
  const sql = `UPDATE transactions SET balance = ? WHERE id = ?`;
  pool.query(sql, [balance, id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: err.message });
    }

    if (result.affectedRows > 0) {
      return res.status(200).json({ success: true, message: "Payment successful!", id: insertedID, receiptNo: receiptNo });
    } else {
      return res.status(404).json({ success: false, message: "Internal error!" });
    }
  });
};

// Retrieve Split Payment Balance
export const retrieveBalance = (req, res) => {
  const sql = "SELECT transId, balance FROM splitpayment";
  pool.query(sql, (err, result) => {
    if (err) {
      console.error(err);

      if (err.code === 'ER_DBACCESS_DENIED_ERROR') {
        return res.status(500).json({ error: "Database access denied error" });
      } else if (err.code === 'ER_BAD_TABLE_ERROR') {
        return res.status(500).json({ error: "Bad table error" });
      } else if (err.code === 'ER_NO_SUCH_TABLE') {
        return res.status(500).json({ error: "No such table error" });
      } else {
        return res.status(500).json({ error: "Unknown error occurred" });
      }
    }

    console.log(result);
    return res.json(result);
  });
};

// Retrieve Split Payment Records
export const splitPaymentRecords = (req, res) => {
  const sql = "SELECT * FROM splitpayment ORDER BY id DESC";
  pool.query(sql, (err, result) => {
    if (err) {
      console.error(err);

      if (err.code === 'ER_DBACCESS_DENIED_ERROR') {
        return res.status(500).json({ error: "Database access denied error" });
      } else if (err.code === 'ER_BAD_TABLE_ERROR') {
        return res.status(500).json({ error: "Bad table error - splitpayment" });
      } else if (err.code === 'ER_NO_SUCH_TABLE') {
        return res.status(500).json({ error: "No such table error" });
      } else {
        return res.status(500).json({ error: "Unknown error occurred" });
      }
    }

    console.log(result);
    return res.json(result);
  })
};