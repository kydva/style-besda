import {Router} from 'express'
import passport from "passport"
import {User} from '../models/User'

import '../auth'

const router = Router()

router.post('/login', passport.authenticate('local'), (req, res) => {
    res.send(req.user);
})


router.get('/me', (req, res) => {
    res.send(req.user || {});
})

router.get('/logout', (req, res) => {
    req.logout()
    res.end()
})

router.post('/registration', (async (req, res, next) => {
    if (req.body.password !== req.body.password_confirm) {
        res.status(400).send({
            error: {
                message: "Password not confirmed",
                field: 'password_confirm'
            }
        })
    }

    try {
        const user = new User({
            name: req.body.name,
            password: req.body.password
        })
        await user.save()
        req.login(user, (err) => {
            if (err) throw err
        })
        res.status(201).send()
    } catch (e) {
        if (e.name === 'ValidationError') {
            const errors: { [field: string]: { message: string } } = {}
            for (let field in e.errors) {
                errors[field] = e.errors[field].message
            }
            res.status(400).send({errors})
        } else next(e)
    }
}))

export default router