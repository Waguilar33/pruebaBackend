const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const crypto = require("crypto");

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

function auth(req, res, next) {
  // first we will verify if the key exists
  var found = credentials.findOne({ key: req.headers["x-key"] });
  if (!found) {
    return res.status(403).send("The key doesn't exist");
  }

  // get shared_secret from previous query
  var sharedSecret = found.shared_secret;

  // Data to be signed
  var data = [];
  data.push(req.headers["x-route"]);

  // adds they key/value when params exists
  if (req.params) {
    for (var key in req.params) {
      data.push(key);
      data.push(req.params[key]);
    }
  }

  // adds they key/value when query string exists
  if (req.query) {
    for (var key in req.query) {
      data.push(key);
      data.push(req.query[key]);
    }
  }

  var lexicographicalSorted = data.sort((a, b) => a.localeCompare(b));
  var string = lexicographicalSorted.join([(separator = ";")]);

  // get signature generared from the client
  var retrievedSignature = req.headers["x-signature"];

  try {
    var computedSignature = crypto
      .createHmac("sha256", sharedSecret)
      .update(string)
      .digest("hex");
    console.log(computedSignature);

    const computedSignatureBuffer = Buffer.from(computedSignature, "hex");
    const retrievedSignatureBuffer = Buffer.from(retrievedSignature, "hex");

    const valid = crypto.timingSafeEqual(
      computedSignatureBuffer,
      retrievedSignatureBuffer
    );

    if (valid) {
      next();
    } else {
      return res.status(403).send("The signature doesnt match");
    }
  } catch (e) {
    return res.status(403).send(e);
  }
}

app.post("/api/message", auth, (req, res) => {
  var newRecord = messages.insert({
    msg: req.body.msg,
    tags: req.body.tags,
  });

  res.json(newRecord.$loki);
});

app.post("/api/message", auth, (req, res) => {
  var newRecord = messages.insert({
    msg: req.body.msg,
    tags: req.body.tags,
  });

  res.json(newRecord.$loki);
});

app.get("/api/message/:id", auth, (req, res) => {
  var result = messages.get(req.params.id);
  if (!result) {
    return res.status(200).send("Everything is working, we simple didn't find a message with the given id");
  }
  res.json(result);
});

app.get("/api/messages/:tag", auth, (req, res) => {
  var results = messages.find({ 'tags' : { '$contains' : req.params.tag } });
  if (!results) {
    return res.status(200).send("Everything is working, we simple didn't find messages related to the tag given");
  }
  res.json(results);
});

app.listen(3333, () => {
  console.log("Node server started on port 3333.");
});