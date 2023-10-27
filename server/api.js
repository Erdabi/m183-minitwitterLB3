const { initializeDatabase, queryDB, insertDB } = require("./database");
const { body } = require("express-validator");
const jwt = require("jsonwebtoken");
const pino = require("pino")();
const AesEncryption = require("aes-encryption");

let db;
const jwtSecret = "supersecret";
const aes = new AesEncryption();
aes.setSecretKey(
  process.env.SECRET ||
    "11122233344455566677788822244455555555555555555231231321313aaaff"
);

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
function containsHTML(str) {
  const htmlPattern = /<[^>]*>/;
  return htmlPattern.test(str);
}
const postTweet = async (req, res) => {
  const { username, timestamp, text } = req.body;

  if (containsHTML(text) === true) {
    res.json({ status: "ok" });
  } else {
    try {
      const encryptedText = aes.encrypt(text);
      const query = `INSERT INTO tweets (username, timestamp, text) VALUES ('${username}', '${timestamp}', '${encryptedText}')`;
      await queryDB(db, query);
      res.json({ status: "ok" });
    } catch (error) {
      pino.error("Error posting tweet:", error.message);
      res.status(500).json({ error: "Internal Server Error." });
    }
  }
};

const getFeed = async (req, res) => {
  const query = "SELECT * FROM tweets ORDER BY id DESC;";
  
  
  
    try {
      const tweets = await queryDB(db, query);
      res.json(tweets);
    } catch (error) {
      pino.error("Error fetching feed:", error.message);
      res.status(500).json({ error: "Internal Server Error." });
    }
  }
  
//};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
    const user = await queryDB(db, query);

    if (user.length === 1) {
      const username = user[0].username;
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
