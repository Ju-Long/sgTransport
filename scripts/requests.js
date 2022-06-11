require('dotenv').config();
const got = require('got')

const getBusArrival = (BusStopCode, ServiceNo) => {

}

const getBusRoutes = async () => {
    const values = []
    let skip = 0;
    let data;
    do {
        data = await got.get(`http://datamall2.mytransport.sg/ltaodataservice/BusRoutes?$skip=${skip}`, {
            headers: {
                AccountKey: process.env.DATAMALL_API_KEY
            },
            responseType: 'json',
            timeout: 60000,
        })

        values.push(...data.body.value);
        skip += 500;
    } while(data.body.value.length > 0);

    return values
}

const getBuses = async () => {
    const values = []
    let skip = 0;
    let data;
    do {
        data = await got.get(`http://datamall2.mytransport.sg/ltaodataservice/BusServices?$skip=${skip}`, {
            headers: {
                AccountKey: process.env.DATAMALL_API_KEY
            },
            responseType: 'json',
            timeout: 60000,
        });
        
        values.push(...data.body.value);
        skip += 500;
    } while(data.body.value.length > 0);

    return values
}

const getBusStops = async () => {
    const values = []
    let skip = 0;
    let data;
    do {
        data = await got.get(`http://datamall2.mytransport.sg/ltaodataservice/BusStops?$skip=${skip}`, {
            headers: {
                AccountKey: process.env.DATAMALL_API_KEY
            },
            responseType: 'json',
            timeout: 60000,
        })

        values.push(...data.body.value);
        skip += 500;
    } while(data.body.value.length > 0);

    return values
}

module.exports = {
    getBusRoutes: getBusRoutes(),
    getBuses: getBuses(),
    getBusStops: getBusStops(),
}