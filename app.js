const express = require('express')
const parkingRouter = require('./src/routes/parking')

const app = express()

// use parse json in express
app.use(express.json())
app.use(parkingRouter)

module.exports = app