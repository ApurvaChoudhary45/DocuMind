import { createClient } from 'redis'

const redis = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
})

redis.on('error', (error) => {
    console.error('Redis Client Error:', error)
})

let isConnected = false

export async function getRedisClient() {
    if (!isConnected) {
        await redis.connect()
        isConnected = true

        console.log('✅ Connected to Redis')
    }

    return redis
}