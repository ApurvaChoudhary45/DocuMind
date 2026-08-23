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

export async function getCache<T>(key: string): Promise<T | null> {
    const client = await getRedisClient()

    const value = await client.get(key)

    if (!value) {
        return null
    }

    return JSON.parse(value) as T
}


export async function setCache(
    key: string,
    value: unknown,
    ttlSeconds: number
): Promise<void> {
    const client = await getRedisClient()

    await client.set(
        key,
        JSON.stringify(value),
        {
            EX: ttlSeconds,
        }
    )
}


export async function deleteCache(key: string): Promise<void> {
    const client = await getRedisClient()

    await client.del(key)
}