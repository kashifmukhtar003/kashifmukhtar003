const net = require('net');
const JsonSocket = require('json-socket');
const nextShowHandler = require('../controllers/show/index');
const authHandler = require('../controllers/auth/index');
const dchpHandler = require('../controllers/dchp/index');
const osHandler = require('../controllers/os/index');
const logsHandler = require('../controllers/logs/index');

var internalTCPServer = net.createServer();
// Handle connections
internalTCPServer.on('connection', function (socket) {
    // This is a standard net.Socket
    let con = {
        remoteAddress: socket.remoteAddress,
        remoteFamily: socket.remoteFamily,
        remotePort: socket.remotePort
    }
    let ipPool = ['127.0.0.1', '::1/128'];
    socket = new JsonSocket(socket); // Now we've decorated the net.Socket to be a JsonSocket
    socket.on('data', async function (data) {
        logsHandler.log(`received data on socket ${data}`);
        //check access
        if (!ipPool.includes(con.remoteAddress)) {
            logsHandler.log(`UnAuthorized request for access token from ${con.remoteAddress}`);
            socket.sendMessage(
                JSON.stringify({
                    status: 'err',
                    message: 'UnAuthorized',
                }),
            );
            return;
        }
        let message;
        try {
            message = JSON.parse(data.toString().trim());
            switch (message.action.trim()) {
                case 'getDeviceInfo':
                    // get Access Token show function
                    const mac = await osHandler('osConfig', { action: 'systemMac' });
                    const auth = await authHandler('auth', { action: 'getToken', params: { mac: mac } });
                    const player = await dchpHandler({ action: 'getPlayer' });
                    const settingsProfile = await dchpHandler({ action: 'getSettingsProfile' });
                    const screen = await nextShowHandler({ action: 'getScreen' });

                    socket.sendMessage(
                        JSON.stringify({
                            status: 'success',
                            deviceId: player?._id,
                            screenId: screen?._id,
                            accessToken: auth?.access_token,
                            networkName: screen?.networkName,
                            market: player?.market,
                            countryCode: screen?.countryCode,
                            clusterName: screen?.clusterName,   
                        })
                    )
                    break;
                default:
                    logsHandler.log('Unknown message ');
                    socket.sendMessage(
                        JSON.stringify({
                            status: 'err',
                            message: 'unknown action',
                        }),
                    );
                    break;
            }
        } catch (error) {
            var errMessage = `Operation failed`;
            socket.sendMessage(
                JSON.stringify({
                    status: 'err',
                    message: errMessage + ":" + error,
                }),
            );
        }
    });
});

module.exports = internalTCPServer;