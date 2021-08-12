import redis from 'redis'

const redisClient = redis.createClient()

redisClient.on("error", (err) => {
    console.log(err)
})

export default redisClient

