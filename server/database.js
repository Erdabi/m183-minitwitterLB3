const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const pino = require("pino")();

const tweetsTableExists =
  "SELECT name FROM sqlite_master WHERE type='table' AND name='tweets'";
const createTweetsTable = `CREATE TABLE tweets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT,
  timestamp TEXT,
  text TEXT
)`;
const usersTableExists =
  "SELECT name FROM sqlite_master WHERE type='table' AND name='users'";
const createUsersTable = `CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT,
  password TEXT
)`;
const seedUsersTable = `INSERT INTO users (username, password) VALUES
('switzerchees', '123456'),
('john', '123456'),
('jane', '123456');`

const initializeDatabase = async () => {
  const db = new sqlite3.Database("./minitwitter.db");

  db.serialize(() => {
    db.get(tweetsTableExists, [], async (err, row) => {
      if (err) {
        pino.error(err, "Error checking if tweets table exists");
        return;
      }
      if (!row) {
        pino.info("Creating tweets table");
        await db.run(createTweetsTable);
      }
    });
    db.get(usersTableExists, [], async (err, row) => {
      if (err) {
        pino.error(err, "Error checking if users table exists");
        return;
      }
      if (!row) {
        pino.info("Creating users table");
        db.run(createUsersTable, [], async (err) => {
          if (err) {
            pino.error(err, "Error creating users table");
            return;
          }
          pino.info("Seeding users table");
          db.run(seedUsersTable);
        });
      }
    });
  });

  return db;
};

const insertDB = (db, query) => {
  return new Promise((resolve, reject) => {
    db.run(query, [], (err, rows) => {
      if (err) {
        pino.error(err, "Error inserting into the database");
        return reject(err);
      }
      resolve(rows);
    });
  });
};

const queryDB = (db, query) => {
  return new Promise((resolve, reject) => {
    db.all(query, [], (err, rows) => {
      if (err) {
        pino.error(err, "Error querying the database");
        return reject(err);
      }
      resolve(rows);
    });
  });
};

module.exports = { initializeDatabase, queryDB, insertDB };
