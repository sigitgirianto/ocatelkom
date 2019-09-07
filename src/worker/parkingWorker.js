const fs = require('fs')

const loadParkingLots = () => {
    try {
        const dataBuffer = fs.readFileSync('./src/db/parking-lot.json')
        const dataJSON = dataBuffer.toString()
        return JSON.parse(dataJSON)
    } catch (e) {
        return []
    }
}

const saveParkingLots = (lots) => {
    const dataJSON = JSON.stringify(lots)
    fs.writeFileSync('./src/db/parking-lot.json', dataJSON)
}

const updateParkingLot = (id_log, id_lot, isOccupied) => {
    const lots = loadParkingLots()
    let isUpdate = false

    // modified a lot
    for (var i in lots) {
        if (lots[i].id_lot == id_lot){
            if (isOccupied) {
                lots[i].id_log = id_log
            } else {
                lots[i].id_log = null
            }
            lots[i].isOccupied = isOccupied
            isUpdate = true // set true if need an update data parking lot
            break
        }
    }

    // save to database if any update
    if(isUpdate){saveParkingLots(lots)}
}

module.exports = {
    loadParkingLots: loadParkingLots,
    updateParkingLot: updateParkingLot
}