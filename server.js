const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: '127.0.0.1', 
  user: 'root',
  password: '4hq183kl',
  database: 'POS',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

//Create user
app.post('/user', (req, res) => {
  const sql = "INSERT INTO login (`name`, `email`, `password`, `userType`, `storeId`) VALUES ?";
  const values = [
    [
      req.body.name,
      req.body.email,
      req.body.password,
      req.body.userType,
      req.body.storeId
    ]
  ];
  pool.query(sql, [values], (err, results) => {
    if (err) {
      console.error(err);
      return res.json("Error");
    }
    return res.json(results);
  });
});

//Get user
app.get('/user', (req, res) => {
  const sql = "SELECT l.id, l.name, l.email, l.password, l.userType, l.storeId, s.storeName FROM login l LEFT JOIN store s ON l.storeId = s.id";
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

/* Host Page */

// Create product
app.post('/product', (req, res) => {
  const { name, description, isDeleted, price, quantity, image, imageHover } = req.body;
  const sql = "INSERT INTO product (name, description, isDeleted, price, quantity, image, imageHover) VALUES (?, ?, ?, ?, ?, ?, ?)";
  const values = [name, description, isDeleted, price, quantity, image, imageHover];

  pool.query(sql, values, (err, result) => {
    if (err) {
      console.error(err);
      return res.json("Error creating product");
    }
    return res.json("Product created");
  });
});

// Get all products
app.get('/product', (req, res) => {
  const sql = "SELECT * FROM product";

  pool.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.json("Error retrieving products " +  err);
    }
    return res.json(result);
  });
});

// Update a product by ID
app.put('/product/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, isDeleted, price, quantity, image, imageHover } = req.body;
  const sql = "UPDATE product SET name = ?, description = ?, isDeleted = ?, price = ?, quantity = ?, image = ?, imageHover = ? WHERE id = ?";
  const values = [name, description, isDeleted, price, quantity, image, imageHover, id];

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

// Delete a product by ID
app.put('/product/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, isDeleted, price, quantity, image, imageHover } = req.body;
  const sql = "UPDATE product SET name = ?, description = ?, isDeleted = ?, price = ?, quantity = ?, image = ?, imageHover = ? WHERE id = ?";
  const values = [name, description, isDeleted, price, quantity, image, imageHover, id];

  pool.query(sql, values, (err, result) => {
    if (err) {
      console.error(err);
      return res.json("Error deleting product");
    }
    if (result.affectedRows === 0) {
      return res.json("Product not found");
    }
    return res.json("Product deleted");
  });
});

/* Purchase & SalesRecord Page */

//Get products by id
app.get('/purchase/:id', (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM product WHERE id = ?";

  pool.query(sql, [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Error displaying product" });
    }
    if (result.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    const product = result[0];
    return res.json(product);
  });
});

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
  const { items, amount, money, change, customerId, receiptNo, modeOfPayment, accNo, typeOfPayment } = req.body;
  const sql = "INSERT INTO transactions (items, amount, cash, changeAmount, transDate, `customerId`, `receiptNo`, `modeOfPayment`, `accNo`, `typeOfPayment`) VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?)";
  const values = [items, amount, money, change, customerId, receiptNo, modeOfPayment, accNo, typeOfPayment];

  pool.query(sql, values, (err, result) => {
    if (err) {
      console.error(err);
      return res.json({ success: false, message: "Transaction error" });
    } else {
      return res.json({ success: true, message: "Transaction successful", id: result.insertId });
    }
  });
});

app.get('/transactions', (req, res) => {
  const sql = "SELECT t.id, t.items, t.amount, t.cash, t.changeAmount, t.transDate, t.customerId, c.fName, c.lName, t.receiptNo, t.modeOfPayment, t.accNo, t.typeOfPayment FROM transactions t JOIN customer c ON c.id = t.customerId ORDER BY t.id DESC;";

  pool.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.json("Error retrieving transaction records");
    }
    console.log(result)
    return res.json(result);
  });
})

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
  const sql = "SELECT * FROM customer";

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
    company, 
    companyContactNo 
  } = req.body;
  const sql = "UPDATE customer SET fName = ?, lName = ?, mName = ?, email = ?, contactNo = ?, address = ?, bDate = ?, contactPersonName = ?, contactPersonNo = ?, company = ?, companyContactNo = ?  WHERE id = ?";
  const values = [fName, lName, mName, email, contactNo, address, bDate, contactPersonName, contactPersonNo, company, companyContactNo, id];

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
    company, 
    companyContactNo 
  } = req.body;
  const sql = "INSERT INTO customer (fName, lName, mName, email, contactNo, address, bDate, contactPersonName, contactPersonNo, company, companyContactNo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
  const values = [fName, lName, mName, email, contactNo, address, bDate, contactPersonName, contactPersonNo, company, companyContactNo];

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
    company, 
    companyContactNo,
    isDeleted
  } = req.body;
  const sql = "UPDATE customer SET fName = ?, lName = ?, mName = ?, email = ?, contactNo = ?, address = ?, bDate = ?, contactPersonName = ?, contactPersonNo = ?, company = ?, companyContactNo = ?, isDeleted = ?  WHERE id = ?";
  const values = [fName, lName, mName, email, contactNo, address, bDate, contactPersonName, contactPersonNo, company, companyContactNo, isDeleted, id];

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
  } = req.body
  const sql = "INSERT INTO splitpayment (`transId`, `items`, `amount`, `cash`, `balance`, `transDate`, `receiptNo`, `customerId`, `modeOfPayment`, `accNo`) VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?)";
  pool.query(sql, [transId, items, amount, money, balance, receiptNo, customerId, modeOfPayment, accNo], (err, result) => {
    if (err) {
      console.error(err);
      return res.json({ success: false, message: "Transaction error" });
    } else {
      return res.json({ success: true, message: "Transaction successful", id: result.insertId });
    }
  })
})

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
  const sql = "SELECT * FROM splitpayment";
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

const buildpath = path.join(__dirname, "../posFrontend/build");

app.use(express.static(buildpath));

app.get("/*", function(req, res) {
  res.sendFile(
    path.join(__dirname, "../posFrontend/build", "index.html"), 
    function(err) {
      if (err) {
        res.status(500).send(err);
      }
    }
  );
});


const PORT = 8081;

app.get('/', (req, res) => {
  res.send(`Server is running : 8081`);
});

app.listen(PORT, () => {
  console.log('Server is running on port 8081');
});
