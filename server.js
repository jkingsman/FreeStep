var express = require('express'),
   http = require('http'),
   https = require("https"),
   fs = require('fs');
var methodOverride = require('method-override');
var compression    = require('compression');
var static         = require('serve-static');
var bodyParser     = require('body-parser');

var app = express();
var server;
var enable_ssl = false;

/***
 *
 * This is for HTTP redirecting to HTTPS - if you're running this as HTTP, delete below until the closing comment block
 *
 ***/ 
if (enable_ssl === true) {
var httpapp = express();

// set up a route to redirect http to https
httpapp.get('*',function(req,res){  
    res.redirect('https://freestep.net')
})

// have it listen on 80
httpapp.listen(80);

/***
 *
 * This is for HTTP redirecting to HTTPS - if you're running this as HTTP, delete above until the opening comment block
 *
 ***/ 

var privateKey = fs.readFileSync('ssl/server.key').toString();
var certificate = fs.readFileSync('ssl/freestep_net.crt').toString();
var ca = fs.readFileSync('ssl/COMODO.ca-bundle').toString();

var sslOptions = {
    key: fs.readFileSync('ssl/server.key'),
    cert: fs.readFileSync('ssl/freestep_net.crt'),
    ca: fs.readFileSync('ssl/COMODO.ca-bundle')
};
server = https.createServer(sslOoptions, app);
} else {
   server = http.createServer(app);
}

var io = require("socket.io").listen(server);

app.set('port', process.env.OPENSHIFT_NODEJS_PORT || 3000);
app.set('ipaddr', process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended : false }));
app.use(methodOverride());
app.use(compression());
app.use(static(__dirname + '/public'));
app.use('/components', static(__dirname + '/components'));

//lets us get room memebers in socket.io >=1.0
function findClientsSocketByRoomId (roomId, callback) {
   // Old Way
   // var room = io.sockets.adapter.rooms[roomId];
   // if(room) {
   //    for(var id in room) {
   //       res.push(io.sockets.adapter.nsp.connected[id]);
   //    }
   // }
   // return res;

   var res = [];
   io.of('/').in(roomId).clients(function (error, clients) {
      if (error) { return callback(error); }
      clients.forEach(function (client) {
         // Gets the socket
         //io.sockets.sockets[client];
         res.push(client);
      });
      callback(undefined, res);
   });

}

app.get('/', function (req, res) {
   res.render('index.html');
});

server.listen(app.get('port'), app.get('ipaddr'), function () {
   console.log('Express server listening on ' + app.get('ipaddr') + ':' + app.get('port'));
});

// Handles Socket Data Storage in Memory
// Looking for persistent/Redis support? See below
// https://github.com/socialtables/socket.io-store
//
// Example Data
// socket_data = {
//   '9evVFCugeYJWs6wFAAAA' : {
//     'nickname' : 'bob',
//     'roomIn'   : 'main'
//   }
//   '9evVFCugeYJWs6wFAAAA' : {
//     'nickname' : 'bob',
//     'roomIn'   : 'main'
//   }
// };
var socket_data = {};
io.use(function (socket, next) {
   // Initialize
   socket_data[socket.id] = {};
   socket.get = function (key) {
      console.log('GET', key);
      return socket_data[socket.id][key];
   };
   socket.set = function (key, value) {
      console.log('SET', key, value);
      socket_data[socket.id][key] = value;
   };
   next();
});

io.sockets.on("connection", function (socket) {
   var lastImageSend = 0;
   var isRateLimited = 1;

   //emits newuser
   socket.on("joinReq", function (name, room, password) {
      var roomID = room + password;
      var roomPassword = password;
      var allowJoin = 1;
      var denyReason = null;

      //get the client list and push it to the client
      findClientsSocketByRoomId(roomID, function (error, clientsInRoom) {
         if (error) { throw error; }

         var clientsInRoomArray = [];
         var clientsInRoomArrayScrubbed = [];
         clientsInRoom.forEach(function (client) {
            clientsInRoomArray.push(io.sockets.sockets[client].get('nickname'));
            /* the scrubbed one has the sanitized version as used in the username
             * classes for typing, so we can check and avoid collisions.
             */
            clientsInRoomArrayScrubbed.push(io.sockets.sockets[client].get('nickname').replace(/\W/g, ''));
         });

         //check if the nickname exists
         if(clientsInRoomArrayScrubbed.indexOf(name.replace(/\W/g, '')) != -1) {
            denyReason = "Nickname is already taken.";
            allowJoin = 0;
         }

         if(allowJoin) {
            //now in the room
            socket.join(roomID);
            socket.set('nickname', name);
            socket.set('roomIn', roomID);

            //send the join confirmation to the client, alert the room, and push a user list
            socket.emit("joinConfirm");

            //add them to the user list since they're now a member
            clientsInRoomArray.push(socket.get('nickname'));
            io.sockets.in(roomID).emit("newUser", name);
            socket.emit("userList", clientsInRoomArray);
         } else {
            socket.emit("joinFail", denyReason);
         }


      });
   });

   //emits goneuser
   socket.on('disconnect', function () {
      io.sockets.in(socket.get('roomIn')).emit("goneUser", socket.get('nickname'));
      delete socket_data[socket.id];
   });

   //emits chat
   socket.on("textSend", function (msg) {
      //0 = text
      var type = 0;
      var name = socket.get('nickname');
      var data = [type, name, msg];
      io.sockets.in(socket.get('roomIn')).emit("chat", data);
   });
   
    //lets admins un-ratelimit themselves for data
   socket.on("unRateLimit", function () {
      isRateLimited = 0;
   });

   //emits data
   socket.on("dataSend", function (msg) {
      var currTime = Date.now();
      if(((currTime - lastImageSend) < 5000) && isRateLimited) {
         //it's been less than five seconds; no data for you!
         socket.emit("rateLimit");
      } else {
         lastImageSend = currTime;
         //1 = image
         var type = 1;
         var name = socket.get('nickname');
         var data = [type, name, msg];
         io.sockets.in(socket.get('roomIn')).emit("chat", data);
      }
   });

   //emits typing
   socket.on("typing", function (typing) {
      io.sockets.in(socket.get('roomIn')).emit("typing", [typing, socket.get('nickname')]);
   });
});
