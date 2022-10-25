const authModel = {
  name: 'Auth',
  properties: {
    _id: 'objectId',
    access_token: 'string',
    refresh_token: 'string',
    status: 'string',
    heartbeatInterval: 'int',
  },
};

module.exports = {
  authModel,
};
