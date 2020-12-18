module.exports = {
  pruneCollections,
  dropAllCollections,
};

async function pruneCollections (db) {
  return await db.query('DELETE FROM users');
}

async function dropAllCollections (db) {
  return await db.query('DROP TABLE users');
}
