import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig();
const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST, 
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

/*
const pool = mysql.createPool({
  host: '127.0.0.1', 
  user: 'root',
  password: '4hq183kl',
  database: 'pos',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
*/

//Create user
app.post('/user', (req, res) => {
  const values = [
    [
      req.body.name,
      req.body.email,
      req.body.password,
      req.body.userType,
      req.body.storeId
    ]
  ];

  const checkEmailExist = "SELECT email FROM login WHERE email = ?";
  pool.query(checkEmailExist, [req.body.email], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Error checking email existence" });
    }
    
    if (results.length > 0) {
      return res.json({ error: "Email already exists" });
    }

    const sql = "INSERT INTO login (`name`, `email`, `password`, `userType`, `storeId`) VALUES ?";
  
    pool.query(sql, [values], (err, results) => {
      if (err) {
        return res.status(500).json({ error: "Error inserting user" });
      }
      
      return res.json(results);
    });
  });
});

//Get user
app.get('/user', (req, res) => {
  const sql = "SELECT l.id, l.name, l.email, l.password, l.userType, l.storeId, s.storeName FROM login l LEFT JOIN store s ON l.storeId = s.id ORDER BY l.id ASC";
  pool.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.json("Error retrieving user data");
    }
    return res.json(result);
  });
});

//Log In
app.post('/login', (req, res) => {
  const handleEmail = "SELECT * FROM login WHERE `email` = ?";
  const handlePassword = "SELECT * FROM login WHERE `email` = ? AND `password` = ?";
  pool.query(handleEmail, [req.body.email], (err, emailData) => {
    if (err) {
      return res.json({ error: "Internal server error. " + err});
    }
    if (emailData.length > 0) {
      pool.query(handlePassword, [req.body.email, req.body.password], (err, passwordData) => {
        if (err) {
          return res.json("Error");
        }
        if (passwordData.length > 0) {
          return res.json({ message: "Requirements Matched", data: emailData });
        } else {
          return res.json("Wrong Password");
        }
      });
    } else {
      return res.json("Email doesn't exist");
    }
  });
});

app.post('/userTypeAndStore', (req, res) => {
  const userTypeAndStoreQuery = "SELECT userType, storeId FROM login WHERE `email` = ?";
  pool.query(userTypeAndStoreQuery, [req.body.email], (err, result) => {
    if (err) {
      console.error("Error executing query:", err);
      return res.status(500).json({ message: "Error occurred" });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userType = result[0].userType;
    const storeId = result[0].storeId;

    return res.json({ userType, storeId });
  });
});

app.post('/storeInfo', (req, res) => {
  const userTypeAndStoreQuery = "SELECT userType, storeId FROM login WHERE `email` = ?";
  pool.query(userTypeAndStoreQuery, [req.body.email, req.body.password], (err, result) => {
    if (err) {
      console.error("Error executing query:", err);
      return res.status(500).json({ message: "Error occurred" });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userType = result[0].userType;
    const storeId = result[0].storeId;
    if (userType !== 'admin' && storeId) {
      const getStoreInfo = "SELECT * FROM store WHERE id = ?";
      pool.query(getStoreInfo, [storeId], (err, result) => {
        if (err) {
          console.error("Error executing query:", err);
          return res.status(500).json({ message: "Error occurred" });
        }

        if (result.length === 0) {
          return res.status(404).json({ message: "Store not found" });
        }
        return res.json({ storeInfo: result[0] });
      });
    } else {
      return res.json({ storeInfo: {userTypeIs: 'admin'} })
    }
  });
});

//Update Account
app.put('/user/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, password, userType, storeId } = req.body;
  const sql = "UPDATE login SET `name` = ?, email = ?, password = ?, userType = ?, storeId = ? WHERE id = ?";
  const values = [name, email, password, userType, storeId, id];

  pool.query(sql, values, (err, result) => {
    if (err) {
      console.error(err);
      return res.json("Error updating User");
    }
    if (result.affectedRows === 0) {
      return res.json("User not found");
    }
    return res.json("User updated");
  });
});

//Delete Account
app.delete('/deleteUser/:id', (req, res) => {
  const {id} = req.params;
  const sql = "DELETE FROM login WHERE `id` = ?";
  const values = [id];
    pool.query(sql, values, (err, result) => {
      if (err) {
        console.error(err);
        return res.json("Error deleting store");
      }
      if (result.affectedRows === 0) {
        return res.json("Store not found");
      }
      return res.json("Store deleted");
    });
});

/* Purchase and products & services */

// Create hybrid
app.post('/hybrid', (req, res) => {
  const { name, description, price, quantity, hybrid, branch } = req.body;
  const sql = "INSERT INTO product (name, price, quantity, description, hybrid) VALUES (?, ?, ?, ?, ?)";
  const values = [name, price, quantity, description, hybrid];

  pool.query(sql, values, (err, result) => {
    if (err) {
      return res.json("Error creating product");
    }

    if (result.affectedRows > 0 && result.insertId && hybrid === 'service') {
      return createListOfTest(branch, result.insertId, res);
    } else if (hybrid === 'product') {
      return res.json("New Product added successfully!")
    }

    return res.json(`Failed to add ${hybrid}`);
  });
});

const createListOfTest = (branch, insertedId, res) => {
  const sql = "INSERT INTO assessment (`serviceId`, `psycTest`, `standardRate`) VALUES ?"
  const values = branch.map(list => [insertedId, ...Object.values(list)]);

  pool.query(sql, [values], (err, result) => {
    if (err) {
      return res.json(err);
    }
    if (result.affectedRows > 0) {
      return res.json("New Service added successfully")
    }
  })
}

// Get all hybrid
app.get('/product', (req, res) => {
  const { hybrid } = req.query;

  let sql;
  if (hybrid) {
    sql = "SELECT * FROM product WHERE isDeleted IS NULL AND hybrid = ?"
  } else {
    sql = "SELECT * FROM product WHERE isDeleted IS NULL"
  }

  pool.query(sql, [hybrid], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json("Error retrieving products " +  err);
    }
    return res.status(200).json(result);
  });
});

