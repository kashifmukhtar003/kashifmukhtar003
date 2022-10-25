const Realm = require('realm');
const template = require('string-placeholder');
const runSeries = require('run-series');
const os = require('os');
const path = require('path');
const processManager = require('../../process-manager');
const { config, LOG } = require('../../common');
const { HeartbeatDB, ObjectNameDB } = require('../db/helper');
const authHandler = require('../auth/index');
const logsHandler = require('../logs/index');
const dchpHandler = require('../dchp/index');

//* DB Helper methods start
const setShow = async (data) => {
  await HeartbeatDB.setHeartbeat(ObjectNameDB.HEARTBEAT_NEXT_SHOW, data);
};

const upsertShow = async (nextShow) => {
  try {
    // eslint-disable-next-line no-underscore-dangle
    nextShow._id = Realm.BSON.ObjectID(nextShow._id);
    await HeartbeatDB.upsertHeartbeat(
      ObjectNameDB.HEARTBEAT_NEXT_SHOW,
      nextShow
    );
  } catch (error) {
    logsHandler.log(
      `Unable to insert or update next show ${error.message}`,
      LOG.SEVERITY.ERROR,
      [LOG.TARGET.SENTRY, LOG.TARGET.WINSTON],
      LOG.TYPE.GENERAL
    );
    throw new Error(`Unable to insert or update next show ${error.message}`);
  }
};

const deleteShow = async () => {
  try {
    await HeartbeatDB.deleteHeartbeat(ObjectNameDB.HEARTBEAT_NEXT_SHOW);
  } catch (error) {
    logsHandler.log(
      `Unable to delete next show ${error.message}`,
      LOG.SEVERITY.ERROR,
      [LOG.TARGET.SENTRY, LOG.TARGET.WINSTON],
      LOG.TYPE.GENERAL
    );
    throw new Error(`Unable to delete next show ${error.message}`);
  }
};

const getScreen = async () => {
  try {
    const screen = await HeartbeatDB.getHeartbeat(
      ObjectNameDB.HEARTBEAT_SCREEN
    );

    if (screen.length > 0) {
      return screen[0];
    }

    return null;
  } catch (error) {
    logsHandler.log(
      `Unable to get screen ${error.message}`,
      LOG.SEVERITY.ERROR,
      [LOG.TARGET.SENTRY, LOG.TARGET.WINSTON],
      LOG.TYPE.GENERAL
    );
    throw new Error(`Unable to get screen ${error.message}`);
  }
};

const getNextShow = async () => {
  try {
    const nextShow = await HeartbeatDB.getHeartbeat(
      ObjectNameDB.HEARTBEAT_NEXT_SHOW
    );

    if (nextShow.length > 0) {
      return nextShow[0];
    }

    return null;
  } catch (error) {
    logsHandler.log(
      `Unable to get next show ${error.message}`,
      LOG.SEVERITY.ERROR,
      [LOG.TARGET.SENTRY, LOG.TARGET.WINSTON],
      LOG.TYPE.GENERAL
    );
    throw new Error(`Unable to get next show ${error.message}`);
  }
};
//* DB Helper methods end

const executablePaths = {
  CineCard: config.executablePaths.CineCard,
  CineAd: config.executablePaths.CineAd,
  CineGame: config.executablePaths.CineGame,
  Default: config.executablePaths.CineCard,
};

const getExecutablePath = (blockType, options = {}) => {
  const homeDir = path.resolve(os.homedir());
  if (executablePaths[blockType]) {
    return template(executablePaths[blockType], {
      homeDir: homeDir,
    });
  }
  return template(executablePaths['Default']);
};

const execBlocks = (block, options, callback) => {
  if (block) {
    const params = {
      path:
        options && options.executablePath
          ? options && options.executablePath
          : getExecutablePath(block.type, options),
      env: {
        CINEMATAZTIC_BLOCK_ID: block._id,
        CINEMATAZTIC_BLOCK_DURATION_SEC: block.duration,
        CINEMATAZTIC_SCREEN_ID: options.screen._id,
        LOG_DIR: '',
      },
      timeout:
        options && options.timeoutOverride
          ? options.timeoutOverride
          : block.duration || 35,
      options: options
    };
    processManager.spawnProcess(params, true, function (err, child) {
      if (err) {
        callback(err); 
      } else {
        child.on('exit', (code, signal) => {
          logsHandler.log(`on exit code: ${code}, signal: ${signal}`);
        });

        /**
         * Handle close (logs, optional 24V pulse back etc.)
         */
        child.on('close', (code, signal) => {
          logsHandler.log(`on close code: ${code}, signal: ${signal}`);
          callback(null, block);
        });

        child.unref();
        child.on('error', function (err) {
          logsHandler.log(`helper-err ${err}`);
        });
      }
    });
  } else {
    logsHandler.log(
      `Error in block execution: ${JSON.stringify(block)}`,
      LOG.SEVERITY.ERROR,
      [LOG.TARGET.SENTRY, LOG.TARGET.WINSTON],
      LOG.TYPE.GENERAL
    );
  }
};

const execShowBlocks = ({ show, target, screen }) => {
  if (show && show.blocks) {
    const runBlocks = show.blocks.map((block) => async (callback) => {

      const opts = { screen };
      if (block.type === 'CineGame') {
        if (!opts.pathOptions) opts.pathOptions = {};
      }

      execBlocks(block, opts, function (err, innerblock) {
        if (callback) {
          callback(err, innerblock);
        }
      });
    });

    runSeries(runBlocks, function (err, results) {
      if (err) logsHandler.log(`Error after executing blocks in series ${err}`);
      else
        logsHandler.log(`Result after executing blocks in series ${results}`);
    });
  } else {
    logsHandler.log(
      `Blocks do not exist`,
      LOG.SEVERITY.ERROR,
      [LOG.TARGET.SENTRY, LOG.TARGET.WINSTON],
      LOG.TYPE.GENERAL
    );
  }
};

const execShow = async () => {
  const auth = await authHandler('auth', {
    action: 'getToken',
  });
  const player = await dchpHandler({
    action: 'getPlayer',
  });

  //* Parameters comprising of access_token, and message body for logs post request
  logsHandler.log(
    `Executing show on client ${player ? player['clientID'] : 'unknown'
    } for device ${player ? player['_id'] : 'unknown'} in market ${player ? player['market'] : 'unknown'
    }`,
    LOG.SEVERITY.NOTICE,
    [LOG.TARGET.CLOUD, LOG.TARGET.WINSTON],
    LOG.TYPE.UNITY
  );

  const show = await getNextShow();
  // target 0 or any target receive from socket target: message.target,
  const target = 0;
  if (show && show?.blocks && show?.blocks.length === 0) {
    logsHandler.log(
      `Error: no show found/no execution blocks found`,
      LOG.SEVERITY.ERROR,
      [LOG.TARGET.SENTRY, LOG.TARGET.WINSTON],
      LOG.TYPE.GENERAL
    );
    return;
  }

  const screen = await getScreen();

  execShowBlocks({
    show,
    target,
    screen,
  });
};

module.exports = {
  setShow,
  upsertShow,
  deleteShow,
  execShow,
  getScreen,
};
