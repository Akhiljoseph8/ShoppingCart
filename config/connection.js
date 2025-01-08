const { MongoClient } = require('mongodb');

const state = {
  db: null,
};

const connect = async (done) => {
  try {
    const url = 'mongodb+srv://akhil:akhil@cluster0.kzna9t8.mongodb.net/?retryWrites=true&w=majority';
    const dbName = 'shopping';

    // Create a MongoClient instance
    const client = new MongoClient(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true, // Modern flag
    });

    // Connect to the database
    await client.connect();
    console.log('Database connected successfully');
    state.db = client.db(dbName); // Store the DB instance

    if (done) done(); // Call done callback if provided
  } catch (err) {
    console.error('Database connection failed:', err);
    if (done) done(err);
    throw err;
  }
};

const get = () => {
  if (!state.db) {
    throw new Error('Database not connected!');
  }
  return state.db; // Return the stored DB instance
};

module.exports = { connect, get };


