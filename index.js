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

app.listen(3333, () => {
  console.log("Node server started on port 3333.");
});