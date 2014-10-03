var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require("socket.io").listen(server),
    sha1 = require('sha1');

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

app.configure(function () {
    app.set('port', process.env.OPENSHIFT_NODEJS_PORT || 80);
    app.set('ipaddr', process.env.OPENSHIFT_NODEJS_IP || "168.235.152.38");
    app.use(express.json());
    app.use(express.urlencoded());
    app.use(express.methodOverride());
    app.use(express.static(__dirname + '/public'));
    app.use('/components', express.static(__dirname + '/components'));
    app.use('/js', express.static(__dirname + '/js'));
    app.use('/icons', express.static(__dirname + '/icons'));
});

app.get('/', function (req, res) {
    res.render('index.html');
});

server.listen(app.get('port'), app.get('ipaddr'), function () {
    console.log('Express server listening on  IP: ' + app.get('ipaddr') + ' and port ' + app.get('port'));
});

io.sockets.on("connection", function (socket) {
    var lastImageSend = 0;

    //emits newuser
    socket.on("joinreq", function (name, pass) {
        var roomID = sha1(pass);
        var allowJoin = 1;
        var denyReason = null;

        //get the client list and push it to the client
        var clientsInRoom = findClientsSocketByRoomId(roomID);
        var clientsInRoomArray = [];
        var clientsInRoomArrayScrubbed = [];
        for(var i = 0; i < clientsInRoom.length; i++) {
            clientsInRoomArray.push(clientsInRoom[i].nickname);
            /* the scrubbed one has the sanitized version as used in the username
             * classes for typing, so we can check and avoid collisions.
             */
            clientsInRoomArrayScrubbed.push(clientsInRoom[i].nickname.replace(/\W/g, ''));
        }

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
            socket.emit("joinconfirm");

            //add them to the user list since they're now a member
            clientsInRoomArray.push(socket.nickname);
            io.sockets.in(roomID).emit("newuser", name);
            socket.emit("userlist", clientsInRoomArray);
        } else {
            socket.emit("joinfail", denyReason);
        }

    });

    //emits goneuser
    socket.on('disconnect', function () {
        io.sockets.in(socket.roomIn).emit("goneuser", socket.nickname);
    });

    //emits chat
    socket.on("textsend", function (msg) {
        var type = 0;
        var name = socket.nickname;
        var data = [type, name, msg];
        io.sockets.in(socket.roomIn).emit("chat", data);
    });

    //emits data
    socket.on("datasend", function (msg) {
        var currTime = (new Date).getTime();
        if(currTime - lastImageSend < 5000) {
            socket.emit("ratelimit");
        } else {
            lastImageSend = currTime;
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