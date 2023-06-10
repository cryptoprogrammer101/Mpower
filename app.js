// import modules
const express = require("express")
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const uniqueValidator = require("mongoose-unique-validator")
const session = require("express-session")
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")
const fs = require("fs")

// suppress warning
mongoose.set("strictQuery", true)

// use express
const app = express()

// use ejs
app.set("view engine", "ejs")

// use body parser
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static("public"))

// use secret session
app.use(session({
    secret: "My little secret.",
    resave: false,
    saveUninitialized: false
}))

// use passport
app.use(passport.initialize())
app.use(passport.session())

// connect to mongodb
mongoose.connect("mongodb+srv://admin-narayan:test123@website.d1i0s.mongodb.net/websiteDB")

// define journal schema
const journalSchema = new mongoose.Schema({
    title: String,
    content: String,
    date: String
})

// define user schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: String,
    journals: [journalSchema],
    goals: [String]
})

// use unique validator
userSchema.plugin(uniqueValidator)

// use passport-local-mongoose
userSchema.plugin(passportLocalMongoose)

// create user model
const User = mongoose.model("User", userSchema)

// create journal model
const Journal = mongoose.model("Journal", journalSchema)

// use passport to verify user
passport.use(User.createStrategy())

// initialize passport
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

// retrieve random journal title
function getJournalTitle() {

    // read journal titles from file
    const data = fs.readFileSync("journalTitles.txt", "utf8")

    // split by newlines
    const titles = data.split("\n")

    // retrieve random journal title
    const title = titles[Math.floor(Math.random() * titles.length)]

    return title

}

// get quotes from text file
function getQuotes() {

    // read quotes from file
    const text = fs.readFileSync("quotes.txt", "utf8")

    // split by newlines
    const lines = text.split("\n")

    // create empty array
    const quotes = []

    // for each quote
    lines.forEach(line => {

        // shuffle quotes
        const index = Math.floor(Math.random() * quotes.length)

        // insert quote at random index
        quotes.splice(index, 0, line)

    })

    return quotes

}

// display corresponding resource page
function displayResourcePage(resource) {

    // define resource route
    app.get("/" + resource, (req, res) => {

        // if logged in
        if (req.isAuthenticated()) {

            // display logged-in page
            res.render("resources/" + resource + "-2")

            // otherwise
        } else {

            // display logged-out page
            res.render("resources/" + resource + "-1")

        }

    })

}

// define main route
app.get("/", (req, res) => {

    // if logged in
    if (req.isAuthenticated()) {

        // send to home page
        res.redirect("/home")

        // otherwise
    } else {

        // show start page
        res.render("index")

    }

})

// define signup route
app.get("/signup", (req, res) => {

    // if logged in
    if (req.isAuthenticated()) {

        // send to home page
        res.redirect("/home")

        // otherwise
    } else {

        // send to signup page
        res.render("signup", { err: "" })
    }

})

// when user signs up
app.post("/signup", (req, res) => {

    // register user
    User.register({ username: req.body.username }, req.body.password, (err, user) => {

        // if error
        if (err) {
            // display error to user
            res.render("signup", { err: req.body.username })

            // if no error

        } else {
            // log in user
            passport.authenticate("local")(req, res, () => {
                res.redirect("/home")
            })
        }
    })

})

// define login route
app.get("/login", (req, res) => {
    // if logged in
    if (req.isAuthenticated()) {
        // send to home page
        res.redirect("/home")

        // otherwise
    } else {
        // display login form
        res.render("login", { err: "" })
    }
})

// when user logs in
app.post("/login", (req, res) => {

    // create user object
    const user = new User({
        username: req.body.username,
        password: req.body.password
    })

    // log in user
    req.login(user, err => {

        // if error
        if (err) {
            // display error to user
            res.render("login", { err: err })

            // if no error
        } else {
            // log in user
            passport.authenticate("local", (err, user, info) => {
                // if user exists
                if (user) {
                    // send to home page
                    res.redirect("/home")

                    // otherwise
                } else {
                    // log user out
                    req.logOut(err => { })
                    // show login page
                    res.render("login", { err: true })
                }
            })(req, res, () => { })

        }
    })

})

