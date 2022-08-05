const got = require('got');

const getMRTTiming = async (StationName) => {
    let data = await got.get(`https://connectv3.smrt.wwprojects.com/smrt/api/train_arrival_time_by_id/?station=${StationName}`, {
        headers: {
            Connection: 'Keep-Alive',
            'User-Agent': 'SMRT Connect/3.0 Android/7.0',
            'Accept-Encoding': 'gzip',
            'Content-Type': 'text/plain',
            Referer: 'https://connectv3.smrt.wwprojects.com/smrt/',
            Authorization: 'Hawk id="ww-connectv3-android", mac="UJu120qHBk8LOdJP2BXOIQr9jy8MrCOSpHxV3cEqmag=", hash="q/t+NNAkQZNlq/aAD6PlexImwQTxwgT2MahfTa9XRLA=", ts="1529993914", nonce="ADBC4BFE5F0B"'
        },
        responseType: 'json',
        timeout: 60000,
    });

    return data.body.results
}

const getMRTList = async () => {
    let data = await got.get(`https://www.lta.gov.sg/map/mrt/index.xml`, {
        responseType: 'text',
        timeout: 60000,
    });

    return data.body;
}

module.exports = {
    getMRTTiming,
    getMRTList,
}