const fastify = require('fastify')({
    logger: true
})

fastify.get('/', async (request, reply) => {
    return {
        hello: 'world'
    }
})

const start = async () => {
    try {
        await fastify.listen({
            port: 3000
        })
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}
start()

// MARK: CRON JOBS
const redis = require('redis')
const cron = require('node-cron')

// fetch Everyday
cron.schedule('0 0 * * *', () => {

})