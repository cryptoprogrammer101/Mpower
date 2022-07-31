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

mongoose.connect("mongodb://localhost:27017/websiteDB")

const promptSchema = new mongoose.Schema({
    title: String,
    content: String
})

const Prompt = mongoose.model("Prompt", promptSchema)

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: String,
    prompts: [promptSchema]
})

userSchema.plugin(uniqueValidator)
userSchema.plugin(passportLocalMongoose)

const User = mongoose.model("User", userSchema)

passport.use(User.createStrategy())

passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

const promptTitles = ["What is something you like?",
    "Describe one significant childhood memory.",
    "Who are the most important people in your life?"]

function getPromptTitle() {
    const promptTitle = promptTitles[Math.floor(Math.random() * promptTitles.length)]
    return promptTitle
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
                    res.render("login", { err: true })
                }
            })(req, res, () => { })

        }
    })

})

app.get("/help", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("help", { promptTitle: getPromptTitle(), promptEntered: false })
    } else {
        res.redirect("/signup")
    }
})

app.post("/help", (req, res) => {

    const newPrompt = new Prompt({
        title: req.body.promptTitle,
        content: req.body.prompt
    })

    User.findById(req.user._id, (err, user) => {
        if (err) {
            console.log(err)
            res.redirect("/help")
        } else {
            user.prompts.push(newPrompt)
            user.save()
            res.render("help", { promptTitle: getPromptTitle(), promptEntered: true, promptID: newPrompt._id })
        }
    })

})

app.get("/prompts", (req, res) => {
    if (req.isAuthenticated()) {
        User.findById(req.user._id, (err, user) => {
            if (err) {
                console.log(err)
            } else {
                const prompts = user.prompts
                res.render("prompts", { prompts: prompts })
            }
        })
    } else {
        res.redirect("/signup")
    }

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

app.get("/about", (req, res) => {
    res.render("about")
})

app.get("/contact", (req, res) => {
    res.render("contact")
})

app.listen(3000, () => {
    console.log("Server started successfully")
})
