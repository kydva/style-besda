import dotenv from 'dotenv'
import express from 'express'

dotenv.config()
const app = express()

app.use((req, res) => {
    res.send(`Listen port ${process.env.PORT}`)
})

export default app