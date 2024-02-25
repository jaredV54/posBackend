import { pool } from "../db.js"

// Create hybrid
export const addNewHybrid = (req, res) => {
    const { name, description, price, quantity, hybrid, branch, listLabel, priceLabel } = req.body;
    const sql = "INSERT INTO product (name, price, quantity, description, hybrid, listLabel, priceLabel) VALUES (?, ?, ?, ?, ?, ?, ?)";
    const values = [name, price, quantity, description, hybrid, listLabel, priceLabel];
  
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
};
  
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
export const retrieveHybrids = (req, res) => {
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
        return res.status(500).json({ isSuccessful: false, message: "Internal error. Please check your internet." });
      }
      if (result.length > 0) {
        return res.status(200).json({isSuccessful: true, result: result});
      } else {
        return res.status(404).json({ isSuccessful: false, message: "No results found!" });
      }
    });
};

//Update hybrid 
export const updateHybrid = (req, res) => {
  const { id } = req.params;
  const {
    name,
    price,
    quantity,
    description,
    hybrid,
    listLabel,
    priceLabel,
    branch,
  } = req.body;

  const updateProductQuery = 'UPDATE product SET name = ?, price = ?, quantity = ?, description = ?, listLabel = ?, priceLabel = ? WHERE id = ?';
  const deleteAssessmentQuery = 'DELETE FROM assessment WHERE serviceId = ?';
  const insertAssessmentQuery = 'INSERT INTO assessment (serviceId, psycTest, standardRate) VALUES ?';

  const forUpdate = [name, price, quantity, description, listLabel, priceLabel, id];
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
};

//Delete Hybrid
export const deleteHyrbid = (req, res) => {
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
};

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
};

//Retrieve the current selected hybrid psychological test
export const retrievePsycTest = (req, res) => {
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
};