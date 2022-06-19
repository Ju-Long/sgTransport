const { createClient } = require('redis');
const moment = require('moment');
const { cache } = require('./caching');
const fs = require('fs');

const retrieveNearestLocation = async (lat, long) => {
    const client = createClient();
    client.on('error', (err) => console.error('Redis Client Error', err));
    client.connect()
    let nearest_keys = await client.keys(`Lat:${lat},Long:${long}`);
    if (nearest_keys.length === 0) {
        await client.quit()
        return null;
    }   

    let nearest = await client.hGetAll(`Lat:${lat},Long:${long}`);
    Object.keys(nearest).forEach(key => {
        nearest[key] = JSON.parse(nearest[key])
    })
    let last_called = moment(nearest.last_called);
    let time_diff = moment().diff(last_called, 'days');
    await client.quit();

    if (time_diff > 1) {
        return null;
    }
    return nearest.data;
}

const retrieveBusTiming = async (ServiceNo) => {
    const client = createClient();
    client.on('error', (err) => console.error('Redis Client Error', err));

    await client.connect();
    let bus_timing_keys = await client.keys(`BusTiming:${ServiceNo}`)
    if (bus_timing_keys.length === 0) {
        await client.quit()
        return null;
    }

    let bus_timing = await client.hGetAll(`BusTiming:${ServiceNo}`)
    Object.keys(bus_timing).forEach(key => {
        bus_timing[key] = JSON.parse(bus_timing[key])
    })
    let last_called = moment(bus_timing.last_called)
    let time_diff = moment().diff(last_called, 'minutes'); 
    await client.quit()
    if (time_diff > 1) {
        return null;
    }

    return bus_timing;
}

const retrieveBusStopTiming = async (BusStopCode) => {
    const client = createClient();
    client.on('error', (err) => console.error('Redis Client Error', err));

    await client.connect();
    let bus_stop_timing_keys = await client.keys(`BusStopTiming:${BusStopCode}`)
    if (bus_stop_timing_keys.length === 0) {
        await client.quit()
        return null;
    }

    let bus_stop_timing = await client.hGetAll(`BusStopTiming:${BusStopCode}`)
    Object.keys(bus_stop_timing).forEach(key => {
        bus_stop_timing[key] = JSON.parse(bus_stop_timing[key])
    })
    let last_called = moment(bus_stop_timing.last_called)
    let time_diff = moment().diff(last_called, 'minutes'); 
    if (time_diff > 1) {
        await client.quit()
        return null;
    }
    await client.quit()

    return bus_stop_timing;
}

const retrieveBusStops = async () => {
    if (fs.existsSync('../dist/BusStops.json')) {
        return JSON.parse(fs.readFileSync('../dist/BusStops.json'))
    }

    const client = createClient();
    client.on('error', (err) => console.error('Redis Client Error', err));
    await client.connect();

    let bus_stop_code_keys = await client.keys('BusStopCode:*')
    if (bus_stop_code_keys.length === 0) {
        await cache();
        await client.quit()
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
    await client.quit()

    return bus_stops
}

const retrieveBuses = async () => {
    if (fs.existsSync('../dist/Buses.json')) {
        return JSON.parse(fs.readFileSync('../dist/Buses.json'))
    }

    const client = createClient();
    client.on('error', (err) => console.error('Redis Client Error', err));

    await client.connect();
    let bus_code_keys = await client.keys('Bus:*')
    if (bus_code_keys.length === 0) {
        await cache();
        await client.quit();
        return await retrieveBuses();
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
    await client.quit()

    return buses
}

const retrieveBus = async (ServiceNo, Direction) => {
    const client = createClient();
    client.on('error', (err) => console.error('Redis Client Error', err));

    await client.connect();
    let bus_code_keys = await client.keys(`Bus:*${ServiceNo}*,Direction:${Direction}`)
    if (bus_code_keys.length === 0) {
        await client.quit()
        return [];
    }

    let bus = await client.hGetAll(`Bus:${ServiceNo},Direction:${Direction}`)
    Object.keys(bus).forEach(key => {
        bus[key] = JSON.parse(bus[key])
    })

    await client.quit()
    return bus
}

const retrieveBusStop = async (BusStopCode) => {
    const client = createClient();
    client.on('error', (err) => console.error('Redis Client Error', err));

    await client.connect();
    let bus_stop_code_keys = await client.keys(`BusStopCode:*${BusStopCode}*`)
    if (bus_stop_code_keys.length === 0) {
        await client.quit()
        return [];
    }

    let bus_stop = await client.hGetAll(`BusStopCode:${BusStopCode}`)
    
    Object.keys(bus_stop).forEach(key => {
        bus_stop[key] = JSON.parse(bus_stop[key])
    })


    await client.quit()
    return bus_stop
}

module.exports = {
    retrieveBusTiming,
    retrieveBusStopTiming,
    retrieveBusStops,
    retrieveBuses,
    retrieveBus,
    retrieveBusStop,
    retrieveNearestLocation,
}