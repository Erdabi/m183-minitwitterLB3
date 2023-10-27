const express = require("express");
const http = require("http");
const pino = require("pino")();
const { initializeAPI } = require("./api");
const { rateLimit } = require("express-rate-limit");

// Create the express server
const app = express();
app.disable("x-powered-by");
app.use(express.json());

const server = http.createServer(app);

// Deliver static files from the client folder like css, js, images
app.use(express.static("client"));

// Route for the homepage
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/client/index.html");
});

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 Minute
  limit: 50, // Limit each IP to 50 requests per windowMs
  standardHeaders: "draft-7",
  legacyHeaders: false,
});
// Apply the rate limiting middleware to all requests
app.use(limiter);

// Initialize the REST API
initializeAPI(app); 

// Start the web server
const serverPort = process.env.PORT || 3001;
server.listen(serverPort, () => {
  pino.info(`Express Server started on port ${serverPort}`);
});
