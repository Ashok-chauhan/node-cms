require("dotenv").config();
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const router = express.Router();
const nodemailer = require("nodemailer");
const multer = require("multer");
const connection = require("../db");

const cookieParser = require("cookie-parser");
const sessions = require("express-session");

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));
const oneDay = 1000 * 60 * 60 * 24;
router.use(
  sessions({
    secret: "ashokKumarchauhan9",
    saveUninitialized: true,
    cookie: { maxAge: oneDay },
    resave: false,
  })
);
// cookie parser middleware
router.use(cookieParser());
var session;

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
    //ciphers: "SSLv3",
    rejectUnauthorized: false,
  },
  pool: process.env.Smtp_pool,
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../../public") + "/img");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

router.get("/", (req, res) => {
  connection.query("SELECT * FROM content", (error, result, fields) => {
    if (error) {
      console.log(error);
    }

    res.render("index", { content: result });
  });
});

router.get("/login", (req, res) => {
  session = req.session;

  if (session.userid) {
    return res.render("admin");
  }
  res.render("login");
});
router.post("/login", (req, res) => {
  const user = req.body.user;
  const pass = req.body.pass;
  if (user === "ashok975@hotmail.com" && pass === "pingaus") {
    //return res.send("Welcome User");

    session = req.session;
    session.userid = req.body.user;
    console.log(req.session);

    res.render("admin");
  } else {
    res.redirect("/login");
  }
});

router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

router.get("/about-us", function (req, res) {
  res.render("about-us");
});
router.get("/add", (req, res) => {
  if (!req.session.userid) return res.redirect("/login");
  res.render("add");
});

router.get("/privacy-policy", (req, res) => {
  res.render("privacy-policy");
});
router.post(
  "/add",
  upload.single("artpic"),
  function (req, res) {
    if (!req.session.userid) return res.redirect("/login");
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

router.get("/articles", (req, res) => {
  if (!req.session.userid) return res.redirect("/login");
  connection.query("SELECT * FROM content", (error, result, fields) => {
    if (error) {
      return res.send(error);
    }
    return res.render("articles", { article: result });
  });
});

router.get("/edit/:id", (req, res) => {
  if (!req.session.userid) return res.redirect("/login");
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

router.post(
  "/edit",
  upload.single("artpics"),
  function (req, res) {
    if (!req.session.userid) return res.redirect("/login");
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
      //console.log("#######" + req.body.title);
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

router.get("/delete/:id", (req, res) => {
  if (!req.session.userid) return res.redirect("/login");
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

router.get("/story/:id", (req, res) => {
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

router.get("/contact-us", (req, res) => {
  res.render("contact-us");
});
router.post("/email", (req, res) => {
  console.log("####" + JSON.stringify(req.body));
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

router.get("/thankyou", function (req, res) {
  res.render("thankyou");
});

module.exports = router;
