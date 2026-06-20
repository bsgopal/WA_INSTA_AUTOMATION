const mongoose = require('mongoose');
const { Worker } = require('bullmq');
require('dotenv').config();

const aiChatHandler = require('../services/aiChatHandler');
const { QUEUE_NAME, getRedisConnection } = require('../services/messageQueueService');

const WORKER_CONCURRENCY = Number(process.env.AI_WORKER_CONCURRENCY || 10);
const LOCK_TTL_MS = Number(process.env.AI_CUSTOMER_LOCK_TTL_MS || 120000);
const LOCK_RETRY_DELAY_MS = Number(process.env.AI_CUSTOMER_LOCK_RETRY_DELAY_MS || 3000);
const LOCK_WAIT_TIMEOUT_MS = Number(process.env.AI_CUSTOMER_LOCK_WAIT_TIMEOUT_MS || 60000);

const getMongoUri = () => {
  if (process.env.NODE_ENV === 'development') {
    return process.env.MONGODB_LOCAL_URI || 'mongodb://localhost:27017/renic-automation';
  }

  return process.env.MONGODB_ATLAS_URI || process.env.MONGODB_LOCAL_URI || 'mongodb://localhost:27017/renic-automation';
};

const getLockKey = data => [
  data.channel,
  data.userId,
  data.phoneNumber
].join(':');

const getLocksCollection = () => mongoose.connection.collection('ai_processing_locks');

const acquireCustomerLock = async lockKey => {
  const locks = getLocksCollection();
  const now = new Date();
  const token = new mongoose.Types.ObjectId().toString();
  const expiresAt = new Date(now.getTime() + LOCK_TTL_MS);

  const updateResult = await locks.updateOne(
    {
      _id: lockKey,
      $or: [
        { locked: { $ne: true } },
        { expiresAt: { $lte: now } }
      ]
    },
    {
      $set: {
        locked: true,
        token,
        expiresAt,
        updatedAt: now
      },
      $setOnInsert: {
        createdAt: now
      }
    },
    { upsert: false }
  );

  if (updateResult.modifiedCount > 0 || updateResult.matchedCount > 0) {
    return token;
  }

  try {
    await locks.insertOne({
      _id: lockKey,
      locked: true,
      token,
      expiresAt,
      createdAt: now,
      updatedAt: now
    });
    return token;
  } catch (error) {
    if (error && error.code === 11000) {
      return null;
    }
    throw error;
  }
};

const releaseCustomerLock = async (lockKey, token) => {
  await getLocksCollection().updateOne(
    { _id: lockKey, token },
    {
      $set: {
        locked: false,
        updatedAt: new Date()
      },
      $unset: {
        token: '',
        expiresAt: ''
      }
    }
  );
};

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const waitForCustomerLock = async lockKey => {
  const deadline = Date.now() + LOCK_WAIT_TIMEOUT_MS;

  while (Date.now() <= deadline) {
    const token = await acquireCustomerLock(lockKey);
    if (token) return token;
    await delay(LOCK_RETRY_DELAY_MS);
  }

  return null;
};

const processMessageJob = async job => {
  const lockKey = getLockKey(job.data);
  const lockToken = await waitForCustomerLock(lockKey);

  if (!lockToken) {
    throw new Error('Customer conversation is already being processed');
  }

  try {
    const result = await aiChatHandler.handleCustomerMessage(
      job.data.phoneNumber,
      job.data.messageBody,
      job.data.channel,
      job.data.userId,
      job.data.mediaUrl || null,
      job.data.options || {}
    );

    if (!result.success) {
      throw new Error(result.error || 'AI message processing failed');
    }

    return {
      success: true,
      customerId: result.customerId,
      conversationId: result.conversationId,
      escalated: result.escalated
    };
  } finally {
    await releaseCustomerLock(lockKey, lockToken);
  }
};

const startWorker = async () => {
  await mongoose.connect(getMongoUri());
  console.log(`MongoDB connected for AI worker (${process.env.NODE_ENV || 'development'})`);

  const worker = new Worker(QUEUE_NAME, processMessageJob, {
    connection: getRedisConnection(),
    concurrency: WORKER_CONCURRENCY,
    limiter: {
      max: Number(process.env.AI_QUEUE_RATE_LIMIT_MAX || 60),
      duration: Number(process.env.AI_QUEUE_RATE_LIMIT_DURATION_MS || 60000)
    }
  });

  worker.on('completed', (job, result) => {
    console.log(`AI job completed: ${job.id}`, result);
  });

  worker.on('failed', (job, error) => {
    console.error(`AI job failed: ${job?.id}`, error.message);
  });

  console.log(`AI message worker started on queue "${QUEUE_NAME}" with concurrency ${WORKER_CONCURRENCY}`);
};

startWorker().catch(error => {
  console.error('AI message worker failed to start:', error);
  process.exit(1);
});
