const os = require('os');
const Realm = require('realm');
const { machineId } = require('node-machine-id');
const getmac = require('getmac');
const { NetWorkConfigDB, ObjectNameDB } = require('../db/helper');
const { deepCompare } = require('../../utils');

const setMachineId = async () => {
  const mId = await machineId();
  await NetWorkConfigDB.setNetworkConfig(ObjectNameDB.MACHINE_MACHINE, {
    id: mId,
  });
  return mId;
};

const getMachineId = async () => {
  const machineid = await NetWorkConfigDB.getNetworkConfig(
    ObjectNameDB.MACHINE_MACHINE
  );
  if (machineid.length > 0) {
    return machineid[0].id;
  }

  const newMachineId = await setMachineId();
  return newMachineId;
};

const setSystemMac = async () => {
  const input = { mac: getmac.default() };
  const listOfStoredMacs = await NetWorkConfigDB.getNetworkConfig(
    ObjectNameDB.NETWORKCONFIG_SYSTEM_MAC
  );
  const filteredMac = listOfStoredMacs?.filter(
    (item) => item.mac === input.mac
  );

  if (filteredMac.length > 0) {
    return filteredMac[0].mac;
  }
  await NetWorkConfigDB.deleteNetworkConfig(
    ObjectNameDB.NETWORKCONFIG_SYSTEM_MAC
  );
  await NetWorkConfigDB.setNetworkConfig(
    ObjectNameDB.NETWORKCONFIG_SYSTEM_MAC,
    input
  );
  return input.mac;
};

const getSystemMac = async () => {
  const systemMac = await NetWorkConfigDB.getNetworkConfig(
    ObjectNameDB.NETWORKCONFIG_SYSTEM_MAC
  );
  if (systemMac.length > 0) {
    return systemMac[0].mac;
  }
  const mac = await setSystemMac();
  return mac;
};

const getNetworkInterfaces = async () => {
  const rawNetworkInterface = await NetWorkConfigDB.getNetworkConfig(
    ObjectNameDB.NETWORKCONFIG_NETWORK_INTERFACE
  );
  const netInterfaces = os.networkInterfaces();
  let changeDetectedNetworkInterface = false;
  let nets = [];
  for (const name in netInterfaces) {
    const net = netInterfaces[name];
    nets = nets.concat(
      net.filter((address) => !address.internal && address.family === 'IPv4')
    );
  }

  if (Object.keys(rawNetworkInterface).length > 0) {
    const netInterface = JSON.parse(
      JSON.stringify(rawNetworkInterface[rawNetworkInterface.length - 1])
    );

    if (!deepCompare(nets[0], netInterface)) {
      changeDetectedNetworkInterface = true;
    }
  }
  await NetWorkConfigDB.deleteNetworkConfig(
    ObjectNameDB.NETWORKCONFIG_NETWORK_INTERFACE
  );
  await NetWorkConfigDB.setNetworkConfig(
    ObjectNameDB.NETWORKCONFIG_NETWORK_INTERFACE,
    nets[0]
  );
  return { netInterfaces, changeDetectedNetworkInterface };
};

const getNetworkConfig = async () => {
  const networkConfig = await NetWorkConfigDB.getNetworkConfig(
    ObjectNameDB.NETWORKCONFIG_NETWORK_CONFIG
  );
  return networkConfig;
};

const setNetworkConfig = async (arg) => {
  const { data } = arg;
  if (data.dhcp4Overrides) data.dhcp4Overrides['_id'] = Realm.BSON.ObjectID();
  if (data.dhcp6Overrides) data.dhcp6Overrides['_id'] = Realm.BSON.ObjectID();
  const config = await NetWorkConfigDB.getNetworkConfigByPrimaryKey(
    ObjectNameDB.NETWORKCONFIG_NETWORK_CONFIG,
    data.name
  );
  if (!config) {
    await NetWorkConfigDB.setNetworkConfig(
      ObjectNameDB.NETWORKCONFIG_NETWORK_CONFIG,
      data
    );
  } else {
    Object.keys(data).forEach((k) => {
      if (data[k] !== config[k]) config[k] = data[k];
    });
  }
  return config;
};

module.exports = {
  getSystemMac,
  setSystemMac,
  getNetworkInterfaces,
  getNetworkConfig,
  setNetworkConfig,
  getMachineId,
};
