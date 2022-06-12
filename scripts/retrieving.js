const { createClient } = require('redis');
const { cache } = require('./caching');

const retrieveBusStops = async () => {
    const client = createClient();
    client.on('error', (err) => console.error('Redis Client Error', err));

    await client.connect();
    let bus_stop_code_keys = await client.keys('BusStopCode:*')
    if (bus_stop_code_keys.length === 0) {
        await cache();
        return await retrieveBusStops()
    }

    let bus_stops = [];

    for (let i in bus_stop_code_keys) {
        let bus_stop_code_key = bus_stop_code_keys[i]
        let bus_stop = await client.hGetAll(bus_stop_code_key)
        Object.keys(bus_stop).forEach(key => {
            bus_stop[key] = JSON.parse(bus_stop[key])
        })
        bus_stops.push(bus_stop);
    }

    return bus_stops
}

const retrieveBuses = async () => {
    const client = createClient();
    client.on('error', (err) => console.error('Redis Client Error', err));

    await client.connect();
    let bus_code_keys = await client.keys('Bus:*')
    if (bus_code_keys.length === 0) {
        await cache();
        return await retrieveBuses()
    }

    let buses = [];

    for (let i in bus_code_keys) {
        let bus_code_key = bus_code_keys[i]
        let bus = await client.hGetAll(bus_code_key)
        Object.keys(bus).forEach(key => {
            bus[key] = JSON.parse(bus[key])
        })
        buses.push(bus);
    }

    return buses
}

module.exports = {
    retrieveBusStops,
}