require("dotenv").config();
const path = require("path");
const express = require("express");
const hbs = require("hbs");
const bodyParser = require("body-parser");
const multer = require("multer");
const nodemailer = require("nodemailer");
// const upload = multer({
//   dest: path.join(__dirname, "../public") + "/img",
//   limits: {
//     fileSize: 50000000,
//   },
//   fileFilter(req, file, cb) {
//     if (!file.originalname.match(/\.(png|jpg)$/)) {
//       return cb(new Error("Pleae upload image!"));
//     }
//     const extname = path.extname(file.originalname).toLowerCase();

//     console.log(extname);
//     cb(undefined, true);
//   },
//   filename: function (req, file, callback) {
//     callback(null, file.originalname);
//   },
// });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public") + "/img");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

const app = express();
const publicDirectory = path.join(__dirname, "../public");
const viewsPath = path.join(__dirname, "../templates/views");
const partialsPath = path.join(__dirname, "../templates/partials");

app.set("view engine", "hbs");
app.set("views", viewsPath);
app.use(express.static(publicDirectory));
app.use(bodyParser.json());

hbs.registerHelper("trimString", function (passedString) {
  var theString = passedString.substring(0, 150);
  return new hbs.SafeString(theString);
});

//app.use(bodyParser.urlencoded());
// in latest body-parser use like below.
app.use(bodyParser.urlencoded({ extended: true }));
//app.use(express.urlencoded({ extended: true }));

hbs.registerPartials(partialsPath);

/// db setting
const mysql = require("mysql2");
//create the connection to database
const connection = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.USER,
  //password: process.env.PASSWORD,
  database: process.env.DATABASE,
});

const smtpTransport = nodemailer.createTransport({
  host: process.env.Smtp_host,
  port: process.env.Smtp_port,
  secureConnection: false,
  //secure: process.env.Smtp_secure,
  auth: {
    user: process.env.Smtp_auth_user,
    pass: process.env.Smtp_auth_password,
  },
  tls: {
    ciphers: "SSLv3",
  },
  pool: process.env.Smtp_pool,
});

app.get("/about-us", function (req, res) {
  res.render("about-us");
});
app.get("/add", (req, res) => {
  res.render("add");
});

app.get("/privacy-policy", (req, res) => {
  res.render("privacy-policy");
});
app.post(
  "/add",
  upload.single("artpic"),
  function (req, res) {
    const item = {
      title: req.body.title,
      description: req.body.description,
      image: req.file.originalname,
      body: req.body.body,
    };

    connection.query("INSERT INTO content set ?", item, (err, result) => {
      if (err) {
        //console.log(err);
        return res.send(err);
      }
      return res.send("data added successfully!");
    });
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

app.get("/articles", (req, res) => {
  connection.query("SELECT * FROM content", (error, result, fields) => {
    if (error) {
      return res.send(error);
    }
    return res.render("articles", { article: result });
  });
});

app.get("/edit/:id", (req, res) => {
  connection.query(
    `SELECT * FROM content WHERE id =${req.params.id}`,
    (error, result, fields) => {
      if (error) {
        return res.send(error);
      }
      console.log(result[0]);
      return res.render("edit", { article: result[0] });
    }
  );
});

app.post(
  "/edit",
  upload.single("artpics"),
  function (req, res) {
    if (req.file) {
      connection.query(
        "UPDATE content SET title =?, description =?, body =?, image =? WHERE id =?",
        [
          req.body.title,
          req.body.description,
          req.body.body,
          req.file.originalname,
          req.body.id,
        ],
        (err, result) => {
          if (err) {
            return res.send(err);
          }
          res.redirect("/articles");
        }
      );
    } else {
      connection.query(
        "UPDATE content SET title =?, description =?, body =? WHERE id =?",
        [req.body.title, req.body.description, req.body.body, req.body.id],
        (err, result) => {
          if (err) {
            return res.send(err);
          }

          res.redirect("/articles");
        }
      );
    }
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

app.get("/delete/:id", (req, res) => {
  connection.query(
    `DELETE FROM content WHERE id=${req.params.id}`,
    (err, result, fields) => {
      if (err) {
        return res.send(err);
      }
      res.redirect("/articles");
    }
  );
});

app.get("/story/:id", (req, res) => {
  connection.query(
    `SELECT * FROM content WHERE id=${req.params.id}`,
    (err, result, fields) => {
      if (err) {
        return res.send(err);
      }
      return res.render("story", { story: result[0] });
    }
  );
});

app.get("/", (req, res) => {
  connection.query("SELECT * FROM content", (error, result, fields) => {
    if (error) {
      console.log(error);
    }

    res.render("index", { content: result });
  });
});

app.get("/contact-us", (req, res) => {
  res.render("contact-us");
});
app.post("/email", (req, res) => {
  const mailOptions = {
    from: process.env.Mail_Send_From, // Sender address
    to: "ashok@embin.com", // List of recipients
    subject: "Pinga.us Technologies", // Subject line
    text: `Message from  Contact us , Name: ${req.body.name} , Email: ${req.body.email} , Subject: ${req.body.subject} --  Message: ${req.body.message}`, // Plain text body
  };

  smtpTransport.sendMail(mailOptions, function (error, response) {
    if (error) {
      console.log(error);
    } else {
      console.log(response);
    }
    smtpTransport.close();
    return res.redirect("/thankyou");
  });
});

app.get("/thankyou", function (req, res) {
  res.render("thankyou");
});

app.listen(3000, () => {
  console.log("listening on port 3000");
});
