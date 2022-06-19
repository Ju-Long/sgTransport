const {
    getMRTTiming,
    getMRTList
} = require('./scripts/requests')

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
        MRT_xml_list = MRT_xml_list.replace('<?xml version="1.0" encoding="UTF-8"?>', "").trim()
        MRT_xml_list = MRT_xml_list.replace('<mrtTripFareCalc>', "").trim()
        MRT_xml_list = MRT_xml_list.replace('</mrtTripFareCalc>', "").trim()
        do {
            MRT_xml_list = MRT_xml_list.replace('<mrtStop value="', '{"RequestCode": "')
            MRT_xml_list = MRT_xml_list.replace('">', '", "StationName": "')
            MRT_xml_list = MRT_xml_list.replace(' (', '", "StationCode": "')
            MRT_xml_list = MRT_xml_list.replace(')</mrtStop>', '"},')
        } while (MRT_xml_list.includes('mrtStop'))
        MRT_xml_list = `[${MRT_xml_list}]`
        MRT_xml_list = MRT_xml_list.replace(',]', ']');

        MRT_xml_list = JSON.parse(MRT_xml_list)
        return MRT_xml_list
    })
}