const { retrieveBusStops, retrieveBuses, retrieveBus, retrieveBusStopTiming, retrieveBusTiming } = require('./scripts/retrieving');

new Promise(async (resolve, reject) => {
    console.time("TestingNearestLocationExecutionSpeed")
    console.log("Testing Nearest Location Execution Speed")
    const lat = 1
    const long = 103
    const sorted_bus_stops = []
    const bus_stops = await retrieveBusStops();

    for (let i in bus_stops) {
        let bus_stop = bus_stops[i];

        let radlat1 = Math.PI * Number(lat)/180
        let radlat2 = Math.PI * Number(bus_stop.Latitude)/180
        let theta = Number(long)-Number(bus_stop.Longitude)
        let radtheta = Math.PI * theta/180
        let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        dist = Math.acos(dist)
        dist = dist * 180/Math.PI
        dist = dist * 60 * 1.1515
        dist = dist * 1.609344 

        bus_stop.distance = dist
        sorted_bus_stops.push(bus_stop)
    }
    sorted_bus_stops.sort(function (a, b) {
        return a.distance - b.distance
    })
    console.log("Finish Testing Nearest Location Execution Speed")
    console.timeEnd("TestingNearestLocationExecutionSpeed")
    resolve();  
})