//require("dotenv").config();
const path = require("path");
const express = require("express");
const hbs = require("hbs");

// load route
const admin = require("./routes/admin");
const connection = require("./db");

const app = express();
const publicDirectory = path.join(__dirname, "../public");
const viewsPath = path.join(__dirname, "../templates/views");
const partialsPath = path.join(__dirname, "../templates/partials");

app.set("view engine", "hbs");
app.set("views", viewsPath);
app.use(express.static(publicDirectory));

// Use routes
app.use("/", admin);

hbs.registerHelper("trimString", function (passedString) {
  var theString = passedString.substring(0, 150);
  return new hbs.SafeString(theString);
});

hbs.registerPartials(partialsPath);

app.listen(3000, "127.0.0.1", () => {
  console.log("listening on port 3000");
});
