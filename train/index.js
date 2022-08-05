const {
    getMRTTiming,
    getMRTList
} = require('./scripts/requests')
const { } = require('./scripts/retrieving')
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

        // const stations = await 

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
        var MRT_xml_list = await getMRTList();
        MRT_xml_list = MRT_xml_list.replace('<mrtStationList>', "").trim()
        MRT_xml_list = MRT_xml_list.replace('</mrtStationList>', "").trim()
        do {
            console.log("replacing brackets...")
            MRT_xml_list = MRT_xml_list.replace('<station id="', '{"StationCode": "')
            MRT_xml_list = MRT_xml_list.replace('" name="', '", "StationName": "')
            MRT_xml_list = MRT_xml_list.replace(/<code>[\s\S]*?<\/code>/g, "")
            MRT_xml_list = MRT_xml_list.replace(/<coordinates>[\s\S]*?<\/coordinates>/g, '')
            MRT_xml_list = MRT_xml_list.replace(/<file>[\s\S]*?<\/file>/g, '')
            MRT_xml_list = MRT_xml_list.replace(/^\s*$(?:\r\n?|\n)/gm, '')
            MRT_xml_list = MRT_xml_list.replace('>\n<line>', ', "Line": "')
            MRT_xml_list = MRT_xml_list.replace('</line>\n</station>', '"},')
        } while (MRT_xml_list.includes('<station'))

        MRT_xml_list = `[${MRT_xml_list}]`
        MRT_xml_list = MRT_xml_list.replace(',]', ']');

        MRT_xml_list = JSON.parse(MRT_xml_list)
        return MRT_xml_list
    })

    fastify.get('/train/cache', async (request, reply) => {
        await cache()
    })
}