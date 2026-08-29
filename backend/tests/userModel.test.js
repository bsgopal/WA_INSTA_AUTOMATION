const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

test('User model accepts AI role', async () => {
  const User = require('../models/User');
  const user = new User({
    firstName: 'Ai',
    lastName: 'Bot',
    email: 'ai.bot@example.com',
    phone: '9998887776',
    password: 'Secret123',
    role: 'AI'
  });

  await expect(user.save()).resolves.toBeDefined();

  const found = await User.findOne({ email: 'ai.bot@example.com' }).lean();
  expect(found).toBeTruthy();
  expect(found.role).toBe('AI');
});
