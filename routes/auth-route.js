import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'

const router = express.Router()

router.post('/register', async (req, res, next) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            const error = new Error('Email and password are required')
            error.status = 400
            throw error
        }

        const existingUser = await User.findOne({ email })
        if (existingUser) {
            const error = new Error('User already exists')
            error.status = 400
            throw error
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const newUser = new User({ email, password: hashedPassword })
        await newUser.save()

        res.status(201).json({ message: 'User registered successfully' })
    } catch (err) {
        next(err)
    }
})

router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            const error = new Error('Email and password are required')
            error.status = 400
            throw error
        }

        const user = await User.findOne({ email })
        if (!user) {
            const error = new Error('Invalid credentials')
            error.status = 401
            throw error
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            const error = new Error('Invalid credentials')
            error.status = 401
            throw error
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        })

        console.log(token)

        res.status(200).json({ token })
    } catch (err) {
        next(err)
    }
})

export default router
