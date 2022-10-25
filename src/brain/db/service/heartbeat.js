const RealmDB = require('../index');

const getHeartbeat = async (objectName) => {
  try {
    const heartbeatRealm = await RealmDB.getRealmInstance();
    const heartbeatData = await JSON.parse(
      JSON.stringify(heartbeatRealm.objects(objectName))
    );
    return heartbeatData;
  } catch (error) {
    throw new Error(`Error occurred in fetching heartbeat ${error}`);
  }
};

const setHeartbeat = async (objectName, data) => {
  try {
    if (data) {
      const heartbeatRealm = await RealmDB.getRealmInstance();
      heartbeatRealm.write(() => {
        heartbeatRealm.delete(heartbeatRealm.objects(objectName));
        heartbeatRealm.create(objectName, data);
      });
    }
  } catch (error) {
    throw new Error(`Error occurred in setting heartbeat ${error}`);
  }
};

const deleteHeartbeat = async (objectName) => {
  try {
    const heartbeatRealm = await RealmDB.getRealmInstance();
    heartbeatRealm.write(() => {
      heartbeatRealm.delete(heartbeatRealm.objects(objectName));
    });
  } catch (error) {
    throw new Error(`Error occurred in deleting heartbeat ${error}`);
  }
};

//* Upserts inserts new object with provided data or updates existing object, updatedData must be provided a primary key
const upsertHeartbeat = async (objectName, updatedData) => {
  try {
    const heartbeatRealm = await RealmDB.getRealmInstance();
    heartbeatRealm.write(() => {
      // heartbeatRealm.delete(heartbeatRealm.objects(objectName)); Is this needed during an upsert operation
      heartbeatRealm.create(objectName, updatedData, 'modified');
    });
  } catch (error) {
    throw new Error(`Error occurred in upserting heartbeat ${error}`);
  }
};

module.exports = {
  getHeartbeat,
  setHeartbeat,
  deleteHeartbeat,
  upsertHeartbeat,
};
