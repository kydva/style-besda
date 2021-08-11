import express from 'express'

const app = express()


app.set('port', process.env.PORT || 3000)

app.use(((req, res, next) => {
    res.send("Good")
}))

export default app