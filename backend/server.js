const express = require("express");
//const cors = require("cors");

const app = express();

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

const db = require("./app/models");

// Retry MongoDB connection with exponential backoff
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 2000;

async function connectWithRetry(retries = 0) {
  try {
    await db.mongoose.connect(db.url, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("Connected to the database!");
  } catch (err) {
    if (retries >= MAX_RETRIES) {
      console.error(`Failed to connect after ${MAX_RETRIES} retries. Exiting.`);
      process.exit(1);
    }
    const delay = BASE_DELAY_MS * Math.pow(2, retries);
    console.warn(
      `MongoDB connection attempt ${retries + 1} failed. Retrying in ${delay / 1000}s...`,
      err.message
    );
    await new Promise(resolve => setTimeout(resolve, delay));
    return connectWithRetry(retries + 1);
  }
}

connectWithRetry();

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Test application." });
});

require("./app/routes/turorial.routes")(app);

// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
