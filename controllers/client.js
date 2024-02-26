import { pool } from "../db.js"

// Retrieve Client Information
export const clientInfo = (req, res) => {
  const { displayCount } = req.query;
  const sql = `SELECT * FROM customer WHERE isDeleted IS NULL OR isDeleted != true ORDER BY id DESC LIMIT ${displayCount}`;

  pool.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({isSuccessful: false, message: "Internal Error. Retrieving client records failed!"});
    }

    if (result.length > 0) {
      return res.status(200).json({isSuccessful: true, message: "Clients fetched.", result: result});
    } else {
      return res.status(404).json({isSuccessful: false, message: "Database error. Contact the developer"});
    }
    
  });
};

// Retrieve Client Information
export const clientInfoPerId = (req, res) => {
  const { id } = req.query;
  const sql = "SELECT fName, lName FROM customer WHERE id = ?";

  pool.query(sql, [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({isSuccessful: false, message: "Error retrieving customer records."});
    }

    return res.status(200).json({isSuccessful: true, result: result, message: "Customer record retrived successfully!"});
  });
};

// Update Client Information
export const updateClientInfo = (req, res) => {
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
    service,
    remarks,
    sourceOfReferral,
    providers,
    caseNumber
  } = req.body;
  const sql = "UPDATE customer SET fName = ?, lName = ?, mName = ?, email = ?, contactNo = ?, address = ?, bDate = ?, contactPersonName = ?, contactPersonNo = ?, remarks = ?, sourceOfReferral = ?, providers = ?, caseNumber = ?, service = ? WHERE id = ?";
  const values = [fName, lName, mName, email, contactNo, address, bDate, contactPersonName, contactPersonNo, remarks, sourceOfReferral, providers, caseNumber, service, id];

  pool.query(sql, values, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({isSuccessful: false, message: "Updating client failed. Internal server error."});
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({isSuccessful: false, message: "Updating client failed. Database error!"});
    }
    return res.status(200).json({isSuccessful: true, message: "Client info updated successfully!"});
  });
};

// Add new Client
export const addNewClient = (req, res) => {
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
    service,
    remarks,
    sourceOfReferral,
    providers,
    caseNumber

  } = req.body;
  const sql = "INSERT INTO customer (fName, lName, mName, email, contactNo, address, bDate, contactPersonName, contactPersonNo, remarks, sourceOfReferral, providers, caseNumber, service) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
  const values = [fName, lName, mName, email, contactNo, address, bDate, contactPersonName, contactPersonNo, remarks, sourceOfReferral, providers, caseNumber, service];

  pool.query(sql, values, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({isSuccessful: false, message: "Adding new Client failed. Internal server error."});
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({isSuccessful: false, message: "Adding new Client failed. Database error!"});
    }
    return res.status(200).json({isSuccessful: true, message: "New Client added successfully!"});
  });
};

// Delete Client by id
export const deleteClient = (req, res) => {
  const { id } = req.params;
  const { isDeleted } = req.body;

  const sql = "UPDATE customer SET isDeleted = ? WHERE id = ?";
  const values = [isDeleted, id];

  pool.query(sql, values, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({isSuccessful: false, message: "Error updating customer"});
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({isSuccessful: false, message: "Client not found. Database error."});
    }
    return res.status(200).json({isSuccessful: true, message: "Deleted Successfully!"});
  });
};
