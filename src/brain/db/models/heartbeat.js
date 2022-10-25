const nextShowModel = {
  name: 'NextShow',
  properties: {
    _id: 'objectId',
    duration: 'int',
    blocks: 'Block[]',
    blockSize: 'int',
    startTime: 'date',
    movieTitle: 'string',
    isTest: 'bool',
  },
  primaryKey: '_id',
};

const blockModel = {
  name: 'Block',
  properties: {
    _id: 'string',
    type: 'string',
    show: 'string',
    maxDuration: 'int',
    minDuration: 'int',
    duration: 'int',
    isTest: 'bool',
  },
  primaryKey: '_id',
};

const playerModel = {
  name: 'Player',
  properties: {
    _id: 'string',
    hostname: 'string',
    status: 'string',
    heartbeatInterval: 'int',
    tcpCuesPort: 'int',
    showSystemInfo: 'bool',
    market: 'string',
    clientID: 'string',
  },
  primaryKey: '_id',
};

const gamesModel = {
  name: 'Games',
  properties: {
    _id: 'string',
    duration: 'int',
    title: 'string',
  },
  primaryKey: '_id',
};

const targetsModel = {
  name: 'Targets',
  properties: {
    _id: 'string',
    name: 'string',
    games: 'Games[]',
  },
  primaryKey: '_id',
};

const playlistModel = {
  name: 'Playlist',
  properties: {
    _id: 'string',
    title: 'string',
    targets: 'Targets[]',
  },
  primaryKey: '_id',
};

const schedulesModel = {
  name: 'Schedules',
  properties: {
    _id: 'string',
    from: 'date',
    to: 'date',
    playlist: 'Playlist',
  },
  primaryKey: '_id',
};

const settingsProfileModel = {
  name: 'SettingsProfile',
  properties: {
    _id: 'string',
    name: 'string',
    type: 'int',
    screenResolution: 'string',
    refreshRate: 'double',
    dhcp: 'bool',
    ipAddress: 'string',
    routeMetric: 'int',
    primaryDNS: 'string',
    secondaryDNS: 'string',
  },
  primaryKey: '_id',
};

const cineCardExecutableModel = {
  name: 'CineCardExecutable',
  properties: {
    _id: 'string',
    duration: 'int',
    type: 'string',
    name: 'string',
    market: 'string',
  },
  primaryKey: '_id',
};

const screenModel = {
  name: 'Screen',
  properties: {
    _id: 'string',
    name: 'string',
    networkName: 'string',
    clusterName: 'string',
    countryCode: 'string',
  },
  primaryKey: '_id',
};

const defaultPlaylistModel = {
  name: 'DefaultPlaylist',
  properties: {
    _id: 'string',
    title: 'string',
    targets: 'Targets[]',
  },
  primaryKey: '_id',
};

module.exports = {
  nextShowModel,
  playerModel,
  blockModel,
  schedulesModel,
  playlistModel,
  gamesModel,
  targetsModel,
  screenModel,
  cineCardExecutableModel,
  settingsProfileModel,
  defaultPlaylistModel,
};
