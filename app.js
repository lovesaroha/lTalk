/*  Love Saroha
    lovesaroha1994@gmail.com (email address)
    https://www.lovesaroha.com (website)
    https://github.com/lovesaroha  (github)
*/
"use strict";
var path = require('path');
var fs = require('fs');
var WebSocketServer = require('websocket').server;
var users = [];

// Define default app variables.
let server = require('http').createServer(handler);

// Port 3000.
const PORT = 3004;
console.log(`Server running at port ${PORT}`);
server.listen(PORT);

// Create the WebSocket server.
var socketServer = new WebSocketServer({
     httpServer: server,
     autoAcceptConnections: false
});

// On connection.
socketServer.on('request', function (request) {
     let connection = request.accept("json", request.origin);
     let emailAddress = request.resourceURL.query.email;
     if (isAlreadySaved(emailAddress)) {
          // Already saved.
          connection.sendUTF(JSON.stringify({ type: "alreadyOnline" }));
          return;
     }
     connection.emailAddress = emailAddress;
     users.push(connection);
     // Handle message.
     connection.on('message', function (message) {
          if (message.type === 'utf8') {
               let msg = JSON.parse(message.utf8Data);
               var connect = getConnectionByEmailAddress(msg.emailAddress);
               switch (msg.type) {
                    case "isOnline":
                         if (isAlreadySaved(msg.emailAddress)) {
                              connection.sendUTF(JSON.stringify({ type: "userOnline", emailAddress: msg.emailAddress }));
                         }
                         break;
                    case "message":
                         msg.name = connect.username;
                         msg.text = msg.text.replace(/(<([^>]+)>)/ig, "");
                         break;
               }
               if (msg.to) {
                    sendTo(msg.to, JSON.stringify(msg));
               }
          }
     });

     // On close.
     connection.on('close', function (reason, description) {
          for (let i = users.length - 1; i >= 0; i--) {
               if (users[i].emailAddress == connection.emailAddress) {
                    users.splice(i, 1);
               }
          }
     });
});

// Send to given user.
function sendTo(emailAddress, message) {
     for (let i = 0; i < users.length; i++) {
          if (users[i].emailAddress == emailAddress) {
               users[i].sendUTF(message);
               return;
          }
     }
}

// Get connection from email address.
function getConnectionByEmailAddress(emailAddress) {
     var connect = null;
     for (let i = 0; i < users.length; i++) {
          if (users[i].emailAddress == emailAddress) {
               connect = users[i];
               break;
          }
     }
     return connect;
}

// Check if user already saved.
function isAlreadySaved(emailAddress) {
     for (let i = 0; i < users.length; i++) {
          if (users[i].emailAddress == emailAddress) {
               return true;
          }
     }
     return false;
}

// Create http server and listen on port 3000.
function handler(request, response) {
     var filePath = './static' + request.url;
     if (filePath == './static/') { filePath = './static/index.html'; }
     // All the supported content types are defined here.
     var extname = String(path.extname(filePath)).toLowerCase();
     var mimeTypes = {
          '.html': 'text/html',
          '.js': 'text/javascript',
          '.css': 'text/css',
          '.png': 'image/png'
     };
     var contentType = mimeTypes[extname] || 'application/json';
     // Read file from server based on request url.
     fs.readFile(filePath, function (error, content) {
          if (error) {
               response.writeHead(500);
               response.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
          }
          else {
               response.writeHead(200, { 'Content-Type': contentType });
               response.end(content, 'utf-8');
          }
     });
}
