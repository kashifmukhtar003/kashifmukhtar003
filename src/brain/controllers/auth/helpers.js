const Realm = require('realm');
const jwt = require('jsonwebtoken');
const { AuthDB, ObjectNameDB } = require('../db/helper');
const osHandler = require('../os');
const APIS = require('../../apis');

const getAuth = async () => {
  const auth = await AuthDB.getAuth(ObjectNameDB.AUTH_AUTH);
  return auth[0];
};

const setAuth = async (data) => {
  await AuthDB.setAuth(ObjectNameDB.AUTH_AUTH, data);
};

const deleteAuth = async () => {
  await AuthDB.deleteAuth(ObjectNameDB.AUTH_AUTH);
}

const isTokenExpired = async () => {
  let isTokenExpiredFlag = false;
  const auth = await getAuth();
  if (auth) {
    const token = auth.access_token;
    if (token) {
      const expiry = jwt.decode(token)?.exp;
      if (expiry) {
        const expiryTime = new Date(expiry * 1000);
        const currentTime = new Date();
        // subtracting 15mins from expiry time
        const mins = 15;
        if (expiryTime.getTime() - mins * 60000 < currentTime.getTime()) {
          isTokenExpiredFlag = true;
        }
      }
    }
  }
  return isTokenExpiredFlag;
};

const isAuthorized = async () => {
  let isAuthorizedFlag = false;
  const auth = await getAuth();
  if (auth) {
    isAuthorizedFlag = true;
  }
  return isAuthorizedFlag;
};

// authorize and save token
async function authorize(params) {
 try {
    // body
    const data = {
      type: 'device',
      deviceType: 'player',
      clientID: params.machineId,
    };

    const result = await APIS.authorize(data);

    if (result.ok) {
      const resultInJson = await result.json();
      const res = {
        _id: Realm.BSON.ObjectID(),
        status_code: resultInJson.access_token ? result.status : 401,
        access_token: resultInJson.access_token
          ? resultInJson.access_token
          : '',
        refresh_token: resultInJson.refresh_token
          ? resultInJson.refresh_token
          : '',
        status: 'connected',
        heartbeatInterval: resultInJson.heartbeatInterval,
        statusCode: resultInJson.access_token ? result.status : 401,
      };   
      if(res.status_code === 200){
        await setAuth(res);
      }
      return res;
    }else{
      return{
        statusCode: result.status,
      }
    }
  } catch (error) {
    throw new Error(`Error in authorization response: ${error}`);
  }
}

// this method checks that authorization process is done yet or not
const getToken = async () => {
  try {
    let authToken = null;
    if ((await isTokenExpired()) || !(await isAuthorized())) {
      // Get Machine ID from realm
      const machineId = await osHandler('osConfig', { action: 'machineId' });
      authToken = await authorize({ machineId });
    } else {
      authToken = await getAuth();
    }
    return authToken;
  } catch (error) {
    throw new Error(`Unable to verify authorization process: ${error}`);
  }
};

module.exports = {
  authorize,
  getToken,
  isTokenExpired,
  isAuthorized,
  getAuth,
  deleteAuth
};
