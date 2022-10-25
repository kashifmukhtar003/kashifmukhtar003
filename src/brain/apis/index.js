const fetch = require('electron-fetch').default;
const { config } = require('../common/index');
const { api } = require('../api');

const getHeaders = async (access_token) => {
  const headers = {
    'User-Agent': config.headers['User-Agent'],
    'market-slug': config.headers['market-slug'],
    'Content-Type': config.headers['Content-Type'],
    Authorization: `Bearer ${access_token}`,
  };
  return headers;
};

const APIS = {
  getHeartbeat: async (data, access_token) => {
    const headers = await getHeaders(access_token);
    const params = {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    };
    const result = await fetch(api.player_screen, params);
    return result;
  },
  authorize: async (data) => {
    const headers = await getHeaders();
    const params = {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    };
    const result = await fetch(api.auth, params);
    return result;
  },
  playerLog: async (data, access_token) => {
    const headers = await getHeaders(access_token);
    const params = {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    };
    const result = await fetch(api.player_log, params);
    return result;
  },
};

module.exports = APIS;
