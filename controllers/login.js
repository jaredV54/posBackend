import { pool } from "../db.js"

// User login
export const userLogin = (req, res) => {
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
          return res.json({ message: "Requirements Matched", data: [{
            userType: emailData[0].userType, 
            storeId: emailData[0].storeId,
            userId: emailData[0].id
          }] });
        } else {
          return res.json("Wrong Password");
        }
      });
    } else {
      return res.json("Email doesn't exist");
    }
  });
};
 
// Retrieve User Type and what Place are they in
export const userTypeAndPlace = (req, res) => {
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
};

// Retrieve Place info for Total Sales and Split Payments
export const placeInfo = (req, res) => {
  const userTypeAndStoreQuery = "SELECT userType, storeId FROM login WHERE `email` = ?";
  pool.query(userTypeAndStoreQuery, [req.body.email, req.body.password], (err, result) => {
    if (err) {
      console.error("Error executing query:", err);
      return res.status(500).json({ warn: "Internal error. Please check your internet." });
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
          return res.status(404).json({ message: "Place not found" });
        }
        return res.json({ storeInfo: result[0] });
      });
    } else {
      return res.json({ storeInfo: {userTypeIs: 'admin'} })
    }
  });
};