app.put('/product/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, price, quantity, image, imageHover, hybrid } = req.body;
  const sql = "UPDATE product SET name = ?, description = ?, price = ?, quantity = ?, image = ?, imageHover = ?, hybrid = ? WHERE id = ?";
  const values = [name, description, price, quantity, image, imageHover, hybrid, id];

  pool.query(sql, values, (err, result) => {
    if (err) {
      console.error(err);
      return res.json("Error updating product");
    }
    if (result.affectedRows === 0) {
      return res.json("Product not found");
    }
    return res.json("Product updated");
  });
});

/* Purchase & SalesRecord Page */

//Get Hybrid by id
app.get('/purchase/:id', (req, res) => {
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
});

//Update hybrid 
app.post('/hybrid/:id', (req, res) => {
  const { id } = req.params;
  const {
    name,
    price,
    quantity,
    description,
    hybrid,
    branch
  } = req.body;

  const updateProductQuery = 'UPDATE product SET name = ?, price = ?, quantity = ?, description = ? WHERE id = ?';
  const deleteAssessmentQuery = 'DELETE FROM assessment WHERE serviceId = ?';
  const insertAssessmentQuery = 'INSERT INTO assessment (serviceId, psycTest, standardRate) VALUES ?';

  const forUpdate = [name, price, quantity, description, id];
  const forDelete = [id];
  const forInsert = branch.map(list => [id, 
    ...(Object.values(list).length > 2 ? Object.values(list).slice(2) : Object.values(list))
  ]);

  pool.getConnection((err, connection) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Failed to reach database. Please try again.' });
      return;
    }

    connection.beginTransaction((beginTransactionErr) => {
      if (beginTransactionErr) {
        console.error(beginTransactionErr);
        res.status(500).json({ message: 'Error beginning database transaction' });
        return connection.release();
      }

      connection.query(updateProductQuery, forUpdate, (updateErr, updateResults) => {
        if (updateErr) {
          return connection.rollback(() => {
            console.error(updateErr);
            res.status(500).json({ message: 'Error updating product data' });
            connection.release();
          });
        }

        if (hybrid === 'service') {
          connection.query(deleteAssessmentQuery, forDelete, (deleteErr, deleteResults) => {
            if (deleteErr) {
              return connection.rollback(() => {
                console.error(deleteErr);
                res.status(500).json({ message: 'Error deleting assessment data' });
                connection.release();
              });
            }
  
            connection.query(insertAssessmentQuery, [forInsert], (insertErr, insertResults) => {
              if (insertErr) {
                return connection.rollback(() => {
                  console.error(insertErr);
                  res.status(500).json({ message: 'Error inserting assessment data' });
                  connection.release();
                });
              }
  
              connection.commit((commitErr) => {
                if (commitErr) {
                  console.error(commitErr);
                  res.status(500).json({ message: 'Error committing transaction' });
                  connection.rollback(() => {
                    connection.release();
                  });
                } else {
                  res.status(200).json({ message: 'Data updated successfully' });
                  connection.release();
                }
              });
            });
          });
        } else {
          res.status(200).json({ message: 'Data updated successfully' });
          connection.release();
        }
      });
    });
  });
});

