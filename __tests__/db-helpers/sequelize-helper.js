module.exports = {
  pruneCollections,
  dropAllCollections,
};

async function pruneCollections (db) {
  const sequelize = db;
  //return await db.query('DELETE FROM users');
  return await sequelize.models.User.destroy({
    truncate: true
  });
}

async function dropAllCollections (db) {
  const sequelize = db;
  //return await db.query('DROP TABLE users');
  return await sequelize.drop();
}
