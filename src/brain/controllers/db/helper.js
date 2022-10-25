const AuthDB = require('../../db/service/auth');
const LogsDB = require('../../db/service/logs');
const HeartbeatDB = require('../../db/service/heartbeat');
const NetWorkConfigDB = require('../../db/service/networkConfig');
const ObjectNameDB = require('../../db/object-names');

module.exports = {
  AuthDB,
  HeartbeatDB,
  LogsDB,
  NetWorkConfigDB,
  ObjectNameDB,
};
