const { app } = require('electron');
function getCineCardPath() {
  switch (process.platform) {
    case 'darwin':
      return '${homeDir}/Assets/executables/CineCard/607d5d9ecd04200019167acf/CineCard.app/Contents/MacOS/CineCard';
    case 'linux':
      return '${homeDir}/Assets/executables/CineCard/607d5d9ecd04200019167acf/CineCard.x86_64';
    default:
      return undefined;
  }
}

function getCineAdPath() {
  switch (process.platform) {
    case 'darwin':
      return `/Applications/cinead-p.app/Contents/MacOS/cinead-p`;
    case 'linux':
      return '/usr/bin/cinead-p';
    default:
      return undefined;
  }
}

function getCineGamePath() {
  switch (process.platform) {
    case 'darwin':
      return '${homeDir}/Assets/cinemataztic-games/5bc39602dad26d00103c1118/LiigaIceHocky-FI-2018-Oct_StandaloneOSX.app/Contents/MacOS/LiigaIceHocky-FI-2018-Oct_StandaloneOSX';
    case 'linux':
      return '${homeDir}/Assets/cinemataztic-games/5bc39602dad26d00103c1118/LiigaIceHocky-FI-2018-Oct_StandaloneLinux64.x86_64';
    default:
      return undefined;
  }
}

function getScriptsPath() {
  switch (process.env.NODE_ENV) {
    case 'development':
      return './scripts/';
    case 'production':
      return 'sh /usr/lib/dchp/scripts/';
    default:
      return undefined;
  }
}

function getAppVersion() {
  return app.getVersion();
}

const LOG = {
  TARGET: {
    CLOUD: 'cloud',
    SENTRY: 'sentry',
    WINSTON: 'winston',
  },
  TYPE: {
    UNITY: 'unity',
    GENERAL: 'general',
    UNKNOWN: 'unknown',
  },
  SEVERITY: {
    NOTICE: 'notice',
    WARNING: 'warning',
    ERROR: 'error',
    CRITICAL: 'critical',
    DEBUG: 'debug',
  },
};

const config = {
  headers: {
    'User-Agent': `${process.env.USER_AGENT_PRODUCT}/${app.getVersion()}`,
    'market-slug': process.env.MARKET_SLUG,
    'Content-Type': 'application/json',
  },
  executablePaths: {
    CineCard: getCineCardPath(),
    CineAd: getCineAdPath(),
    CineGame: getCineGamePath(),
    Default: undefined,
  },
  scriptsPath: getScriptsPath(),
  appVersion: getAppVersion(),
  profileSettings: false
};

module.exports = {
  config,
  LOG,
};
