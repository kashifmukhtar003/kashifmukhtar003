const RealmDB = require('../index');

const getNetworkConfig = async (objectName) => {
  try {
    const networkConfigRealm = await RealmDB.getRealmInstance();
    const networkConfigData = await JSON.parse(
      JSON.stringify(networkConfigRealm.objects(objectName))
    );
    return networkConfigData;
  } catch (error) {
    throw new Error(`Error occurred in fetching network config ${error}`);
  }
};

const setNetworkConfig = async (objectName, data) => {
  try {
    if (data) {
      const networkConfigRealm = await RealmDB.getRealmInstance();
      networkConfigRealm.write(() => {
        networkConfigRealm.delete(networkConfigRealm.objects(objectName));
        networkConfigRealm.create(objectName, data);
      });
    }
  } catch (error) {
    throw new Error(`Error occurred in setting network config ${error}`);
  }
};

const deleteNetworkConfig = async (objectName) => {
  try {
    const networkConfigRealm = await RealmDB.getRealmInstance();
    networkConfigRealm.write(() => {
      networkConfigRealm.delete(networkConfigRealm.objects(objectName));
    });
  } catch (error) {
    throw new Error(`Error occurred in deleting network config ${error}`);
  }
};

const getNetworkConfigByPrimaryKey = async (objectName, key) => {
  try {
    const networkConfigRealm = await RealmDB.getRealmInstance();
    let networkConfigData = await networkConfigRealm.objectForPrimaryKey(
      objectName,
      key
    );
    if (networkConfigData) {
      networkConfigData = await JSON.parse(JSON.stringify(networkConfigData));
    }
    return networkConfigData;
  } catch (error) {
    throw new Error(`Error occurred in fetching network config ${error}`);
  }
};

module.exports = {
  getNetworkConfig,
  setNetworkConfig,
  deleteNetworkConfig,
  getNetworkConfigByPrimaryKey,
};
