const { ObjectNameDB, HeartbeatDB } = require('../db/helper');
const { deepCompare } = require('../../utils');
const logsHandler = require('../logs/index');
const { config, LOG } = require('../../common');

const updateSettingsProfile = async (profile) => {
  await HeartbeatDB.setHeartbeat(
    ObjectNameDB.HEARTBEAT_SETTINGS_PROFILE,
    profile
  );
};

const fetchRealmSettingsProfile = async () => {
  const profile = await HeartbeatDB.getHeartbeat(
    ObjectNameDB.HEARTBEAT_SETTINGS_PROFILE
  );
  return profile.length > 0 ? profile[0] : {};
};

const handleProfileSettings = async (newProfile) => {
  const oldProfile = await fetchRealmSettingsProfile();
  let changeDetectedDisplay = false;
  let changeDetectedNetwork = false;

  if (!deepCompare(oldProfile, newProfile)) {
    await updateSettingsProfile(newProfile);
    // execute script function here
  }

  if (
    oldProfile.screenResolution !== newProfile.screenResolution ||
    oldProfile.refreshRate !== newProfile.refreshRate
  ) {
    changeDetectedDisplay = true;
    // execute script function here
  }

  // network Settings Change
  if (
    oldProfile.dhcp !== newProfile.dhcp ||
    oldProfile.ipAddress !== newProfile.ipAddress ||
    oldProfile.routeMetric !== newProfile.routeMetric ||
    oldProfile.primaryDNS !== newProfile.primaryDNS ||
    oldProfile.secondaryDNS !== newProfile.secondaryDNS
  ) {
    changeDetectedNetwork = true;
    // execute script function here
  }

  return { changeDetectedDisplay, changeDetectedNetwork };
};

const upsert = async (arg) => {
  if (arg.params.player) {
    await HeartbeatDB.setHeartbeat(
      ObjectNameDB.HEARTBEAT_PLAYER,
      arg.params.player
    );
  }
  let changeDetectedDisplay = false;
  let changeDetectedNetwork = false;

  if (arg.params.settingsProfile) {
    const destructuredProfile = {
      _id: arg.params.settingsProfile._id,
      name: arg.params.settingsProfile.name,
      type: arg.params.settingsProfile.type,
      ...arg.params.settingsProfile.video,
      ...arg.params.settingsProfile.network,
      ipAddress:
        arg.params.settingsProfile.network &&
          arg.params.settingsProfile.network.ipAddress
          ? arg.params.settingsProfile.network.ipAddress
          : '',
      primaryDNS:
        arg.params.settingsProfile.network &&
          arg.params.settingsProfile.network.primaryDNS
          ? arg.params.settingsProfile.network.primaryDNS
          : '',
      secondaryDNS:
        arg.params.settingsProfile.network &&
          arg.params.settingsProfile.network.secondaryDNS
          ? arg.params.settingsProfile.network.secondaryDNS
          : '',
    };
    const changeDetected = await handleProfileSettings(destructuredProfile);
    changeDetectedDisplay = changeDetected.changeDetectedDisplay;
    changeDetectedNetwork = changeDetected.changeDetectedNetwork;
  }
  return { changeDetectedDisplay, changeDetectedNetwork };
};

const getPlayer = async () => {
  try {
    const player = await HeartbeatDB.getHeartbeat(
      ObjectNameDB.HEARTBEAT_PLAYER
    );
    if (player.length > 0) {
      return player[0];
    }
    return null;
  } catch (error) {
    logsHandler.log(`Unable to get player: ${error}`, LOG.SEVERITY.ERROR, [LOG.TARGET.SENTRY, LOG.TARGET.WINSTON], LOG.TYPE.GENERAL);
    throw new Error(`Unable to get player ${error.message}`);
  }
};

const deletePlayer = async () => {
  await HeartbeatDB.deleteHeartbeat(ObjectNameDB.HEARTBEAT_PLAYER);
};

module.exports = {
  upsert,
  getPlayer,
  deletePlayer,
  fetchRealmSettingsProfile,
};
