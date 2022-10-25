const fetch = require('electron-fetch').default;
const { isAuthorized, isTokenExpired } = require('../auth/helpers');
const logsHandler = require('../logs');
const { config, LOG } = require('../../common');

const isOnline = async () => {
  const isOnlineFlag = await fetch('https://api.cinemataztic.com', {
    method: 'GET',
    cache: 'no-cache',
    headers: { 'Content-Type': 'application/json' },
    referrerPolicy: 'no-referrer',
  })
    .then(() => true)
    .catch(() => false);
  return isOnlineFlag;
};

const getConnectivity = async () => {
  try {
    return {
      isOnline: await isOnline(),
      isAuthorized: await isAuthorized(),
      isTokenExpired: await isTokenExpired(),
    };
  } catch (error) {
    logsHandler.log(`Error in getConnectivity : ${error.message}`, LOG.SEVERITY.ERROR, [LOG.TARGET.SENTRY, LOG.TARGET.WINSTON], LOG.TYPE.GENERAL);
  }
};

module.exports = {
  getConnectivity,
};
