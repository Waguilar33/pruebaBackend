const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");

// Database
const loki = require("lokijs");
const db = new loki("database");
var credentials = db.addCollection("credentials", { indices: ["id"] });
var messages = db.addCollection("messages", { indices: ["id"] });

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.put("/api/credential", (req, res) => {
  // search the key in the db collection
  var found = credentials.findOne({ key: req.body.key });

  if (!found) {
    credentials.insert({
      key: req.body.key,
      shared_secret: req.body.shared_secret,
    });
    res.status(204).send();
  } else {
    // The key is already in the database;
    res.status(403).send("The key is already in the server database");
  }
});

app.listen(3333, () => {
  console.log("Node server started on port 3333.");
});