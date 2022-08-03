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

// mongoose.connect("mongodb://localhost:27017/websiteDB")
mongoose.connect("mongodb+srv://admin-narayan:test123@website.d1i0s.mongodb.net/websiteDB")


const promptSchema = new mongoose.Schema({
    title: String,
    content: String
})

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: String,
    prompts: [promptSchema],
    todo: [String]
})

userSchema.plugin(uniqueValidator)
userSchema.plugin(passportLocalMongoose)

const User = mongoose.model("User", userSchema)
const Prompt = mongoose.model("Prompt", promptSchema)

passport.use(User.createStrategy())

passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

const promptTitles = ["What is something you like?",
    "Describe one significant childhood memory.",
    "Who are the most important people in your life?"]

const quotes = ["When you have a dream, you've got to grab it and never let go.",
    "Be the change that you wish to see in the world.",
    "Darkness cannot drive out darkness: only light can do that."]

const todo1 = "Talk to a friend"
const todo2 = "Call a help center"
const todo3 = "Book an appointment"

const todoStart = [todo1, todo2, todo3]

function getPromptTitle() {
    const promptTitle = promptTitles[Math.floor(Math.random() * promptTitles.length)]
    return promptTitle
}

function renderRoute(req, res, route) {
    if (req.isAuthenticated()) {
        res.render(route)
    } else {
        res.redirect("/signup")
    }
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

app.get("/prompts", (req, res) => {
    if (req.isAuthenticated()) {
        User.findById(req.user._id, (err, user) => {
            if (err) {
                console.log(err)
            } else {
                res.render("prompts", { promptTitle: getPromptTitle(), promptEntered: false, promptID: "", prompts: user.prompts })
            }
        })
    } else {
        res.redirect("/signup")
    }
})

app.post("/prompts", (req, res) => {

    const newPrompt = new Prompt({
        title: req.body.promptTitle,
        content: req.body.prompt
    })

    User.findById(req.user._id, (err, user) => {
        if (err) {
            console.log(err)
            res.redirect("/prompts")
        } else {
            user.prompts.push(newPrompt)
            user.save()
            res.render("prompts", { promptTitle: getPromptTitle(), promptEntered: true, promptID: newPrompt._id, prompts: user.prompts })
        }
    })

})

app.get("/todo", (req, res) => {
    if (req.isAuthenticated()) {
        User.findById(req.user._id, (err, user) => {
            if (err) {
                console.log(err)
            } else {
                if (user.todo.length < 3) {
                    user.todo.push(...todoStart)
                    user.save()
                }
                res.render("todo", { todoList: user.todo })
            }
        })
    } else {
        res.redirect("/signup")
    }
})

app.post("/todo", (req, res) => {

    const newTodo = req.body.todoTitle

    User.findById(req.user._id, (err, user) => {
        if (err) {
            console.log(err)
        } else {
            user.todo.push(newTodo)
            user.save()
            res.render("todo", { todoList: user.todo })
        }
    })
})

app.get("/home", (req, res) => {
    renderRoute(req, res, "home")
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
    renderRoute(req, res, "resources")
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

let port = process.env.PORT;

if (port == null || port == "") {
    port = 3000;
}

// app.listen(3000, () => {
app.listen(port, () => {
    console.log("Server started successfully")
})
