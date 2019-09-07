const fs = require('fs')
const today = require('../utils/today')

const loadParkingLogs = () => {
    try {
        const dataBuffer = fs.readFileSync('./src/db/parking-log.json')
        const dataJSON = dataBuffer.toString()
        return JSON.parse(dataJSON)
    } catch (e) {
        return []
    }
}

const saveParkingLogs = (logs) => {
    const dataJSON = JSON.stringify(logs)
    fs.writeFileSync('./src/db/parking-log.json', dataJSON)
}

const addParkingLog = (id_lot, license_plate, color, type) => {
    const logs = loadParkingLogs()
    
    // for first log, create id_log = 1, next increment by 1
    let newLog = {
        "id_log": logs.length+1,
        "id_lot": id_lot,
        "plat_nomor": license_plate,
        "warna": color,
        "tipe": type,
        "tanggal_masuk": today(),
        "tanggal_keluar": null,
        "jumlah_bayar": null
    }
    
    logs.push(newLog)

    saveParkingLogs(logs)
    return newLog
}

const updateParkingLog = (id_log, out_dt, fee) => {
    const logs = loadParkingLogs()
    let isUpdate = false

    // modified a log
    for (var i in logs) {
        if (logs[i].id_log == id_log){
            logs[i].tanggal_keluar = out_dt
            logs[i].jumlah_bayar = fee
            isUpdate = true // set true if need an update data parking lot
            break
        }
    }

    // save to database if any update
    if(isUpdate){saveParkingLogs(logs)}
}

module.exports = {
    addParkingLog: addParkingLog,
    loadParkingLogs: loadParkingLogs,
    updateParkingLog: updateParkingLog
}