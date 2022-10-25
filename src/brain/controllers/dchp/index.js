const { ipcMain } = require('electron');
const {
  upsert,
  getPlayer,
  deletePlayer,
  fetchRealmSettingsProfile,
} = require('./helper');

const dchpHandler = async (arg) => {
  switch (arg.action) {
    case 'upsert':
      return upsert(arg);
    case 'getPlayer': {
      const player = await getPlayer();
      return player;
    }
    case 'getSettingsProfile': {
      const settingsProfile = await fetchRealmSettingsProfile();
      return settingsProfile;
    }
    case 'delete':
      deletePlayer();
      break;
    default:
      break;
  }
};

ipcMain.handle('dchp', dchpHandler);

module.exports = dchpHandler;
