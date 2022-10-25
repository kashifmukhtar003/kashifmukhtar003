const authHandler = require('../controllers/auth');
const connectivityHandler = require('../controllers/connectivity');
const heartbeatHandler = require('../controllers/heartbeat');
const logsHandler = require('../controllers/logs');
const { config, LOG } = require('../common');
const { internalTCPServer } = require('../tcp-listener/index');

let timerId = null;
let heartBeatLastExecution = new Date();
let heartBeatDelay = null;
let tcpInternal = null;

//* Initialize heartbeat
async function startHeartbeat(mainWindow) {
  try {
    heartBeatLastExecution = new Date();

    mainWindow.webContents.send(
      'heartbeatConfig',
      await heartbeatHandler({ action: 'startHeartbeat' })
    );
  } catch (error) {
    logsHandler.log(`Unable to start heartbeat process  : ${error.message}`, LOG.SEVERITY.ERROR, [LOG.TARGET.SENTRY, LOG.TARGET.WINSTON], LOG.TYPE.GENERAL);
    throw new Error(`Unable to start heartbeat process ${error.message}`);
  }
}

//* Initialize connectivity
async function getConnectivity(mainWindow) {
  try {
    mainWindow.webContents.send(
      'connectivity',
      await connectivityHandler({ action: 'getConnectivity' })
    );
  } catch (error) {
    logsHandler.log(`Unable to start connectivity process  : ${error.message}`, LOG.SEVERITY.ERROR, [LOG.TARGET.SENTRY, LOG.TARGET.WINSTON], LOG.TYPE.GENERAL);
    throw new Error(`Unable to start connectivity process ${error.message}`);
  }
}

async function mainProcess(mainWindow) {
  try {
    // main process
    const now = new Date();

    // Get Connectivity
    getConnectivity(mainWindow);

    // Get Auth
    const auth = await authHandler('auth', {
      action: 'getToken',
    });

    if (auth) {
      const { heartbeatInterval } = auth;
      heartBeatDelay = heartbeatInterval;
    } else {
      heartBeatDelay = 20;
    }

    // Start Heartbeat
    if (now - heartBeatLastExecution >= heartBeatDelay) {
      startHeartbeat(mainWindow);
    }

    // Start Internal Server
    if (!tcpInternal) {
      tcpInternal = internalTCPServer.listen(process.env.INTERNAL_TCP_SERVER_PORT, '127.0.0.1');
    }
  } catch (error) {
    logsHandler.log(`Unable to start main process  : ${error.message}`, LOG.SEVERITY.ERROR, [LOG.TARGET.SENTRY, LOG.TARGET.WINSTON], LOG.TYPE.GENERAL);
    throw new Error(`Unable to start main process ${error.message}`);
  }
}

function startProcess(mainWindow) {
  try {
    if (timerId) {
      clearInterval(timerId);
    }

    timerId = setInterval(() => mainProcess(mainWindow), 5000);
  } catch (error) {
    logsHandler.log(`Unable to start application process  : ${error.message}`, LOG.SEVERITY.ERROR, [LOG.TARGET.SENTRY, LOG.TARGET.WINSTON], LOG.TYPE.GENERAL);
    throw new Error(`Unable to start application process ${error.message}`);
  }
}

module.exports = startProcess;
