const express = require("express")
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const uniqueValidator = require("mongoose-unique-validator")
const session = require("express-session")
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")

const app = express()

app.set("view engine", "ejs")

app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static("public"))

app.use(session({
    secret: "My little secret.",
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize())
app.use(passport.session())

mongoose.connect("mongodb+srv://admin-narayan:test123@website.d1i0s.mongodb.net/websiteDB")

const journalSchema = new mongoose.Schema({
    title: String,
    content: String
})

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: String,
    journals: [journalSchema],
    tasks: [String]
})

userSchema.plugin(uniqueValidator)
userSchema.plugin(passportLocalMongoose)

const User = mongoose.model("User", userSchema)
const Journal = mongoose.model("Journal", journalSchema)

passport.use(User.createStrategy())

passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

const journalTitles = ["What is something you like?",
    "Describe one significant childhood memory.",
    "Who are the most important people in your life?"]

const quotes = ["When you have a dream, you've got to grab it and never let go.",
    "Be the change that you wish to see in the world.",
    "Darkness cannot drive out darkness: only light can do that."]

const tasksStart = ["Talk to a friend", "Call a help center", "Book an appointment"]

function getJournalTitle() {
    const journalTitle = journalTitles[Math.floor(Math.random() * journalTitles.length)]
    return journalTitle
}

app.get("/", (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect("/home")
    } else {
        res.render("index")
    }
})

app.get("/signup", (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect("/home")
    } else {
        res.render("signup", { err: "" })
    }
})

app.post("/signup", (req, res) => {

    User.register({ username: req.body.username }, req.body.password, (err, user) => {
        if (err) {
            res.render("signup", { err: req.body.username })
        } else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/home")
            })
        }
    })

})

app.get("/login", (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect("/home")
    } else {
        res.render("login", { err: "" })
    }
})

app.post("/login", (req, res) => {

    const user = new User({
        username: req.body.username,
        password: req.body.password
    })

    req.login(user, (err) => {
        if (err) {
            res.render("login", { err: err })
        } else {
            passport.authenticate("local", (err, user, info) => {
                if (user) {
                    res.redirect("/home")
                } else {
                    req.logOut(err => {
                        if (err) {
                            console.log(err)
                        }
                    })
                    res.render("login", { err: true })
                }
            })(req, res, () => { })

        }
    })

})

app.get("/journals", (req, res) => {
    if (req.isAuthenticated()) {
        User.findById(req.user._id, (err, user) => {
            if (err) {
                console.log(err)
            } else {
                res.render("journals", { journalTitle: getJournalTitle(), journalEntered: false, journalID: "", journals: user.journals })
            }
        })
    } else {
        res.redirect("/signup")
    }
})

app.post("/journals", (req, res) => {

    const newJournal = new Journal({
        title: req.body.journalTitle,
        content: req.body.journal
    })

    User.findById(req.user._id, (err, user) => {
        if (err) {
            console.log(err)
            res.redirect("/journals")
        } else {
            user.journals.push(newJournal)
            user.save()
            res.render("journals", { journalTitle: getJournalTitle(), journalEntered: true, journalID: newJournal._id, journals: user.journals })
        }
    })

})

app.get("/tasks", (req, res) => {
    if (req.isAuthenticated()) {
        User.findById(req.user._id, (err, user) => {
            if (err) {
                console.log(err)
            } else {
                if (user.tasks.length < 3) {
                    user.tasks.push(...tasksStart)
                    user.save()
                }
                res.render("tasks", { tasksList: user.tasks })
            }
        })
    } else {
        res.redirect("/signup")
    }
})

app.post("/tasks", (req, res) => {

    const newTodo = req.body.taskTitle

    User.findById(req.user._id, (err, user) => {
        if (err) {
            console.log(err)
        } else {
            user.tasks.push(newTodo)
            user.save()
            res.render("tasks", { tasksList: user.tasks })
        }
    })
})

app.get("/home", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("home")
    } else {
        res.redirect("/signup")
    }

})

app.get("/logout", (req, res) => {
    req.logout((err) => {
        if (err) {
            console.log(err)
        }
    })
    res.redirect("/")
})

app.get("/resources", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("resources")
    } else {
        res.redirect("/signup")
    }
})

app.get("/quotes", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("quotes", { firstQuote: quotes[0], quotes: quotes.slice(1) })
    } else {
        res.redirect("/signup")
    }
})

app.get("/about", (req, res) => {
    res.render("about")
})

app.get("/contact", (req, res) => {
    res.render("contact")
})

app.get("/solution", (req, res) => {
    res.render("solution")
})

app.get("/testimonials", (req, res) => {
    res.render("testimonials")
})

app.get("/:page", (req, res) => {
    res.redirect("/")
})

let port = process.env.PORT;

if (port == null || port == "") {
    port = 3000;
}

app.listen(port, () => {
    console.log("Server started successfully")
})
