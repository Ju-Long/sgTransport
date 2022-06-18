const { cache } = require('./bus/scripts/caching')

const fastify = require('fastify')({
    logger: true
})

fastify.get('/', async (request, reply) => {
    return
})

fastify.register(require('./bus/index'))

const start = async () => {
    await fastify.listen(3002, '0.0.0.0')
    .then((address) => console.log(`server is listening on ${address}`))
    .catch(err => {
        console.log('error starting server: ', err);
        process.exit(1);
    });
}
start()

// MARK: CRON JOBS
const cron = require('node-cron')

// fetch Everyday
cron.schedule('0 0 * * *', async () => {
    await cache()
})