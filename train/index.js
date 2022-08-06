const {
    getMRTTiming,
    getMRTList
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
        var MRT_list = await retrieveMRTList();
        if (!MRT_list) {
            await cache();
            MRT_list = await retrieveMRTList();
        }

        if (!MRT_list) {
            return { response: 'error', message: 'MRT list not exist', parameters: {}, line: new Error().stack }
        }
        return MRT_list
    })

    fastify.get('/train/cache', async (request, reply) => {
        await cache()
    })
}