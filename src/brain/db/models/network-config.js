const networkConfigModel = {
  name: 'NetworkConfig',
  properties: {
    name: 'string',
    dhcp4: 'bool',
    dhcp4Overrides: 'DHCPOverride?',
    dhcp6: 'bool',
    dhcp6Overrides: 'DHCPOverride?',
    addresses: 'string?',
    gateway: 'string?',
    nameserverAddresses: 'string?',
  },
  primaryKey: 'name',
};

const dhcpOverridesModel = {
  name: 'DHCPOverride',
  embedded: true,
  properties: {
    _id: 'objectId',
    routeMetric: 'int?',
  },
};

const systemMacModel = {
  name: 'SystemMac',
  properties: {
    mac: 'string',
  },
  primaryKey: 'mac',
};

const networkInterfaceModel = {
  name: 'NetworkInterface',
  properties: {
    address: 'string',
    netmask: 'string',
    family: 'string',
    mac: 'string',
    internal: 'bool',
    cidr: 'string',
  },
};

const machineModel = {
  name: 'Machine',
  properties: {
    id: 'string',
  },
};

module.exports = {
  dhcpOverridesModel,
  networkConfigModel,
  systemMacModel,
  networkInterfaceModel,
  machineModel,
};
