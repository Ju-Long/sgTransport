const { createClient } = require('redis');

const retrieveMRTList = async () => {
    const client = createClient();
    client.on('error', (err) => console.error('Redis Client Error', err));

    
}

module.exports = {
    retrieveMRTList
}