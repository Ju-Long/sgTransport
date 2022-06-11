const { createClient } = require('redis');
const { cache } = require('./caching');

const retrieveBusStops = async () => {
    const client = createClient();
    client.on('error', (err) => console.error('Redis Client Error', err));

    await client.connect();
    let bus_stop_code_keys = await client.keys('BusStopCode:*')
    if (bus_stop_code_keys.length === 0) {
        await cache;
        return await retrieveBusStops()
    }

    let bus_stops = [];

    for (let i in bus_stop_code_keys) {
        let bus_stop_code_key = bus_stop_code_keys[i]
        let bus_stop = await client.hGetAll(bus_stop_code_key)
        bus_stops.push(bus_stop);
    }

    return bus_stops
}

module.exports = {
    retrieveBusStops: retrieveBusStops()
}