import { pool } from "../db.js";

// Retrieve receipt by transaction id
export const retrieveReceiptById = (req, res) => {
    const { transId } = req.params;

    const sql = `
    SELECT 
    c.fName, c.lName, t.transDate, t.modeOfPayment, t.typeOfPayment, t.amount, t.changeAmount, t.cash, t.receiptNo, t.balance, s.storeName,
    s.contactNumber, s.birTin, s.branchName, s.address, s.email
    FROM transactions t 
    JOIN customer c ON c.id = t.customerId
    JOIN store s ON s.id = t.placeId
    WHERE t.id = ?`;

    pool.query(sql, [transId], (err, result) => {
        if (err) {
            return res.status(500).json({ status: 'error', message: 'Internal Server Error', error: err });
        }
        if (result.length === 0) {
            return res.status(404).json({ status: 'error', message: 'This receipt does not exist.' });
        }
        return res.status(200).json({ isSuccessful: true, status: "success", result: result})
    })
}

// Retrieve receipt by split id
export const splitReceipt = (req, res) => {
    const { id } = req.params;
    const sql = `
    SELECT 
    s.transDate, s.modeOfPayment, s.amount, s.cash, s.receiptNo, s.balance, 
    p.storeName, p.contactNumber, p.birTin, p.branchName, p.address, p.email,
    h.name, h.price, h.hybrid,
    c.fName, c.lName
    FROM splitpayment s 
    JOIN store p ON p.id = s.placeId 
    JOIN sales a ON a.transId = s.transId
    JOIN product h ON h.id = a.productId
    JOIN customer c ON c.id = s.customerId
    WHERE s.id = ?`;

    pool.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ status: 'error', message: 'Internal Server Error', error: err });
        }
        if (result.length === 0) {
            return res.status(404).json({ status: 'error', message: 'This receipt does not exist.' });
        }
        return res.status(200).json({ isSuccessful: true, status: "success", result: result })
    })
  }