//Delet Hybrid
app.delete('/hybrid/:id', (req, res) => {
  const { id } = req.params;
  const { hybrid } = req.body;
  const deleteServicePsycTest = `DELETE FROM assessment WHERE serviceId = ?`;
  const deleteHybrid = `DELETE FROM product WHERE id = ?`;

  if (hybrid === 'service') {
    pool.query(deleteServicePsycTest, [id], (err, results) => {
      if (err) {
        console.log(err);
        return res.status(500).json({
          success: false,
          message: 'Error deleting service'
        })
      }
  
      if (results.affectedRows > 0) {
        return deleteHybridById(id, res, deleteHybrid);
      }
    })
  } else {
    return deleteHybridById(id, res, deleteHybrid);
  }
})

const deleteHybridById = (id, res, deleteHybrid) => {
  pool.query(deleteHybrid, [id], (err, isDeleted) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete, please try again.'
      })
    }

    if (isDeleted.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: 'Internal error please try again.'
      })
    }

    return res.status(200).json({
      success: true,
      message: `Deleted Successfully`
    })
  })
}

//Retrieve the current selected hybrid
app.get("/psycTest/:id", (req, res) => {
  const { id } = req.params;
  const getDataById = `SELECT * FROM assessment WHERE serviceId = ?`;

  pool.query(getDataById, [id], (err, response) => {
    if (err) {
      return res.status(500).json({status: "failed", message: err.message})
    }
    if (response.length > 0) {
      return res.status(200).json({status: "success", message: "Psychological Test fetched", data: response})
    } else {
      return res.status(404).json({status: "failed", message: "No psychological test found for the given ID.", data: []})
    }
  })
})

//Purchase supplies - subtract quantity
app.put('/purchase', (req, res) => {
  const { id, name, description, isDeleted, price, quantity, transId } = req.body;
  const updateSql = "UPDATE product SET name = ?, description = ?, isDeleted = ?, quantity = quantity - ? WHERE id = ?";                                      
  const valuesProduct = [name, description, isDeleted, quantity, id];
  const addRowSql = "INSERT INTO sales (`productId`, `price`, `quantity`, `transId`, `dateTimePurchased`) VALUES (?, ?, ?, ?, NOW())";
  const valuesSales = [id, price, quantity, transId];

  pool.query(updateSql, valuesProduct, (err, result) => {
    if (err) {
      console.error(err);
      return res.json("Error updating product");
    }
    if (result.affectedRows === 0) {
      return res.json("Product not found");
    } else {
      // Sales Record
      pool.query(addRowSql, valuesSales, (err, data) => {
        if (err) {
          console.error(err);
          return res.json("Error updating sales");
        }
        if (data.affectedRows === 0) {
          return res.json("Failed to insert data");
        }
        return res.json("Sales updated");
      });
    }
  });
});

//Get sales record
app.get('/sales', (req, res) => {
  const sql = "SELECT s.salesId, p.name, p.description, s.dateTimePurchased, s.price, s.quantity, s.transId FROM sales s JOIN product p ON s.productId = p.id ORDER BY s.salesId DESC, s.transId DESC;";

  pool.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.json("Error retrieving sales record");
    }
    console.log(result)
    return res.json(result);
  });
})

//Post transaction record
app.post('/transactions', (req, res) => {
  proceedToTransaction(req, res);
});

const proceedToTransaction = (req, res) => {
  const { items, amount, money, change, customerId, receiptNo, modeOfPayment, accNo, typeOfPayment, platform } = req.body;

  const checkReceiptSql = "SELECT COUNT(*) AS count FROM transactions WHERE receiptNo = ?";
  const checkReceiptValues = [receiptNo];

  pool.query(checkReceiptSql, checkReceiptValues, (checkErr, checkResult) => {
    if (checkErr) {
      console.error(checkErr);
      return res.status(502).json({ success: false, message: "Error checking receipt number" });
    }

    const receiptCount = checkResult[0].count;

    if (receiptCount > 0) {
      return res.json({ success: false, message: "Receipt number already exists" });
    } else {
      const sql = "INSERT INTO transactions (items, amount, cash, changeAmount, transDate, `customerId`, `receiptNo`, `modeOfPayment`, `accNo`, `typeOfPayment`, `platform`) VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?)";
      const values = [items, amount, money, change, customerId, receiptNo, modeOfPayment, accNo, typeOfPayment, platform];

      pool.query(sql, values, (err, result) => {
        if (err) {
          console.error(err);
          return res.status(504).json({ success: false, message: "Transaction error" });
        } else {
          return res.status(200).json({ success: true, message: "Transaction successful", id: result.insertId });
        }
      });
    }
  });
};

