import { pool } from "../db.js";

// Select hybrid to purchase by id
export const selectHybrid = (req, res) => {
  const { id } = req.params;
  const { hybrid } = req.query;
  const serviceType = `
    SELECT *
    FROM assessment 
    WHERE serviceId = ?
  `;
  const productType = "SELECT * FROM product WHERE id = ?";

  if (hybrid === 'service') {
    pool.query(serviceType, [id], (err, result) => {
      if (err) {
        return res.status(500).json({ status: 'error', message: 'Internal Server Error', error: err });
      }

      if (result.length === 0) {
        return res.status(404).json({ status: 'error', message: 'This service does not exist.' });
      }

      return res.status(200).json({ status: 'success', data: result });
    });
  } else {
    pool.query(productType, [id], (err, result) => {
      if (err) {
        return res.status(500).json({ status: 'error', message: 'Internal Server Error', error: err });
      }

      if (result.length === 0) {
        return res.status(404).json({ status: 'error', message: 'This product does not exist.' });
      }

      return res.status(200).json({ status: 'success', data: result });
    });
  }
};

//  Insert a transaction record
export const recordTransactions = (req, res) => {
  const { items, total, cash, changeAmount, clientId, modeOfPayment, accNo, typeOfPayment, platform, discount, receiptNo, remarks, providers, service } = req.body;
  const recordTransactionSql = "INSERT INTO transactions (items, amount, cash, changeAmount, transDate, `customerId`, `receiptNo`, `modeOfPayment`, `accNo`, `typeOfPayment`, `platform`, `discount`, `remarks`, `providers`, `balance`, `service`) VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
  const balance = typeOfPayment === "split" ? changeAmount : 0;
  const values = [items, total, cash, changeAmount, clientId, receiptNo, modeOfPayment, accNo, typeOfPayment, platform, discount, remarks, providers, balance, service];

  pool.query(recordTransactionSql, values, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({isSuccessful: false, message: err.message});
    }

    if (result.affectedRows > 0) {
      return updateCurrentHybrid(result.insertId, req, res)
    } else {
      return res.status(500).json({isSuccessful: false, message: "Internal error please try again."});
    }
  })
};

//  Update sales record & Update products quantity
const updateCurrentHybrid = (transId, req, res) => {
  const { hybridData, currentDate } = req.body;

  const updatePromises = hybridData.map(item => {
    const { id, prodQuantity } = item;
    const updateQuantity = "UPDATE product SET quantity = quantity - ? WHERE id = ?";
    const updateQuantityVal = [prodQuantity, id];

    return new Promise((resolve, reject) => {
      pool.query(updateQuantity, updateQuantityVal, (updateErr, updateResult) => {
        if (updateErr) {
          console.error(updateErr);
          reject('Error updating product quantity');
        } else {
          resolve();
        }
      });
    });
  });

  Promise.all(updatePromises)
    .then(() => {
      const insertSalesRecord = "INSERT INTO sales (`productId`, `price`, `quantity`, `transId`, `dateTimePurchased`, `hybrid`) VALUES ?";
      const insertValues = hybridData.map(item => [item.id, item.newPrice, item.prodQuantity, transId, currentDate, item.hybrid]);

      pool.query(insertSalesRecord, [insertValues], (insertErr, insertResult) => {
        if (insertErr) {
          console.error(insertErr);
          return res.status(500).json({ isSuccessful: false, message: 'Error inserting sales record' });
        }
        return res.status(200).json({ isSuccessful: true, message: 'Payment successful!' });
      });
    })
    .catch(error => {
      return res.status(500).json({ isSuccessful: false, message: error });
    });
};
