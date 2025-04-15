const { Low, JSONFile } = require('lowdb');
const path = require('path');

// Define the JSON file path
const file = path.join(__dirname, 'memory.json');
const adapter = new JSONFile(file);
const db = new Low(adapter);

// Initialize the database with default structure if needed
async function init() {
  await db.read();
  // Set defaults if db is empty
  db.data = db.data || { users: {} };
  await db.write();
}

// Run initialization immediately
init();

// Store/update a user's context in persistent memory
async function storeUserContext(userId, context) {
  await db.read();
  // Merge new context with any existing context
  db.data.users[userId] = { ...db.data.users[userId], ...context };
  await db.write();
}

// Retrieve a user's context from persistent memory
async function retrieveUserContext(userId) {
  await db.read();
  return db.data.users[userId] || {};
}

module.exports = { storeUserContext, retrieveUserContext };
