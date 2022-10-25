const RealmDB = require('../index');

const getAuth = async (objectName) => {
  try {
    const authRealm = await RealmDB.getRealmInstance();
    const authData = await JSON.parse(
      JSON.stringify(authRealm.objects(objectName))
    );
    return authData;
  } catch (error) {
    throw new Error(`Error occurred in fetching auth ${error}`);
  }
};

const setAuth = async (objectName, data) => {
  try {
    if (data) {
      const authRealm = await RealmDB.getRealmInstance();
      authRealm.write(() => {
        authRealm.delete(authRealm.objects(objectName));
        authRealm.create(objectName, data);
      });
    }
  } catch (error) {
    throw new Error(`Error occurred in setting auth ${error}`);
  }
};

const deleteAuth = async (objectName) => {
  try {
    const authRealm = await RealmDB.getRealmInstance();
    authRealm.write(() => {
      authRealm.delete(authRealm.objects(objectName));
    });
  } catch (error) {
    throw new Error(`Error occurred in deleting auth ${error}`);
  }
};

module.exports = {
  getAuth,
  setAuth,
  deleteAuth,
};
