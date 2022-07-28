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

app.get("/:page", (req, res) => {
    const page = req.params.page

    if (page === "help") {

        res.render(page, { promptTitle: getPromptTitle(), promptEntered: false })

    } else if (page === "prompts") {

        const prompts = Prompt.find((err, savedPrompts) => {
            res.render(page, { prompts: savedPrompts })
        })

    } else {
        res.render(page, (err, html) => {
            if (err) {
                res.redirect("/")
            } else {
                res.send(html)
            }
        })

    }

})

app.post("/help", (req, res) => {

    const promptTitle = req.body.promptTitle
    const promptText = req.body.prompt

    const newPrompt = new Prompt({
        title: promptTitle,
        content: promptText
    })

    newPrompt.save()

    res.render("help", { promptTitle: getPromptTitle(), promptEntered: true, promptID: newPrompt._id })

})

app.listen(3000, () => {
    console.log("Server started successfully")
})
