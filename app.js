const bus_cache = require('./bus/scripts/caching')
const mrt_cache = require('./train/scripts/caching')
const path = require('path');
const fastify = require('fastify')({
    logger: true
})

fastify.get('/', async (request, reply) => {
    return reply.redirect(302, "https://github.com/Ju-Long/sgTransport")
});

fastify.register(require('@fastify/static'), {
    root: path.join(__dirname, 'assets'),
    prefix: '/assets/'
});

fastify.register(require('./bus/index'))
fastify.register(require('./train/index'))

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
    await bus_cache.cache()
    await mrt_cache.cache()
})