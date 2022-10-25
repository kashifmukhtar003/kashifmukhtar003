/* eslint-disable no-plusplus */
const RealmDB = require('../index');

const getLogs = async (objectName) => {
  try {
    const logsRealm = await RealmDB.getRealmInstance();
    const logsData = await JSON.parse(
      JSON.stringify(logsRealm.objects(objectName))
    );
    return logsData;
  } catch (error) {
    throw new Error(`Error occurred in fetching logs ${error}`);
  }
};

const setLogs = async (objectName, data) => {
  try {
    if (data) {
      const logsRealm = await RealmDB.getRealmInstance();
      logsRealm.write(() => {
        logsRealm.delete(logsRealm.objects(objectName));
        logsRealm.create(objectName, data);
      });
    }
  } catch (error) {
    throw new Error(`Error occurred in setting logs ${error}`);
  }
};

const deleteLogs = async (objectName, logId) => {
  try {
    const logsRealm = await RealmDB.getRealmInstance();
    logsRealm.write(() => {
      logsRealm.delete(
        logsRealm.objects(objectName).filtered(`_id = oid(${logId})`)
      );
    });
  } catch (error) {
    throw new Error(`Error occurred in deleting logs ${error}`);
  }
};

const updateLog = async (objectName, logId, updatedData) => {
  try {
    const logsRealm = await RealmDB.getRealmInstance();

    //* Dynamic extraction of updated data keys
    const updatedDataKeys = Object.keys(updatedData);
    //* Dynamic extraction of updated data values
    const updatedDataValues = Object.values(updatedData);

    //* Filters by ObjectId
    const logUpdate = logsRealm
      .objects(objectName)
      .filtered(`_id = oid(${logId})`)[0]; // reference https://github.com/realm/realm-js/issues/3370

    logsRealm.write(async () => {
      for (let i = 0; i < updatedDataKeys.length; i++) {
        if (updatedDataKeys[i] === 'retries') {
          // eslint-disable-next-line operator-assignment
          logUpdate[updatedDataKeys[i]] =
            logUpdate[updatedDataKeys[i]] + updatedDataValues[i];
        } else {
          logUpdate[updatedDataKeys[i]] = updatedDataValues[i];
        }
      }
    });
  } catch (error) {
    throw new Error(`Error occurred in updating logs ${error}`);
  }
};

module.exports = {
  getLogs,
  setLogs,
  deleteLogs,
  updateLog,
};
