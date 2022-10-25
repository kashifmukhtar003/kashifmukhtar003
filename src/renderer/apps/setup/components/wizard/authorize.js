import React, { useEffect, useState, useRef } from 'react';
import logo from 'Images/logo_all_white.png';
import loader from 'Images/loader.gif';

const Authorize = (props) => {
  let authTimer = useRef(null);
  let [authorization, setAuthorization] = useState({
    accessToken: null,
    refreshToken: null,
    statusCode: null,
  });
  const [machineId, setMachineId] = useState('');

  useEffect(() => {
    startAuthorizationProcess();

    return () => {
      clearInterval(authTimer.current);
    };
  }, []);

  const getMachineId = async () => {
    const response = await window.api.send('osConfig', { action: 'machineId' }); // get machineId from main process -> realm db
    setMachineId(response);
    return response;
  };

  const authorizeRequest = async (mId) => {
    try {
      const authenticationResponse = await window.api.send('auth', {
        action: 'authorize',
        params: mId,
      }); // authorization process: REST API to auth
      setAuthorization(authenticationResponse);
    } catch (err) {
      window.api.send('logs', {
        action: 'createLog', params: {
          message: "Error in Authorization" + err,
          severity: 'error',
          target: ['sentry', 'winston'],
          type: 'general'
        }
      });
    }
  };

  const startAuthorizationProcess = async () => {
    const mId = await getMachineId();
    authTimer.current = setInterval(() => authorizeRequest(mId), 10000);
  };

  const closeWindow = () => {
    clearInterval(authTimer.current);
    setTimeout(async () => {
      if (window.api.close) {
        await window.api.close('auth', { action: 'close' });
      }
    }, 10000);
  };

  const displayMac = () => {
    return (
      <p className="mt-0 mb-0 text-lg" key={machineId}>
        This player has ID: {machineId}
      </p>
    );
  };

  const displayLogo = () => {
    return <img className="h-48 w-96 h-auto mt-20" src={logo} />;
  };

  const displayLoader = (text) => {
    return (
      <div className="mt-8 w-96 text-center">
        <img className="block mx-auto" src={loader} alt="loading..." />
        <p>{text}</p>
      </div>
    );
  };

  const renderElements = () => {
    if (!authorization?.statusCode) {
      return (
        <div className="h-full w-full bg-black text-white flex justify-center items-center h-full w-full relative flex-col">
          <h4 className="font-medium leading-tight text-4xl mt-0 mb-2">
            Setting up device
          </h4>
          <p className="mt-0 mb-4 text-lg">
            {' '}
            This device has not been configured yet.
          </p>
          <p className="text-lg">
            Please wait while the initial configuration is being loaded.
          </p>
          <p className="text-lg">
            Go to{' '}
            <a
              href="http://install.cinemataztic.com"
              target="_blank"
              className="underline"
            >
              install.cinemataztic.com
            </a>{' '}
            for further instructions.
          </p>
          {displayMac()}
          <hr className="" />
          {displayLoader('Connecting to cloud...')}
          {displayLogo()}
        </div>
      );
    } else if (authorization.statusCode == 401) {
      return (
        <div className="h-full w-full bg-black text-white flex justify-center items-center h-full w-full relative flex-col">
          <h4 className="font-medium leading-tight text-4xl mt-0 mb-2">
            Authorize player
          </h4>
          <p className="mt-0 mb-4 text-lg">
            This player has not been authorized.
          </p>
          <p className="text-lg">
            Go to{' '}
            <a
              href="http://install.cinemataztic.com"
              target="_blank"
              className="underline"
            >
              install.cinemataztic.com
            </a>{' '}
            for further instructions.
          </p>
          {displayMac()}
          <hr className="" />
          {displayLoader('Waiting for authorization...')}
          {displayLogo()}
        </div>
      );
    } else if (authorization.statusCode == 404 || Object.keys(props).length > 0 ? !props?.isScreenAttached : false) {
      return (
        <div className="h-full w-full bg-black text-white flex justify-center items-center h-full w-full relative flex-col">
          <h4 className="font-medium leading-tight text-4xl mt-0 mb-2">
            Connect player to screen
          </h4>
          <p className="mt-0 mb-4 text-lg">
            Screen settings will be downloaded once connected.
          </p>
          <p className="text-lg">
            Go to{' '}
            <a
              href="http://install.cinemataztic.com"
              target="_blank"
              className="underline"
            >
              install.cinemataztic.com
            </a>{' '}
            for further instructions.
          </p>
          {displayMac()}
          <hr className="" />
          {displayLoader('Waiting for settings...')}
          {displayLogo()}
        </div>
      );
    } else if (authorization.statusCode < 400) {
      closeWindow();
      return (
        <div className="h-full w-full bg-black text-white flex justify-center items-center h-full w-full relative flex-col">
          <h4 className="font-medium leading-tight text-4xl mt-0 mb-2">
            Setup has been completed
          </h4>
          {/* <p className="mt-0 mb-4 text-lg">You can press 'Alt + CommandOrControl + S'  to close this window.  </p> */}
          {displayMac()}
          {displayLoader('Please wait for few more seconds...')}
          {displayLogo()}
        </div>
      );
    } else {
      return (
        <div className="h-full w-full bg-black text-white flex justify-center items-center h-full w-full relative flex-col">
          <h4 className="font-medium leading-tight text-4xl mt-0 mb-2">
            Unknown error
          </h4>
          <p className="mt-0 mb-4 text-lg">
            Status Code: {authorization.statusCode}
          </p>
          {displayMac()}
        </div>
      );
    }
  };

  return (
    <div className="h-full w-full bg-black text-white flex justify-center items-center h-full w-full relative flex-col">
      {renderElements()}
    </div>
  );
};

export default Authorize;
