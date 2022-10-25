const Realm = require('realm');
const { api } = require('../../api');
const { config, LOG } = require('../../common');
const { LogsDB, ObjectNameDB } = require('../db/helper');
const authHandler = require('../auth/index');
const dchpHandler = require('../dchp/index');
const osHandler = require('../os/index');
const APIS = require('../../apis');
// const Sentry = require("@sentry/electron");
const logger = require("../../utils/logger");

const addLogToRealm = async (data) => {
  const logData = {
    _id: Realm.BSON.ObjectID(),
    url: api.player_log,
    params: JSON.stringify(data),
    retries: 0,
  };
  await LogsDB.setLogs(ObjectNameDB.LOGS_LOGS, logData);
};

const createLocalLog = async (params) => {
  let data;
  try {
    // Get Mac
    const mac = await osHandler('osConfig', { action: 'systemMac' });

    const auth = await authHandler('auth', { action: 'getToken', params: { mac: mac } });

    data = {
      type: params.type,
      severity: params.severity,
      body: params.message,
    };

    const result = await APIS.playerLog(data, auth.access_token);

    if (result.ok) {
      let resultInJson = await result.json();
      return {
        severity: resultInJson.severity ? resultInJson.severity : null,
        type: resultInJson.type ? resultInJson.type : null,
        _id: resultInJson._id ? resultInJson._id : null,
        body: resultInJson.body ? resultInJson.body : null,
        market: resultInJson.market ? resultInJson.market : null,
        device: resultInJson.device,
        timestamp: resultInJson.timestamp ? resultInJson.timestamp : null,
        screen: resultInJson.screen ? resultInJson.screen : null,
      };
    } else {
      await addLogToRealm(data);
      log('log entry failed');
    }
  } catch (error) {
    const data = {
      type: params.type,
      severity: params.severity,
      body: params.message,
    };
    await addLogToRealm(data);
    log(`Error in log entry api ${error}`);
  }
};

const retryLocalLog = async () => {
  const Logs = await LogsDB.getLogs(ObjectNameDB.LOGS_LOGS);
  if (Logs.length > 0) {
    Logs.map(async (log) => {
      if (log.retries > 5) {
        await LogsDB.deleteLogs(ObjectNameDB.LOGS_LOGS, log._id);
      } else {
        try {
          // Auth Realm
          const auth = await authHandler('auth', { action: 'getAuth' });

          const result = await APIS.playerLog(
            JSON.parse(log.params),
            auth.access_token
          );
          if (result.ok) {
            await LogsDB.deleteLogs(ObjectNameDB.LOGS_LOGS, log._id);
          } else {
            //* Update Logs retries by 1
            await LogsDB.updateLog(ObjectNameDB.LOGS_LOGS, log._id, {
              retries: 1,
            });
          }
        } catch (error) {
          await LogsDB.updateLog(ObjectNameDB.LOGS_LOGS, log._id, {
            retries: 1,
          });
        }
      }
    });
  }
};

const createWinstonLog = (params) => {
  if (params.severity === LOG.SEVERITY.NOTICE) {
    logger.info(params.message);
  }
  if (params.severity === LOG.SEVERITY.WARNING) {
    logger.warn(params.message);
  }
  if (params.severity === LOG.SEVERITY.ERROR) {
    logger.error(params.message);
  }
  if (params.severity === LOG.SEVERITY.CRITICAL) {
    logger.crit(params.message);
  }
  if (params.severity === LOG.SEVERITY.DEBUG) {
    logger.debug(params.message);
  }
}

const createSentryLog = (params) => {
  // if (process.env.NODE_ENV === 'production' && [LOG.SEVERITY.ERROR, LOG.SEVERITY.CRITICAL].includes(params.severity)) {
  //   // Report error to Sentry
  //   Sentry.withScope(function (scope) {
  //     scope.setLevel(params.severity);
  //     //scope.setUser({ id: friendlyID }); <-- TODO: add friendly id
  //     //scope.setTag('hostname', os.hostname()); <-- TODO: Add hostname
  //     //scope.setTag('machineId', machineId) <-- TODO: get machine id and add it here
  //     //scope.setTag('networkName', networkName) <-- TODO: Add network name
  //     //scope.country('country', country) <-- TODO: Add country
  //     Sentry.captureException(new Error(params.message));
  //   })
  // }
}

const log = async (message, severity = LOG.SEVERITY.DEBUG, target = [LOG.TARGET.WINSTON], type = LOG.TYPE.GENERAL) => {
  // Player Realm
  const player = await dchpHandler({ action: 'getPlayer' });
  //add machine info in log
  message = `Info: client: ${player ? player['clientID'] : 'unknown'
    } for device: ${player ? player['_id'] : 'unknown'} in market: ${player ? player['market'] : 'unknown'
    }. \n${message}`

  let params = { message, severity, target, type };

  if (params.target.includes(LOG.TARGET.CLOUD)) {
    await createLocalLog(params);
  }
  if (params.target.includes(LOG.TARGET.SENTRY)) {
    createSentryLog(params)
  }
  if (params.target.includes(LOG.TARGET.WINSTON)) {
    createWinstonLog(params)
  }
};

const retryLog = async () => {
  await retryLocalLog();
  //for testing logs
  //log('Testing'+process.env.NODE_ENV,LOG.SEVERITY.CRITICAL,[LOG.TARGET.CLOUD, LOG.TARGET.SENTRY, LOG.TARGET.WINSTON], LOG.TYPE.GENERAL);
};

module.exports = {
  log,
  retryLog,
};
