const { createClient } = require('redis');
const { getBusRoutes, getBuses, getBusStops } = require('./requests');

const storingBuses = async () => {
    const client = createClient();
    client.on('error', (err) => console.error('Redis Client Error', err));

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
    
    await client.connect();
    for (let i in buses) {
        let bus = buses[i];
        for (let n in Object.keys(bus)) {
            let key = Object.keys(bus)[n]

            await client.hSet(`Bus:${bus.ServiceNo}`, key, JSON.stringify(bus[key]))
        }
    }
    await client.quit();
}

const storingBusStops = async () => {
    const client = createClient();
    client.on('error', (err) => console.error('Redis Client Error', err));

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

    await client.connect();
    for (let i in bus_stops) {
        let bus_stop = bus_stops[i]

        for (let n in Object.keys(bus_stop)) {
            let key = Object.keys(bus_stop)[n];
            await client.hSet(`BusStopCode:${bus_stop.BusStopCode}`, key, JSON.stringify(bus_stop[key]))
        }
    }
    await client.quit();
}

const cache = async () => {
    await storingBuses();
    await storingBusStops();

    return "done"
}

module.exports = {
    cache,
    storingBusStops,
    storingBuses,
}