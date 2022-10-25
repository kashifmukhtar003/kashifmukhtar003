// eslint-disable-next-line prefer-destructuring
const machineIdSync = require('node-machine-id').machineIdSync;
const lsbReleaseFs = require('lsb-release-fs');
const os = require('os');
const { api } = require('../../api');
const { config, LOG } = require('../../common');
const { HeartbeatDB, ObjectNameDB } = require('../db/helper');
const { execScript } = require('../../process-manager');
const logsHandler = require('../logs/index');
const authHandler = require('../auth/index');
const nextShowHandler = require('../show/index');
const dchpHandler = require('../dchp/index');
const { externalTCPServer } = require('../../tcp-listener/index');
const APIS = require('../../apis');

let tcpCuesPort = null;

function getOsInfo() {
  const lsbRelease = lsbReleaseFs();
  const osInfo = {
    platform: os.platform(),
    type: os.type() || null,
    release: os.release() || null,
    arch: os.arch() || null,
    cpus: os.cpus() || [],
    uptime: os.uptime() || null,
    freemem: os.freemem() || null,
    totalmem: os.totalmem() || null,
    loadavg: os.loadavg() || [],
    networkInterfaces: os.networkInterfaces() || [],
    userInfo: os.userInfo() || {},
    hostname: os.hostname() || null,
    machineId: machineIdSync({ original: true }),
    distribId: lsbRelease.DISTRIB_ID || null,
    distribRelease: lsbRelease.DISTRIB_RELEASE || null,
    distribCodename: lsbRelease.DISTRIB_CODENAME || null,
    distribDescription: lsbRelease.DISTRIB_DESCRIPTION || null,
  };
  return osInfo;
}

async function heartbeat(params = {}) {
  try {
    const data = {
      os: getOsInfo(), // Send OS information,
      playerVersion: config.appVersion,
    };

    const result = await APIS.getHeartbeat(data, params.access_token);
    if (result.ok) {
      const resultInJson = await result.json();
      if (!resultInJson?.player) {
        //No Player Found.
        await authHandler('auth', { action: 'deleteAuth' });
        throw new Error('Hearbeat failed No Player Found');
      }
      return {
        player: resultInJson.player ? resultInJson.player : null,
        hostname: resultInJson.hostname ? resultInJson.hostname : null,
        nextShow: resultInJson.nextShow ? resultInJson.nextShow : null,
        schedules: resultInJson.schedules ? resultInJson.schedules : null,
        defaultPlaylist: resultInJson.defaultPlaylist
          ? resultInJson.defaultPlaylist
          : null,
        screen: {
          // eslint-disable-next-line no-underscore-dangle
          _id: resultInJson._id,
          name: resultInJson.name,
          networkName: resultInJson.networkName,
          clusterName: resultInJson.clusterName,
          countryCode: resultInJson.countryCode
        },
        cineCardExecutable: resultInJson.cineCardExecutable
          ? resultInJson.cineCardExecutable
          : null,
        settingsProfile: resultInJson.settingProfile,
        isScreenAttached : true
      };
    }

    if (result.status === 404) {
      //No Screen Attached.
      logsHandler.log(`Hearbeat failed No Screen Attached (status code ${result.status})`, LOG.SEVERITY.NOTICE, [LOG.TARGET.WINSTON], LOG.TYPE.GENERAL);
      return { isScreenAttached : false }
    }
    logsHandler.log(`Hearbeat failed (status code ${result.status})`, LOG.SEVERITY.NOTICE, [LOG.TARGET.WINSTON], LOG.TYPE.GENERAL);
  } catch (error) {
    logsHandler.log(`Error in hearbeat call: ${error}`, LOG.SEVERITY.ERROR, [LOG.TARGET.SENTRY, LOG.TARGET.WINSTON], LOG.TYPE.GENERAL);
    return null;
  }
}

const saveScreen = async (screen) => {
  await HeartbeatDB.setHeartbeat(ObjectNameDB.HEARTBEAT_SCREEN, screen);
};

const saveExecutable = async (cineCardExecutable) => {
  await HeartbeatDB.setHeartbeat(
    ObjectNameDB.HEARTBEAT_CINE_CARD_EXECUTABLE,
    cineCardExecutable
  );
};

