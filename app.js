const express = require("express")
const bodyParser = require("body-parser")
const mongoose = require("mongoose")

const app = express()

app.set('view engine', 'ejs')

app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static("public"))

mongoose.connect("mongodb://localhost:27017/websiteDB")

const promptSchema = new mongoose.Schema({
    title: String,
    content: String
})

const Prompt = mongoose.model("Prompt", promptSchema)

const promptTitles = ["What is something you like?",
    "Describe one significant childhood memory.",
    "Who are the most important people in your life?"]

function getPromptTitle() {
    const promptTitle = promptTitles[Math.floor(Math.random() * promptTitles.length)]
    return promptTitle
}

app.get("/", (req, res) => {
    res.render("index")
})

app.get("/about", (req, res) => {
    res.render("about")
})

app.get("/contact", (req, res) => {
    res.render("contact")
})

app.get("/help", (req, res) => {
    res.render("help", { promptTitle: getPromptTitle(), promptEntered: false })
})

app.get("/home", (req, res) => {
    res.render("home")
})

app.get("/login", (req, res) => {
    res.render("login")
})

app.get("/prompts", (req, res) => {
    const prompts = Prompt.find((err, savedPrompts) => {
        res.render("prompts", { prompts: savedPrompts })
    })
})

app.get("/resources", (req, res) => {
    res.render("resources")
})

app.get("/signup", (req, res) => {
    res.render("signup")
})

app.post("/help", (req, res) => {

    const newPrompt = new Prompt({
        title: req.body.promptTitle,
        content: req.body.prompt
    })

    newPrompt.save()

    res.render("help", { promptTitle: getPromptTitle(), promptEntered: true, promptID: newPrompt._id })

})

app.listen(3000, () => {
    console.log("Server started successfully")
})
