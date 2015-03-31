var express = require('express'),
   https = require("https"),
   fs = require('fs');
   
/***
 *
 * This is for HTTP redirecting to HTTPS - if you're running this as HTTP, delete below until the closing comment block
 *
 ***/ 
var http = express();

// set up a route to redirect http to https
http.get('*',function(req,res){  
    res.redirect('https://freestep.net')
})

// have it listen on 80
http.listen(80);

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

var app = express();
var server = https.createServer(sslOptions, app);
var io = require("socket.io").listen(server);

app.configure(function () {
   app.set('port', process.env.OPENSHIFT_NODEJS_PORT || 443);
   app.set('ipaddr', process.env.OPENSHIFT_NODEJS_IP || "freestep.net");
   app.use(express.json());
   app.use(express.urlencoded());
   app.use(express.methodOverride());
   app.use(express.compress());
   app.use(express.static(__dirname + '/public'));
   app.use('/components', express.static(__dirname + '/components'));
});

//lets us get room memebers in socket.io >=1.0
function findClientsSocketByRoomId(roomId) {
   var res = [],
      room = io.sockets.adapter.rooms[roomId];
   if(room) {
      for(var id in room) {
         res.push(io.sockets.adapter.nsp.connected[id]);
      }
   }
   return res;
}

app.get('/', function (req, res) {
   res.render('index.html');
});

server.listen(app.get('port'), app.get('ipaddr'), function () {
   console.log('Express server listening on  IP: ' + app.get('ipaddr') + ' and port ' + app.get('port'));
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
      var clientsInRoom = findClientsSocketByRoomId(roomID);
      var clientsInRoomArray = [];
      var clientsInRoomArrayScrubbed = [];
      clientsInRoom.forEach(function (client){
         clientsInRoomArray.push(client.nickname);
         /* the scrubbed one has the sanitized version as used in the username
          * classes for typing, so we can check and avoid collisions.
          */
         clientsInRoomArrayScrubbed.push(client.nickname.replace(/\W/g, ''));
      });

      //check if the nickname exists
      if(clientsInRoomArrayScrubbed.indexOf(name.replace(/\W/g, '')) != -1) {
         denyReason = "Nickname is already taken.";
         allowJoin = 0;
      }

      if(allowJoin) {
         //now in the room
         socket.join(roomID);
         socket.nickname = name;
         socket.roomIn = roomID;

         //send the join confirmation to the client, alert the room, and push a user list
         socket.emit("joinConfirm");

         //add them to the user list since they're now a member
         clientsInRoomArray.push(socket.nickname);
         io.sockets.in(roomID).emit("newUser", name);
         socket.emit("userList", clientsInRoomArray);
      } else {
         socket.emit("joinFail", denyReason);
      }

   });

   //emits goneuser
   socket.on('disconnect', function () {
      io.sockets.in(socket.roomIn).emit("goneUser", socket.nickname);
   });

   //emits chat
   socket.on("textSend", function (msg) {
      //0 = text
      var type = 0;
      var name = socket.nickname;
      var data = [type, name, msg];
      io.sockets.in(socket.roomIn).emit("chat", data);
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
         var name = socket.nickname;
         var data = [type, name, msg];
         io.sockets.in(socket.roomIn).emit("chat", data);
      }
   });

   //emits typing
   socket.on("typing", function (typing) {
      io.sockets.in(socket.roomIn).emit("typing", [typing, socket.nickname]);
   });
});
