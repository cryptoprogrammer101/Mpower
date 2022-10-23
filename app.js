// import modules
const express = require("express")
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const uniqueValidator = require("mongoose-unique-validator")
const session = require("express-session")
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")

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
    tasks: [String]
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

// define journal titles
const journalTitles = ["What is something you like?",
    "Describe one significant childhood memory.",
    "Who are the most important people in your life?",
    "Write about anything."]

// define quotes
const quotes = ["When you have a dream, you've got to grab it and never let go.",
    "Be the change that you wish to see in the world.",
    "Darkness cannot drive out darkness: only light can do that."]

// define initial tasks
const tasksStart = ["Talk to a friend",
    "Call a help center",
    "Book an appointment",
    "Go for a walk",
    "Draw a picture of someone"]

// retrieve random journal title
function getJournalTitle() {
    const journalTitle = journalTitles[Math.floor(Math.random() * journalTitles.length)]
    return journalTitle
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
                    journalTitle: getJournalTitle(),
                    journalEntered: false, journalID: "", journals: user.journals, showEmailBtn: false
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
                journalTitle: getJournalTitle(),
                journalEntered: true, journalID: newJournal._id, journals: user.journals, showEmailBtn: true
            })
        }
    })

})

// define tasks route
app.get("/tasks", (req, res) => {
    // if logged in
    if (req.isAuthenticated()) {
        // find user
        User.findById(req.user._id, (err, user) => {
            // if no error
            if (!err) {
                // if user has no tasks
                if (user.tasks.length < tasksStart.length) {
                    // add initial tasks to user's tasks
                    user.tasks.push(...tasksStart)
                    // save user
                    user.save()
                }
                // relaod page
                res.render("tasks", { tasksList: user.tasks })
            }
        })
        // if not logged in
    } else {
        // send to signup page
        res.redirect("/signup")
    }
})

// when user creates new task
app.post("/tasks", (req, res) => {

    // retrieve task title
    const newTask = req.body.taskTitle

    // find user
    User.findById(req.user._id, (err, user) => {
        // if no error
        if (!err) {
            // append new task to user's tasks
            user.tasks.push(newTask)
            // save user
            user.save()
            // reload page
            res.render("tasks", { tasksList: user.tasks })
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

// define motivation route
app.get("/motivation", (req, res) => {
    // if logged in
    if (req.isAuthenticated()) {
        // display motivation page
        res.render("motivation", { firstQuote: quotes[0], quotes: quotes.slice(1) })

        // otherwise
    } else {
        // send to signup page
        res.redirect("/signup")
    }
})

// define logged-in resources route
app.get("/resources-2", (req, res) => {
    // if logged in
    if (req.isAuthenticated()) {
        // display page
        res.render("resources-2")

        // otherwise
    } else {
        // send to signup page
        res.redirect("/resources-1")
    }
})

// define logged-our resources route
app.get("/resources-1", (req, res) => {
    // if logged in
    if (req.isAuthenticated()) {
        // send to resources page
        res.redirect("/resources-2")
        // otherwise
    } else {
        // display resources page
        res.render("resources-1")
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