const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const QUEUE_NAME = process.env.AI_MESSAGE_QUEUE_NAME || 'ai-message-processing';

let isRedisConnected = false;

const getRedisConnection = () => {
  let connection;
  if (process.env.REDIS_URL) {
    connection = new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      retryStrategy: () => 5000 // Suppress crashing by retrying gently every 5s
    });
  } else {
    connection = new IORedis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: Number(process.env.REDIS_PORT || 6379),
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
      retryStrategy: () => 5000 // Suppress crashing by retrying gently every 5s
    });
  }

  connection.on('connect', () => {
    isRedisConnected = true;
  });

  connection.on('error', (err) => {
    isRedisConnected = false;
    if (err.code === 'ECONNREFUSED') {
      // Silently handle connection errors so the Node server doesn't crash
    } else {
      console.warn(`⚠️ Redis Warning: ${err.message}`);
    }
  });

  return connection;
};

const queue = new Queue(QUEUE_NAME, {
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: Number(process.env.AI_QUEUE_ATTEMPTS || 3),
    backoff: {
      type: 'exponential',
      delay: Number(process.env.AI_QUEUE_BACKOFF_MS || 5000)
    },
    removeOnComplete: {
      age: Number(process.env.AI_QUEUE_REMOVE_COMPLETE_SECONDS || 86400),
      count: Number(process.env.AI_QUEUE_REMOVE_COMPLETE_COUNT || 1000)
    },
    removeOnFail: {
      age: Number(process.env.AI_QUEUE_REMOVE_FAILED_SECONDS || 604800),
      count: Number(process.env.AI_QUEUE_REMOVE_FAILED_COUNT || 5000)
    }
  }
});

queue.on('error', (err) => {
  // Prevent unhandled rejection crashes from the BullMQ queue itself
});

const normalizeJobIdPart = value => String(value || '')
  .replace(/[^a-zA-Z0-9_.:@+-]/g, '_')
  .slice(0, 160);

const buildJobId = payload => {
  const externalId = payload.externalMessageId || payload.messageId || payload.timestamp || Date.now();
  return [
    normalizeJobIdPart(payload.channel),
    normalizeJobIdPart(payload.userId),
    normalizeJobIdPart(payload.phoneNumber),
    normalizeJobIdPart(externalId)
  ].join(':');
};

const enqueueIncomingMessage = async payload => {
  if (!isRedisConnected) {
    throw new Error('Redis is not connected, bypassing queue');
  }

  const job = await queue.add('incoming-message', payload, {
    jobId: buildJobId(payload)
  });

  return {
    jobId: job.id,
    queueName: QUEUE_NAME
  };
};

module.exports = {
  QUEUE_NAME,
  getRedisConnection,
  enqueueIncomingMessage,
  queue
};
