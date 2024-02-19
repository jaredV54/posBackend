import { pool } from "../db.js";

//Create user
export const addUser = (req, res) => {
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
};
  
//Get user
export const retrieveUser = (req, res) => {
  const sql = "SELECT l.id, l.name, l.email, l.password, l.userType, l.storeId, s.storeName FROM login l LEFT JOIN store s ON l.storeId = s.id ORDER BY l.id ASC";
  pool.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.json("Error retrieving user data");
    }
    return res.json(result);
  });
};

//Update Account
export const updateUserAcc = (req, res) => {
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
};
  
//Delete Account
export const deleteUserAcc = (req, res) => {
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
};