const executeDisplayChangeScript = async (heartBeatResponse) => {
  logsHandler.log('Display Configuration Change: Execution Started', LOG.SEVERITY.NOTICE, [LOG.TARGET.CLOUD, LOG.TARGET.WINSTON], LOG.TYPE.GENERAL);
  execScript(
    'change-display-settings.sh',
    [
      heartBeatResponse?.settingsProfile?.video?.screenResolution,
      heartBeatResponse?.settingsProfile?.video?.refreshRate,
    ],
    async (error, data) => {
      if (error) {
        logsHandler.log(`Display Configuration Change Error: ${error}`, LOG.SEVERITY.ERROR, [LOG.TARGET.CLOUD, LOG.TARGET.WINSTON], LOG.TYPE.GENERAL);
        return;
      } else {
        if (Buffer.isBuffer(data)) {
          logsHandler.log(`Display Configuration Change: execution successful: ${data.toString('utf8')}`);
        } else {
          logsHandler.log(`Display Configuration Change: execution successful: ${data}`);
        }
        if ((typeof data === 'number') & (data === 0)) {
          logsHandler.log('Display Configuration Change: Execution Ended', LOG.SEVERITY.NOTICE, [LOG.TARGET.CLOUD, LOG.TARGET.WINSTON], LOG.TYPE.GENERAL);
        }
      }
    }
  );
};

const executeNetworkChangeScript = async (heartBeatResponse) => {
  const netInterfaces = os.networkInterfaces();
  let connectionName = 'static';
  let interfaceName = 'enp4s0';

  //Script Execution Started
  logsHandler.log('Network Configuration Change: Execution Started', LOG.SEVERITY.NOTICE, [LOG.TARGET.CLOUD, LOG.TARGET.WINSTON], LOG.TYPE.GENERAL);
  execScript(
    'change-network-settngs.sh',
    [
      connectionName,
      interfaceName,
      heartBeatResponse?.settingsProfile?.network?.ipAddress,
      heartBeatResponse?.settingsProfile?.network?.primaryDNS,
      heartBeatResponse?.settingsProfile?.network?.routeMetric,
      heartBeatResponse?.settingsProfile?.network?.dhcp,
    ],
    async (error, data) => {
      if (error) {
        logsHandler.log(`Network Configuration Change Error: ${error}`, LOG.SEVERITY.ERROR, [LOG.TARGET.CLOUD, LOG.TARGET.WINSTON], LOG.TYPE.GENERAL);
        return;
      } else {
        if (Buffer.isBuffer(data)) {
          logsHandler.log(`Network Configuration Change: execution successful: ${data.toString('utf8')}`);
        } else {
          logsHandler.log(`Network Configuration Change execution successful: ${data}`);
        }
        if ((typeof data === 'number') & (data === 0)) {
          logsHandler.log('Network Configuration Change: Execution Ended', LOG.SEVERITY.NOTICE, [LOG.TARGET.CLOUD, LOG.TARGET.WINSTON], LOG.TYPE.GENERAL);
        }
      }
    }
  );
};

const startHeartBeatProcess = async (authToken) => {
  const heartBeatResponse = await heartbeat(authToken);
  if (!heartBeatResponse) return null;
  if(!heartBeatResponse.isScreenAttached) return heartBeatResponse;
  
  // updating show
  if(heartBeatResponse.nextShow){ 
    nextShowHandler({
      action: 'upsert',
      nextShow: heartBeatResponse.nextShow,
    });
  }else{
    nextShowHandler({
      action: 'delete'
    });
  }

  const configurationChangeDetectedPromise = dchpHandler({
    action: 'upsert',
    params: {
      player: {
        ...heartBeatResponse.player,
        hostname: heartBeatResponse.hostname,
      },
      settingsProfile: heartBeatResponse.settingsProfile,
    },
  });
  saveScreen(heartBeatResponse.screen);
  saveExecutable(heartBeatResponse.cineCardExecutable);
  // we also need to sto service ports. hostname can be store with screen instead of player.
  const { changeDetectedDisplay, changeDetectedNetwork } =
    await configurationChangeDetectedPromise;
  if(config.profileSettings){
    if (changeDetectedDisplay) {
      executeDisplayChangeScript(heartBeatResponse);
    }
    if (changeDetectedNetwork) {
      executeNetworkChangeScript(heartBeatResponse);
    }
  }
  if (!tcpCuesPort) {
    tcpCuesPort =
      heartBeatResponse.player && heartBeatResponse.player.tcpCuesPort
        ? heartBeatResponse.player.tcpCuesPort
        : process.env.DEFAULT_EXTERNAL_TCP_CUES_PORT;
    externalTCPServer.listen(tcpCuesPort);
  }

  return {
    isNextShowAvailable: heartBeatResponse.nextShow
      ? heartBeatResponse.nextShow
      : null,
    response: heartBeatResponse,
    changeDetectedDisplay: changeDetectedDisplay || false,
    changeDetectedNetwork: changeDetectedNetwork || false,
    isScreenAttached:heartBeatResponse.isScreenAttached || false
  };
};

const startHeartbeat = async () => {
  logsHandler.retryLog();

  //* Auth Token verification
  const verifiedAuthToken = await authHandler('auth', {
    action: 'getToken',
  });

  const heartbeatProcess = await startHeartBeatProcess(verifiedAuthToken);

  return heartbeatProcess;
};

module.exports = {
  startHeartbeat,
};
