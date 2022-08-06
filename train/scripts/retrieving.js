const { createClient } = require('redis');
const { cache } = require('./caching');

const retrieveMRTList = async () => {
    const client = createClient();
    client.on('error', (err) => console.error('Redis Client Error', err));
    await client.connect();

    let station_keys = await client.keys('StationName:*')
    if (station_keys.length === 0) {
        return undefined;
    }

    let stations = [];

    for (let i in station_keys) {
        let station_key = station_keys[i]
        let station = await client.hGetAll(station_key)
        Object.keys(station).forEach(key => {
            station[key] = JSON.parse(station[key])
        })
        stations.push(station);
    }
    await client.quit()
    return stations;
}

module.exports = {
    retrieveMRTList
}