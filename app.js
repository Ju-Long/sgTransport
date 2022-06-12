// MARK: API ROUTES
const { getBusStopArrival, getBusArrival, getBusRoutes, getBuses, getBusStops } = require('./scripts/requests');
const { cache } = require('./scripts/caching');
const { retrieveBusStops } = require('./scripts/retrieving');
const { sendErrorReport } = require('./scripts/error');
const fastify = require('fastify')({
    logger: true
})

fastify.get('/cache', async (request, reply) => {
    return await cache()
})

fastify.get('/', async (request, reply) => {
    return
})

// MARK: GET BUS TIMING AT ALL BUS STOP
fastify.get('/timing/:ServiceNo', async (request, reply) => {
    const ServiceNo = request.params.ServiceNo
    if (!ServiceNo) {
        return {response: 'error', error: 'invalid Service No input', parameters: {ServiceNo: ServiceNo}}
    }

    
})

// MARK: GET BUS STOP BUS TIMING TIMING
fastify.get('/timing/:BusStopCode', async (request, reply) => {
    const BusStopCode = request.params.BusStopCode
    if (!BusStopCode) {
        return {response: 'error', error: 'invalid Bus Stop Code input', parameters: {BusStopCode: BusStopCode}}
    }

    let timings = await getBusStopArrival(BusStopCode);
    return timings;
})

// MARK: GET NEAREST BUS STOPS
fastify.get('/nearest/:limit', async (request, reply) => {
    const lat = request.query.lat
    const long = request.query.long
    const limit = request.params.limit
    if (!lat || !long) {
        return {response: 'error', error: 'invalid coordinates input', parameters: {lat: lat, long: long}}
    }

    if (isNaN(limit)) {
        return {response: 'error', error: 'invalid limit input', parameters: {limit: limit}}
    }

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

    if (limit < 1) {
        return sorted_bus_stops
    } else {
        return sorted_bus_stops.splice(0, Number(limit))
    }
})

// MARK: VIEW DATA RETURN
fastify.get('/view/buses', async (request, reply) => {
    const buses = await getBuses()
    const bus_routes = await getBusRoutes()
    for (let i in bus_routes) {
        let bus_route = bus_routes[i];
        let index = buses.findIndex((bus) => {return (bus.ServiceNo === bus_route.ServiceNo && bus.Direction === bus_route.Direction)})
        if (index < 0) { continue; }

        let value = {
            StopSequence: bus_route.StopSequence,
            BusStopCode: bus_route.BusStopCode,
            Distance: bus_route.Distance,
            WD_FirstBus: bus_route.WD_FirstBus,
            WD_LastBus: bus_route.WD_LastBus,
            SAT_FirstBus: bus_route.SAT_FirstBus,
            SAT_LastBus: bus_route.SAT_LastBus,
            SUN_FirstBus: bus_route.SUN_FirstBus,
            SUN_LastBus: bus_route.SUN_LastBus,
        }
        if (buses[index].Route == undefined || 
            buses[index].Route == null) {
                buses[index].Route = [value]
        } else {
            buses[index].Route.push(value)
        }
    }

    return buses
})

fastify.get('/view/bus_stops', async (request, reply) => {
    const buses = await getBuses()
    const bus_stops = await getBusStops()
    const bus_routes = await getBusRoutes()

    for (let i in bus_routes) {
        let bus_route = bus_routes[i];
        let index = bus_stops.findIndex((bus_stop) => {return bus_stop.BusStopCode === bus_route.BusStopCode})
        if (index < 0) { continue; }
        
        let bus_index = buses.findIndex((bus) => {return (bus.ServiceNo === bus_route.ServiceNo && bus.Direction === bus_route.Direction)})

        if (bus_stops[index].Buses == undefined || 
            bus_stops[index].Buses == null) {
                bus_stops[index].Buses = [buses[bus_index]]
        } else {
            bus_stops[index].Buses.push(buses[bus_index])
        }
    }

    return bus_stops
})

const start = async () => {
    await fastify.listen(3002, '0.0.0.0')
    .then((address) => console.log(`server is listening on ${address}`))
    .catch(err => {
        console.log('error starting server: ', err);
        process.exit(1);
    });
}
start()

// MARK: CRON JOBS
const cron = require('node-cron')

// fetch Everyday
cron.schedule('0 0 * * *', async () => {
    await cache()
    await sendErrorReport()
})