const {
    getMRTTiming,
    getMRTList,
    getMRTCrowdDensity
} = require('./scripts/requests')
const { retrieveMRTList } = require('./scripts/retrieving')
const { cache, storingMRTList } = require('./scripts/caching')

module.exports = async (fastify, opts) => {
    fastify.get('/train/timing/:StationName', async (request, reply) => {
        const StationName = request.params.StationName;
        if (!StationName) {
            return {
                response: 'error',
                error: 'invalid Station Name inputted',
                parameters: {
                    StationName: StationName
                }
            }
        }

        const stations = await retrieveMRTList();
        if (!stations) {
            await cache();
            stations = await retrieveMRTList();
        }

        if (!stations) {
            return { response: 'error', message: 'stations does not exist', parameters: {}, line: new Error().stack }
        }

        let index = stations.findIndex((station) => {
            return station.StationName === StationName
        })

        if (index < 0) {
            return {
                response: 'error',
                error: 'Station Name not found in the available stations',
                parameters: {
                    StationName: StationName
                }
            }
        }

        return await getMRTTiming(StationName);
    });

    fastify.get('/train/stations', async (request, reply) => {
        var stations = await retrieveMRTList();
        if (!stations) {
            await cache();
            stations = await retrieveMRTList();
        }

        if (!stations) {
            return { response: 'error', message: 'stations does not exist', parameters: {}, line: new Error().stack }
        }
        return stations
    })

    fastify.get('/train/line/:line', async (request, reply) => {
        const line = request.params.line;
        if (!line) {
            return {
                response: 'error',
                error: 'invalid line name inputted',
                parameters: {
                    line: line
                }
            }
        }

        const data = await getMRTCrowdDensity(line)
        return data.value;
    })

    fastify.get('/train/cache', async (request, reply) => {
        await cache()
    })
}