app.get('/transactions/:id', (req, res) => {
  const transactionId = req.params.id;
  const sql = "SELECT t.id, t.items, t.amount, t.cash, t.changeAmount, t.transDate, t.customerId, c.fName, c.lName, t.receiptNo, t.modeOfPayment, t.accNo, t.typeOfPayment, t.platform FROM transactions t JOIN customer c ON c.id = t.customerId WHERE t.id = ? ORDER BY t.id DESC;";

  pool.query(sql, [transactionId], (err, result) => {
    if (err) {
      console.error(err);
      return res.json("Error retrieving transaction records");
    }
    console.log(result);
    return res.json(result);
  });
});

app.get('/transactions', (req, res) => {
  const sql = "SELECT t.id, t.items, t.amount, t.cash, t.changeAmount, t.transDate, t.customerId, c.fName, c.lName, t.receiptNo, t.modeOfPayment, t.accNo, t.typeOfPayment, t.platform FROM transactions t JOIN customer c ON c.id = t.customerId ORDER BY t.id DESC;";

  pool.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.json("Error retrieving transaction records");
    }
    console.log(result);
    return res.json(result);
  });
});

//Store
app.get('/store', (req, res) => {
  const sql = "SELECT * FROM store";

  pool.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.json("Error retrieving store records");
    }
    console.log(result)
    return res.json(result);
  });
})

app.post('/store', (req, res) => {
  const {storeName, address, email, contactNo, birTin, branch} = req.body;
  const sql = "INSERT INTO store (storeName, address, contactNumber, email, birTin, branchName) VALUES (?, ?, ?, ?, ?, ?)";
  const values = [storeName, address, contactNo, email, birTin, branch]

  pool.query(sql, values, (err, result) => {
    if (err) {
      console.error(err);
      return res.json("Error adding store");
    }
    console.log(result)
    return res.json(result);
  });
})

app.delete('/store/:id', (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM store WHERE id = ?";
  const values = [id];

  pool.query(sql, values, (err, result) => {
    if (err) {
      console.error(err);
      return res.json("Error deleting store");
    }
    if (result.affectedRows === 0) {
      return res.json("Store not found");
    }
    return res.json("Store deleted");
  });
});

app.put('/store/:id', (req, res) => {
  const { id } = req.params;
  const {storeName, address, email, contactNo, birTin, branch} = req.body;
  const sql = "UPDATE store SET storeName = ?, address = ?, email = ?, contactNumber = ?, birTin = ?, branchName = ? WHERE id = ?";
  const values = [storeName, address, email, contactNo, birTin, branch, id];

  pool.query(sql, values, (err, result) => {
    if (err) {
      console.error(err);
      return res.json("Error updating store");
    }
    if (result.affectedRows === 0) {
      return res.json("Store not found");
    }
    return res.json("Store updated");
  });
});

//Customer
app.get('/customer', (req, res) => {
  const sql = "SELECT * FROM customer ORDER BY id DESC";

  pool.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.json("Error retrieving customer records");
    }
    console.log(result)
    return res.json(result);
  });
});

app.get('/customerId', (req, res) => {
  const { id } = req.query;
  const sql = "SELECT fName, lName FROM customer WHERE id = ?";

  pool.query(sql, [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.json("Error retrieving customer records");
    }
    console.log(result)
    return res.json(result);
  });
});

app.get('/salesRecord', (req, res) => {
  const { id } = req.query;
  const sql = "SELECT s.salesId, p.name, p.description, s.dateTimePurchased, s.price, s.quantity, s.transId FROM sales s JOIN product p ON s.productId = p.id WHERE s.transId = ?";

  pool.query(sql, [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.json("Error retrieving sales records");
    }
    console.log(result)
    return res.json(result);
  });
});

app.put('/customer/:id', (req, res) => {
  const { id } = req.params;
  const {
    fName, 
    lName, 
    mName, 
    email, 
    contactNo, 
    address, 
    bDate, 
    contactPersonName, 
    contactPersonNo, 
    remarks,
    sourceOfReferral,
    providers,
    caseNumber
  } = req.body;
  const sql = "UPDATE customer SET fName = ?, lName = ?, mName = ?, email = ?, contactNo = ?, address = ?, bDate = ?, contactPersonName = ?, contactPersonNo = ?, remarks = ?, sourceOfReferral = ?, providers =?, caseNumber= ?  WHERE id = ?";
  const values = [fName, lName, mName, email, contactNo, address, bDate, contactPersonName, contactPersonNo, remarks, sourceOfReferral, providers, caseNumber, id];

  pool.query(sql, values, (err, result) => {
    if (err) {
      console.error(err);
      return res.json("Error updating customer");
    }
    if (result.affectedRows === 0) {
      return res.json("Customer not found");
    }
    return res.json("Customer updated");
  });
});

