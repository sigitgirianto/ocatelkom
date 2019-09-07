const express = require('express')
const router = new express.Router()
const today = require('../utils/today')
const { loadParkingLots, updateParkingLot } = require('../worker/parkingWorker')
const { addParkingLog, loadParkingLogs, updateParkingLog } = require('../worker/logWorker')

const priceList = {
    "SUV": {
            "firstHour": 25000,
            "nextHour": 20
        },
    "MPV": {
            "firstHour": 35000,
            "nextHour": 20       
        }
}

router.post('/incoming', async (req, res) => {
    try {
        const dataRequests = Object.keys(req.body)
        const allowedDataRequests = ['plat_nomor', 'warna', 'tipe']
        const parkingLots = loadParkingLots()
        const parkingLogs = loadParkingLogs()
        let availLot = {}

        // if any false return false // if any key try to update in not allowed key data parking
        const isValidRequest = dataRequests.every( datareq => allowedDataRequests.includes(datareq) && req.body[datareq] !== '')

        if (!isValidRequest) {
            return res.status(400).send({ error: 'Invalid data request' })
        }

        // find first not occupied lot
        for( var i = 0; i < parkingLots.length; i++){
            if ( !parkingLots[i].isOccupied ){
                availLot.plat_nomor = req.body.plat_nomor
                availLot.parking_lot = parkingLots[i].id_lot
                availLot.tanggal_masuk = today()
                break
            }
        }

        // if exist car and not out yet from parking lot
        const isCarParked = parkingLogs.filter(log => log.plat_nomor === req.body.plat_nomor && log.tanggal_keluar === null)

        if (isCarParked.length !== 0) {
            return res.status(404).send({ error: 'The car is still parking'})
        }

        // create a parking log
        if ( typeof availLot.parking_lot !== 'undefined' ) {
            const parkingLog = addParkingLog(availLot.parking_lot, availLot.plat_nomor, req.body.warna, req.body.tipe)
            // update parking lot to occupied
            updateParkingLot(parkingLog.id_log, availLot.parking_lot, true)

            res.status(201).send(availLot)
        } else {
            res.status(404).send({ error: 'The parking lot is full'})
        }
    } catch (e) {
        res.status(400).send(e)
    }
})

router.get('/outgoing', async (req, res) => {
    try {
        const parkingLots = loadParkingLots()
        const parkingLogs = loadParkingLogs()

        // if exist car and not out yet from parking lot
        const isCarParked = parkingLogs.filter(log => log.plat_nomor === req.body.plat_nomor && log.tanggal_keluar === null)

        if (isCarParked.length !== 0) {
            const tanggal_masuk = new Date(isCarParked[0].tanggal_masuk)
            const tanggal_keluar = new Date()
            const out_dt = await today()
            const diffInSeconds = Math.abs(tanggal_keluar - tanggal_masuk)
            const diffInHours = Math.ceil(diffInSeconds / (1000 * 60 * 60))

            // get price list

            // calculate fee
            const firstHour = priceList[isCarParked[0].tipe].firstHour
            const nextHourX = priceList[isCarParked[0].tipe].nextHour

            let jumlah_bayar = firstHour + ( diffInHours - 1 ) * ( nextHourX * firstHour / 100)
            
            // update parking log jumlah bayar and tanggal keluar
            updateParkingLog(isCarParked[0].id_log, out_dt, jumlah_bayar)

            // update parking lot set occupied to false
            updateParkingLot(isCarParked[0].id_log, isCarParked[0].id_lot, false)

            res.send({
                plat_nomor: isCarParked[0].plat_nomor,
                tanggal_masuk: isCarParked[0].tanggal_masuk,
                tanggal_keluar: out_dt,
                jumlah_bayar: jumlah_bayar
            })
        }else{
            res.status(404).send({ error: "The car not found" })
        }     
    } catch (e) {
        res.status(400).send(e)
    }
})

router.get('/reportbytype', async(req, res) => {
    try {
        const parkingLots = loadParkingLots()
        const parkingLogs = loadParkingLogs()
        let jumlah_kendaraan = 0

        // get id log from all occupied parking lot
        const occupiedLots = parkingLots.filter(lot => lot.isOccupied === true)

        if (occupiedLots.length !== 0) {
            for (var i = 0; i < occupiedLots.length; i++) {
                const matchLog = parkingLogs.filter(log => log.id_log === occupiedLots[i].id_log && log.tipe === req.body.tipe)
                if ( matchLog.length !== 0 ) {
                    jumlah_kendaraan += 1
                }
            }
        }

        res.send({ jumlah_kendaraan: jumlah_kendaraan })

    } catch (e) {
        res.status(400).send(e)
    }
})

router.get('/reportbycolor', async(req, res) => {
    try {
        const parkingLots = loadParkingLots()
        const parkingLogs = loadParkingLogs()
        let plat_nomor = []

        // get id log from all occupied parking lot
        const occupiedLots = parkingLots.filter(lot => lot.isOccupied === true)

        if (occupiedLots.length !== 0) {
            for (var i = 0; i < occupiedLots.length; i++) {
                const matchLog = parkingLogs.filter(log => log.id_log === occupiedLots[i].id_log && log.warna === req.body.warna)
                if ( matchLog.length !== 0 ) {
                    plat_nomor.push(matchLog[0].plat_nomor)
                }
            }
        }

        res.send({ plat_nomor: plat_nomor })

    } catch (e) {
        res.status(400).send(e)
    }
})

module.exports = router