import React, { useEffect, useState, useRef } from 'react';
import Authorize from 'renderer/apps/setup/components/wizard/authorize';

const Root = () => {
  const [showSystemInfo, setShowSystemInfo] = useState(true);
  const [connectivity, setConnectivity] = useState(null);
  const [responseHeartbeat, setResponseHeartbeat] = useState({});
  const [networkInterfaces, setNetworkInterfaces] = useState([]);
  const [heartbeatTime, setHeartbeatTime] = useState(0);
  const [lastHeartbeatTime, setLastHeartbeatTime] = useState(new Date());
  const [lastConfigurationChangeDetected, setLastConfigurationChangeDetected] =
    useState(0);
  const [
    lastConfigurationChangeDetectedTime,
    setLastConfigurationChangeDetectedTime,
  ] = useState(new Date());
  const [lastNetInterfacesChangeDetected, setLastNetInterfacesChangeDetected] =
    useState(0);
  const [
    lastNetInterfacesChangeDetectedTime,
    setLastNetInterfacesChangeDetectedTime,
  ] = useState(new Date());
  const isHeartbeatCallInProgress = useRef(false);
  const heartbeat = useRef(null);

  useEffect(() => {
    const int2 = setInterval(() => {
      setLastNetInterfacesChangeDetected(
        new Date().getMinutes() -
        lastNetInterfacesChangeDetectedTime.getMinutes()
      );
    }, 1000);
    return () => {
      clearInterval(int2);
    };
  }, [lastNetInterfacesChangeDetectedTime]);

  useEffect(() => {
    const int1 = setInterval(() => {
      setLastConfigurationChangeDetected(
        new Date().getMinutes() -
        lastConfigurationChangeDetectedTime.getMinutes()
      );
    }, 1000);
    return () => {
      clearInterval(int1);
    };
  }, [lastConfigurationChangeDetectedTime]);

  useEffect(() => {
    const int = setInterval(() => {
      setHeartbeatTime(
        new Date().getMinutes() - lastHeartbeatTime.getMinutes()
      );
    }, 1000);
    return () => {
      clearInterval(int);
    };
  }, [lastHeartbeatTime]);

  useEffect(() => {
    const connect = async () => {
      await window.api.getConnectivity((_event, value) => {
        setConnectivity(value);
      });
    };
    setTimeout(() => {
      setConnectivity(null);
      connect();
    }, 5000);
  }, []);

  useEffect(() => {
    const setup = async () => {
      // Fetch network interfaces from main process
      const netInterfaces = await window.api.send('osConfig', {
        action: 'networkInterfaces',
      });
      let nets = [];
      for (const name in netInterfaces.netInterfaces) {
        const net = netInterfaces.netInterfaces[name];
        nets = nets.concat(
          net.filter(
            (address) => !address.internal && address.family === 'IPv4'
          )
        );
      }
      if (netInterfaces?.changeDetectedNetworkInterface) {
        setLastNetInterfacesChangeDetectedTime(new Date());
      }
      setNetworkInterfaces(nets);
    };
    setup();
    startHeartbeatProcess();
  }, []);

  const startHeartbeatProcess = async () => {
    if (isHeartbeatCallInProgress.current) return;

    isHeartbeatCallInProgress.current = true;

    await window.api.getHeartBeatConfig((_event, value) => {
      heartbeat.current = value;
      setLastHeartbeatTime(new Date());
      setResponseHeartbeat(heartbeat.current?.response);
      if (heartbeat.current?.changeDetectedDisplay) {
        setLastConfigurationChangeDetectedTime(new Date());
      }
      if (heartbeat.current?.changeDetectedNetwork) {
        setLastNetInterfacesChangeDetectedTime(new Date());
      }
      if (heartbeat.current?.response?.player) {
        setShowSystemInfo(heartbeat.current?.response?.player?.showSystemInfo);
      }
    });

    isHeartbeatCallInProgress.current = false;
  };

  return (
    <div className="text-white flex justify-center items-center h-full w-full relative">
      {connectivity?.isOnline && <>
        {(!connectivity?.isAuthorized || !responseHeartbeat?.isScreenAttached) &&
          <Authorize isScreenAttached={responseHeartbeat?.isScreenAttached} />
        }
      </>}
      {showSystemInfo && (
        <div className="absolute bottom-12 flex justify-between pl-10 pr-10 w-full">
          <div className="flex">
            <div className="text-gray-600">
              <div>
                <strong>Heartbeat</strong>
                <p>{heartbeatTime} mins ago</p>
                <strong>Configuration</strong>
                <p>{lastConfigurationChangeDetected} mins ago</p>
              </div>
            </div>
            <div className="text-gray-600 ml-6">
              <strong>Status</strong>
              <p>
                {connectivity?.isOnline ? 'Online' : 'Offline'}
                <br />
                {connectivity?.isAuthorized ? 'Authorized' : 'Un-Authorized'}
                <br />
                {connectivity?.isAuthorized && connectivity?.isTokenExpired
                  ? 'Token Expired'
                  : ''}
              </p>
            </div>
          </div>
          <div>
            <div className="text-gray-600 flex space-x-8">
              <div className="text-gray-600">
                <strong>Network</strong>
                <div className="space-y-1">
                  {networkInterfaces.map((net, idx) => (
                    <div key={idx}>
                      <p>{net.address}</p>
                      <p>{net.mac}</p>
                      <p>{lastNetInterfacesChangeDetected} mins ago</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-gray-600">
                <strong>System</strong>
                <p>hostname: {responseHeartbeat?.hostname}</p>
                <p>Market: {responseHeartbeat?.player?.market}</p>
                <p>screen: {responseHeartbeat?.settingsProfile?.name}</p>
                <p>status: {responseHeartbeat?.player?.status}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Root;