app.post('/customer', (req, res) => {
  const {
    fName, 
    lName, 
    mName, 
    email, 
    contactNo, 
    address, 
    bDate, 
    contactPersonName,
    contactPersonNo,
    remarks,
    sourceOfReferral,
    providers,
    caseNumber

  } = req.body;
  const sql = "INSERT INTO customer (fName, lName, mName, email, contactNo, address, bDate, contactPersonName, contactPersonNo, remarks, sourceOfReferral, providers, caseNumber) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
  const values = [fName, lName, mName, email, contactNo, address, bDate, contactPersonName, contactPersonNo, remarks, sourceOfReferral, providers, caseNumber];

  pool.query(sql, values, (err, result) => {
    if (err) {
      console.error(err);
      return res.json("Error adding customer");
    }
    console.log(result)
    return res.json(result);
  });
})

app.post('/select', (req, res) => {
  const sql = "SELECT * FROM customer";

  pool.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.json("Error retrieving customer records");
    }
    console.log(result)
    return res.json(result);
  });
})

app.put('/select/:id', (req, res) => {
  const { id } = req.params;
  const { isSelected } = req.body;

  const sqlUpdateSelected = "UPDATE customer SET isSelected = ? WHERE id = ?";
  const valuesUpdateSelected = [isSelected, id];

  pool.query(sqlUpdateSelected, valuesUpdateSelected, (err, result) => {
    if (err) {
      console.error(err);
      return res.json("Error updating customer");
    }
    if (result.affectedRows === 0) {
      return res.json("Customer not found");
    }

    const sqlUpdateOthers = "UPDATE customer SET isSelected = ? WHERE id <> ?";
    const valuesUpdateOthers = [false, id];

    pool.query(sqlUpdateOthers, valuesUpdateOthers, (err, result) => {
      if (err) {
        console.error(err);
        return res.json("Error updating customers");
      }
      return res.json("Customers updated");
    });
  });
});

app.put('/deleteCustomer/:id', (req, res) => {
  const { id } = req.params;
  const { isDeleted } = req.body;

  const sql = "UPDATE customer SET isDeleted = ? WHERE id = ?";
  const values = [isDeleted, id];

  pool.query(sql, values, (err, result) => {
    if (err) {
      console.error(err);
      return res.json("Error updating customer");
    }
    if (result.affectedRows === 0) {
      return res.json("Customer not found");
    }
    return res.json("Customer updated");
  });
});

//Split Payment
app.post('/splitPayment', (req, res) => {
  const {
    transId,
    items,
    amount,
    money,
    balance,
    receiptNo,
    customerId,
    modeOfPayment,
    accNo
  } = req.body;

  // Check if the receipt number already exists in the splitpayment table
  const checkReceiptSql = "SELECT COUNT(*) AS count FROM splitpayment WHERE receiptNo = ?";
  const checkReceiptValues = [receiptNo];

  pool.query(checkReceiptSql, checkReceiptValues, (checkErr, checkResult) => {
    if (checkErr) {
      console.error(checkErr);
      return res.status(502).json({ success: false, message: "Error checking receipt number" });
    }

    const receiptCount = checkResult[0].count;

    if (receiptCount > 0) {
      return res.json({ success: false, message: "Receipt number already exists in splitpayment" });
    } else {
      const sql = "INSERT INTO splitpayment (`transId`, `items`, `amount`, `cash`, `balance`, `transDate`, `receiptNo`, `customerId`, `modeOfPayment`, `accNo`) VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?)";
      
      pool.query(sql, [transId, items, amount, money, balance, receiptNo, customerId, modeOfPayment, accNo], (err, result) => {
        if (err) {
          console.error(err);
          return res.status(504).json({ success: false, message: "Split payment error" });
        } else {
          return res.status(200).json({ success: true, message: "Split payment successful", id: result.insertId });
        }
      });
    }
  });
});


app.get('/splitPayment', (req, res) => {
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
});

app.get('/splitPaymentRecords', (req, res) => {
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
})

const PORT = process.env.PORT || 8082;

app.get('/', (req, res) => {
  res.send(`Server is running : ${PORT}`);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
