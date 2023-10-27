const { initializeDatabase, queryDB, insertDB } = require("./database");
const { body } = require("express-validator");
const jwt = require('jsonwebtoken');
const pino = require("pino")();

let db;

const authMiddleware = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    pino.error("No authorization header.");
    return res.status(401).json({ error: "No authorization header." });
  }
  const [prefix, token] = authorization.split(" ");
  if (prefix !== "Bearer") {
    pino.error("Invalid authorization prefix.");
    return res.status(401).json({ error: "Invalid authorization prefix." });
  }
  try {
    const tokenValidation = jwt.verify(token, jwtSecret);
    if (!tokenValidation?.data) {
      pino.error("Invalid token.");
      return res.status(401).json({ error: "Invalid token." });
    }
    next();
  } catch (error) {
    pino.error("Token verification error:", error.message);
    return res.status(401).json({ error: "Token verification error." });
  }
};

const initializeAPI = async (app) => {
  db = await initializeDatabase();
  app.get("/api/feed", getFeed);
  app.post("/api/feed", postTweet);
  app.post(
    "/api/login",
    body("username")
      .notEmpty()
      .withMessage("Username is required.")
      .isEmail()
      .withMessage("Invalid email format."),
    body("password")
      .isLength({ min: 6, max: 64 })
      .withMessage("Password must be between 6 to 64 characters.")
      .escape(),
    login
  );
  app.get("/api/feed", authMiddleware, getFeed);
  app.post(
    "/api/feed",
    authMiddleware,
    body("username").notEmpty().withMessage("username is required."),
    body("timestamp").notEmpty().withMessage("timestamp is required."),
    body("text").notEmpty().withMessage("text is required."),
    postTweet
  );
};

const getFeed = async (req, res) => {
  try {
    const query = "SELECT * FROM tweets ORDER BY id DESC;";
    const tweets = await queryDB(db, query);
    res.json(tweets);
  } catch (error) {
    pino.error("Error fetching feed:", error.message);
    res.status(500).json({ error: "Internal Server Error." });
  }
};

const postTweet = async (req, res) => {
  try {
    const { username, timestamp, text } = req.body;
    const query = `INSERT INTO tweets (username, timestamp, text) VALUES ('${username}', '${timestamp}', '${text}')`;
    await queryDB(db, query);
    res.json({ status: "ok" });
  } catch (error) {
    pino.error("Error posting tweet:", error.message);
    res.status(500).json({ error: "Internal Server Error." });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
    const user = await queryDB(db, query);

    if (user.length === 1) {
      const username = user[0].username;
      const jwtSecret = "supersecret";
      const token = jwt.sign(
        {
          exp: Math.floor(Date.now() / 1000) + 60 * 60,
          data: username,
        },
        jwtSecret
      );
      res.json({ token });
    } else {
      pino.error("Username or password invalid.");
      res.status(401).json({ error: "Username or password invalid!" });
    }
  } catch (error) {
    pino.error("Login error:", error.message);
    res.status(500).json({ error: "Internal Server Error." });
  }
};

module.exports = { initializeAPI };
