const Realm = require('realm');

const { authModel } = require('./models/auth');
const { logsModel } = require('./models/logs');
const {
  nextShowModel,
  playerModel,
  blockModel,
  schedulesModel,
  playlistModel,
  targetsModel,
  gamesModel,
  screenModel,
  cineCardExecutableModel,
  settingsProfileModel,
  defaultPlaylistModel,
} = require('./models/heartbeat');
const {
  dhcpOverridesModel,
  networkConfigModel,
  systemMacModel,
  networkInterfaceModel,
  machineModel,
} = require('./models/network-config');

const RealmDB = (() => {
  let realmInstance = null;

  async function initRealm() {
    try {
      const config = {
        schema: [
          nextShowModel,
          playerModel,
          blockModel,
          schedulesModel,
          playlistModel,
          targetsModel,
          gamesModel,
          screenModel,
          cineCardExecutableModel,
          settingsProfileModel,
          defaultPlaylistModel,
          authModel,
          logsModel,
          dhcpOverridesModel,
          networkConfigModel,
          systemMacModel,
          networkInterfaceModel,
          machineModel,
        ],
        path: 'realm/default/dchp',
        schemaVersion: 1,
      };
      const realm = await Realm.open(config);
      return realm;
    } catch (error) {
      throw new Error(`Error occurred in initializing realm ${error}`);
    }
  }

  return {
    async getRealmInstance() {
      if (!realmInstance) {
        realmInstance = await initRealm();
      }
      return realmInstance;
    },
    async closeRealmInstance() {
      if (realmInstance) {
        realmInstance.close();
        realmInstance = null;
      }
    },
  };
})();

module.exports = RealmDB;
