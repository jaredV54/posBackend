import { pool } from "../db.js";

// Retrieve Places
export const retrievePlace = (req, res) => {
  const sql = "SELECT * FROM store";

  pool.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({isSuccessful: false, message: "Error retrieving store records", error: err.message});
    }

    if (result.length === 0) {
      return res.status(404).json({ isSuccessful: false, message: "No place info found." });
    }

    return res.status(200).json({isSuccessful: true, result: result});
  });
};

// Add new Place
export const addPlace = (req, res) => {
  const {storeName, address, email, contactNo, birTin, branch} = req.body;
  const sql = "INSERT INTO store (storeName, address, contactNumber, email, birTin, branchName) VALUES (?, ?, ?, ?, ?, ?)";
  const values = [storeName, address, contactNo, email, birTin, branch]

  pool.query(sql, values, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({isSuccessful: false, message: err.message});
    }

    if (result.affectedRows === 0) {
     return res.status(404).json({isSuccessful: false, message: "Invalid input or duplicate entry."})
    }

    return res.status(200).json({isSuccessful: true, message: "New Place added!", result: result});
  });
};

// Delete Place by ID
export const deletePlace = (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM store WHERE id = ?";
  const values = [id];

  pool.query(sql, values, (err, result) => {
    if (err) {
      console.error(err);
      return res.json({isSuccessful: false, message: "Error deleting store"});
    }
    if (result.affectedRows === 0) {
      return res.json({isSuccessful: false, message: "Place stored ID didn't found; Internal error!"});
    }
    return res.json({isSuccessful: true, message: "Deleted Successfully", result: result});
  });
};

// Update Place by ID
export const updatePlace = (req, res) => {
  const { id } = req.params;
  const {storeName, address, email, contactNo, birTin, branch} = req.body;
  const sql = "UPDATE store SET storeName = ?, address = ?, email = ?, contactNumber = ?, birTin = ?, branchName = ? WHERE id = ?";
  const values = [storeName, address, email, contactNo, birTin, branch, id];

  pool.query(sql, values, (err, result) => {
    if (err) {
      return res.status(500).json({isSuccessful: false, message: "Error"});
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({isSuccessful: false, message: "No existing place found; Internal error!"});
    }

    return res.status(200).json({isSuccessful: true, message: "Update successful!"});
  });
};