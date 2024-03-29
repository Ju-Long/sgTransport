const { createClient } = require('redis');
const moment = require('moment');
const mrt_locations = require('../../assets/mrt.json')
const { getMRTList } = require('./requests');

const storingMRTList = async () => {
    var MRT_xml_list = await getMRTList();
    MRT_xml_list = MRT_xml_list.replace('<mrtStationList>', "").trim()
    MRT_xml_list = MRT_xml_list.replace('</mrtStationList>', "").trim()
    do {
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
    for (i in MRT_xml_list) {
        let station = MRT_xml_list[i].StationName.toLowerCase()
        for (n in mrt_locations) {
            if (station.includes(mrt_locations[n].Name.toLowerCase())) {
                MRT_xml_list[i].Latitude = mrt_locations[n].Latitude
                MRT_xml_list[i].Longitude = mrt_locations[n].Longitude
            }
        }
    }

    const client = createClient();
    client.on('error', (err) => console.error('Redis Client Error', err));

    await client.connect()
    for (let i in MRT_xml_list) {
        const mrt = MRT_xml_list[i];
        for(let n in Object.keys(mrt)) {
            let key = Object.keys(mrt)[n]
            await client.hSet(`StationName: ${mrt.StationName}`, key, JSON.stringify(mrt[key]))
        }
    }
    await client.quit()
}

const cache = async() => {
    await storingMRTList()
}

module.exports = {
    cache,
    storingMRTList
}