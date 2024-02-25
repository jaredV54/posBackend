import mysql from 'mysql2';
import { config as dotenvConfig } from 'dotenv';
dotenvConfig();

export const pool = mysql.createPool({
  host: process.env.DB_HOST, 
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

/* export const pool = mysql.createPool({
  host: '127.0.0.1', 
  user: 'root',
  password: '4hq183kl',
  database: 'pos',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}); */