// define journals route
app.get("/journals", (req, res) => {
    // if logged in
    if (req.isAuthenticated()) {
        // find user info
        User.findById(req.user._id, (err, user) => {
            // if no error
            if (!err) {
                // display journals page
                res.render("journals", {
                    journalTitle: getJournalTitle(), lastJournalTitle: "",
                    journalEntered: false, journalID: "",
                    journals: user.journals, showEmailBtn: false
                })
            }
        })

        // if user is not logged in
    } else {
        // send to signup page
        res.redirect("/signup")
    }
})

// when user enters journal
app.post("/journals", (req, res) => {

    // create date object
    const d = new Date()

    // create date string
    const date = (d.getMonth() + 1) + "/" + d.getDate()

    // create new journal entry using entered info
    const newJournal = new Journal({
        title: req.body.journalTitle,
        content: req.body.journal,
        date: date
    })

    // find user
    User.findById(req.user._id, (err, user) => {
        // if error
        if (err) {
            // refresh page
            res.redirect("/journals")

            // if no error
        } else {
            // append new journal to journal array
            user.journals.push(newJournal)
            // save user
            user.save()
            // reload page
            res.render("journals", {
                journalTitle: getJournalTitle(), lastJournalTitle: req.body.journalTitle,
                journalEntered: true, journalID: newJournal._id,
                journals: user.journals, showEmailBtn: true
            })
        }
    })

})

// define goals route
app.get("/goals", (req, res) => {

    // if logged in
    if (req.isAuthenticated()) {

        // find user
        User.findById(req.user._id, (err, user) => {

            // if no error
            if (!err) {

                // load page
                res.render("goals", { goals: user.goals, goalEntered: false, goal: false, goalCompleted: false })
            }

        })

        // if not logged in
    } else {

        // send to signup page
        res.redirect("/signup")

    }

})

// when user creates new goal
app.post("/goals", (req, res) => {

    // retrieve goal title
    const newGoal = req.body.goalTitle

    // find user
    User.findById(req.user._id, (err, user) => {

        // if no error
        if (!err) {

            // append new goal to user's goals
            user.goals.push(newGoal)

            // save user
            user.save()

            // reload page
            res.render("goals", { goals: user.goals, goalEntered: true, goal: newGoal, goalCompleted: false })

        }

    })

})

// when user completes goal
app.post("/complete", (req, res) => {

    // find user
    User.findById(req.user._id, (err, user) => {

        // if no error
        if (!err) {

            // remove goal from user's goals
            user.goals.splice(req.body.goalNum, 1)

            // save user
            user.save()

            // reload page
            res.render("goals", { goals: user.goals, goalEntered: false, goal: false, goalCompleted: true })

        }

    })

})

// define home route
app.get("/home", (req, res) => {

    // if logged in
    if (req.isAuthenticated()) {

        // find user
        User.findById(req.user._id, (err, user) => {

            // if no error
            if (!err) {
                // display home page with username
                res.render("home", { username: user.username })
            }

        })

        // otherwise
    } else {
        // send to signup page
        res.redirect("/signup")
    }

})

// define logout process
app.get("/logout", (req, res) => {

    // log out user
    req.logout(err => { })

    // send to start page
    res.redirect("/")

})

// define mindfulness route
app.get("/mindfulness", (req, res) => {

    // if logged in
    if (req.isAuthenticated()) {

        // render mindfulness page
        res.render("mindfulness", { firstQuote: getQuotes()[0], quotes: getQuotes().slice(1) })

        // otherwise
    } else {

        // send to signup page
        res.redirect("/signup")

    }

})

// define about route
app.get("/about", (req, res) => {

    // display about page
    res.render("about")

})

// define contact route
app.get("/contact", (req, res) => {

    // display contact page
    res.render("contact")

})

// define solution route
app.get("/solution", (req, res) => {

    // display solution page
    res.render("solution")

})

displayResourcePage("info")
displayResourcePage("drug-abuse")
displayResourcePage("commonly-abused")
displayResourcePage("causes")
displayResourcePage("symptoms")
displayResourcePage("effects")
displayResourcePage("withdrawal")
displayResourcePage("history")
displayResourcePage("overdose")
displayResourcePage("treatment")
displayResourcePage("prevention")
displayResourcePage("resources")
displayResourcePage("stats")
displayResourcePage("co-occurring")
displayResourcePage("current-work")
displayResourcePage("get-help")

// define miscellaneous route
app.get("/:page", (req, res) => {

    // send to start page
    res.redirect("/")

})

// retrieve heroku port number
let port = process.env.PORT

// if port does not exist
if (port == null || port == "") {

    // use standard port
    port = 3000

}

// put server online
app.listen(port, () => { })