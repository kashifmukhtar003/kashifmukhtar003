const { ipcMain } = require('electron');
const {
  authorize,
  getToken,
  getAuth,
  isTokenExpired,
  isAuthorized,
  deleteAuth
} = require('./helpers');

const authHandler = async (event, arg) => {
  switch (arg.action) {
    case 'getAuth': {
      const auth = await getAuth();
      return auth;
    }
    case 'getToken': {
      const token = await getToken();
      return token;
    }
    case 'deleteAuth': {
      await deleteAuth();
    }
    case 'authorize': {
      let authToken = null;
      if ((await isTokenExpired()) || !(await isAuthorized())) {
        authToken = await authorize({ machineId: arg.params });
      } else {
        const temp = await getAuth();
        authToken = { ...temp, statusCode: 200 };
      }

      return authToken;
    }
    case 'status': {
      const statusObj = await getAuth();
      return statusObj.status;
    }
    case 'accessToken': {
      const accessObj = await getAuth();
      return accessObj.access_token;
    }
    default:
      return 'Unknown argument';
  }
};

ipcMain.handle('auth', authHandler);

module.exports = authHandler;
