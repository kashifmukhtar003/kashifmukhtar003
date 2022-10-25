const net = require('net');
const JsonSocket = require('json-socket');
const nextShowHandler = require('../controllers/show/index');
const logsHandler = require('../controllers/logs/index');

const externalTCPServer = net.createServer();
// Handle connections
externalTCPServer.on('connection', function (socket) {
    // This is a standard net.Socket
    socket = new JsonSocket(socket); // Now we've decorated the net.Socket to be a JsonSocket
    socket.on('data', function (data) {
        logsHandler.log(`received data on socket ${data}`);
        let message;
        try {
            message = JSON.parse(data.toString().trim());
            switch (message.action.trim()) {
                case 'showStart':
                    // call exec show function
                    logsHandler.log('exec show called');
                    nextShowHandler({ action: 'execShow' });
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
                    message: errMessage,
                }),
            );
        }
    });
});

module.exports = externalTCPServer;
