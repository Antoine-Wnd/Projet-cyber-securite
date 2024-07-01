const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const validator = require("validator");
const session = require("express-session");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "static")));
app.set("views", path.join(__dirname, "templates"));
app.set("view engine", "ejs");

// Base de données par défaut
let predictions = [
  {
    user: "Antoine",
    match: "France - Slovénie",
    prediction: "La France gagne",
  },
  {
    user: "Hugo",
    match: "Angleterre - Hongrie",
    prediction: "L'Angleterre gagne",
  },
];

let users = {
  Alice: { id: 1, role: "user", password: "password1" },
  Bob: { id: 2, role: "user", password: "password2" },
  Admin: { id: 3, role: "admin", password: "admin" },
};

// Configuration de la session
app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    },
  })
);

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (users[username] && users[username].password === password) {
    req.session.userId = users[username].id;
    req.session.role = users[username].role;
    res.redirect("/");
  } else {
    res.status(401).send("Invalid username or password");
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

app.get("/", (req, res) => {
  res.render("index", { predictions: predictions, userId: req.session.userId });
});

app.post("/predict", (req, res) => {
  const user = req.body.user;
  const match = req.body.match;
  const prediction = req.body.prediction;
  if (
    !validator.matches(user, /^[a-zA-Z0-9\s]+$/) ||
    !validator.matches(match, /^[a-zA-Z0-9\s]+$/) ||
    !validator.matches(prediction, /^[a-zA-Z0-9\s]+$/)
  ) {
    return res.status(400).send("Format de l'input invalide");
  }

  predictions.push({
    user: validator.escape(user),
    match: validator.escape(match),
    prediction: validator.escape(prediction),
  });
  res.redirect("/");
});

// Middleware pour vérifier si l'utilisateur est un administrateur
function isAdmin(req, res, next) {
  if (req.session.role === "admin") {
    next();
  } else {
    res.status(403).send("Access denied");
  }
}

app.get("/admin", isAdmin, (req, res) => {
  res.render("admin", { users: users });
});

app.get("/admin/user/:userId", isAdmin, (req, res) => {
  const userId = parseInt(req.params.userId);
  for (const [user, details] of Object.entries(users)) {
    if (details.id === userId) {
      return res.render("prediction", { user: user, predictions: predictions });
    }
  }
  res.status(404).send("User not found");
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
