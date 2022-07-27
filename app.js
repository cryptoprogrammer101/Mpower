const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose")

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.render("index")
})

app.get("/index", (req, res) => {
    res.redirect("/")
})

app.get("/about", (req, res) => {
    res.render("about")
})

app.get("/contact", (req, res) => {
    res.render("contact")
})

app.get("/signup", (req, res) => {
    res.render("signup")
})

app.get("/login", (req, res) => {
    res.render("login")
})

app.get("/help", (req, res) => {
    res.render("help")
})

app.get("/home", (req, res) => {
    res.render("home")
})

app.get("/resources", (req, res) => {
    res.render("resources")
})

app.listen(3000, () => {
    console.log("Server started successfully");
  });
  