const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const wss = new WebSocket.Server({ port: 8080 });

const sessions = {};

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        const parsedMessage = JSON.parse(message);

        if (parsedMessage.type === 'join') {
            const sessionId = parsedMessage.sessionId || uuidv4();
            ws.sessionId = sessionId;
            ws.userName = parsedMessage.userName;

            if (!sessions[sessionId]) {
                sessions[sessionId] = { clients: [], code: '', files: {} };
            }

            sessions[sessionId].clients.push(ws);

            // Send the current code and user list to the new client
            ws.send(JSON.stringify({
                type: 'init',
                code: sessions[sessionId].code,
                users: sessions[sessionId].clients.map(client => client.userName),
                files: Object.keys(sessions[sessionId].files)
            }));

            // Notify all clients about the new user
            sessions[sessionId].clients.forEach(client => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'user_joined',
                        userName: ws.userName
                    }));
                }
            });

        } else if (parsedMessage.type === 'update') {
            const sessionId = ws.sessionId;
            const fileName = parsedMessage.fileName || 'Untitled';
            sessions[sessionId].code = parsedMessage.code;

            sessions[sessionId].clients.forEach(client => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'update',
                        code: parsedMessage.code
                    }));
                }
            });

            if (parsedMessage.fileName && sessions[sessionId].files[parsedMessage.fileName]) {
                fs.writeFile(path.join(__dirname, 'files', parsedMessage.fileName), parsedMessage.code, (err) => {
                    if (err) throw err;
                    console.log(`File ${parsedMessage.fileName} saved.`);
                });
            }
        } else if (parsedMessage.type === 'new_file') {
            const sessionId = ws.sessionId;
            const fileName = parsedMessage.fileName || 'Untitled';
            sessions[sessionId].files[fileName] = '';

            sessions[sessionId].clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'new_file',
                        fileName: fileName
                    }));
                }
            });

            fs.writeFile(path.join(__dirname, 'files', fileName), '', (err) => {
                if (err) throw err;
                console.log(`New file ${fileName} created.`);
            });
        } else if (parsedMessage.type === 'open_file') {
            const sessionId = ws.sessionId;
            const fileName = parsedMessage.fileName;
            const filePath = path.join(__dirname, 'files', fileName);

            if (fs.existsSync(filePath)) {
                fs.readFile(filePath, 'utf8', (err, data) => {
                    if (err) throw err;
                    ws.send(JSON.stringify({
                        type: 'open_file',
                        fileName: fileName,
                        code: data
                    }));
                });
            } else {
                console.log(`File ${fileName} does not exist.`);
            }
        }
    });

    ws.on('close', () => {
        const sessionId = ws.sessionId;
        if (sessionId && sessions[sessionId]) {
            sessions[sessionId].clients = sessions[sessionId].clients.filter(client => client !== ws);

            // Notify all clients about the user leaving
            sessions[sessionId].clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'user_left',
                        userName: ws.userName
                    }));
                }
            });

            if (sessions[sessionId].clients.length === 0) {
                delete sessions[sessionId];
            }
        }
    });
});

console.log('WebSocket server is running on ws://localhost:8080');
