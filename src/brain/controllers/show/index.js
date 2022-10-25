const { ipcMain } = require('electron');
const { upsertShow, deleteShow, execShow, getScreen } = require('./helper');

const nextShowHandler = async (arg) => {
  switch (arg.action) {
    case 'upsert':
      if (!arg.nextShow) return;
      await upsertShow(arg.nextShow);
      break;
    case 'delete':
      await deleteShow();
      break;
    case 'execShow':
      await execShow();
      break;
    case 'getScreen':
      return getScreen();
    default:
      break;
  }
};

ipcMain.handle('show', nextShowHandler);

module.exports = nextShowHandler;
