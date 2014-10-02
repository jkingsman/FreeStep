var express = require('express')
, app = express()
, server = require('http').createServer(app)
, io = require("socket.io").listen(server)
, sha1 = require('sha1');

//lets us get room memebers in socket.io >=1.0
function findClientsSocketByRoomId(roomId) {
	var res = [], room = io.sockets.adapter.rooms[roomId];
	if (room) {
		for (var id in room) {
			res.push(io.sockets.adapter.nsp.connected[id]);
		}
	}
	return res;
}

app.configure(function() {
	app.set('port', process.env.OPENSHIFT_NODEJS_PORT || 80);
	app.set('ipaddr', process.env.OPENSHIFT_NODEJS_IP || "drunkbroncos.com");
	app.use(express.json());
	app.use(express.urlencoded());
	app.use(express.methodOverride());
	app.use(express.static(__dirname + '/public'));
	app.use('/components', express.static(__dirname + '/components'));
	app.use('/js', express.static(__dirname + '/js'));
	app.use('/icons', express.static(__dirname + '/icons'));
});

app.get('/', function(req, res) {
	res.render('index.html');
});

server.listen(app.get('port'), app.get('ipaddr'), function(){
	console.log('Express server listening on  IP: ' + app.get('ipaddr') + ' and port ' + app.get('port'));
});

io.sockets.on("connection", function (socket) {
	//emits newuser
	socket.on("joinreq", function(name, pass) {
		var roomID = sha1(pass);
		
		if (1) {
			//join the room and let everyone know
			socket.emit("joinconfirm");
			
			//now in the room
			socket.join(roomID);
			socket.nickname = name;
			socket.roomIn = roomID;
			
			//get the client list and push it to the client
			var clientsInRoom = findClientsSocketByRoomId(roomID);
			var clientsInRoomArray = [];
			for(var i = 0; i < clientsInRoom.length; i++) {
				clientsInRoomArray.push(clientsInRoom[i].nickname);
			}
			
			//snd the join confirmation to the client, alert the room, and push a user list
			socket.emit("joinconfirm");
			
			io.sockets.in(roomID).emit("newuser", name);
			socket.emit("userlist", clientsInRoomArray);
		}
		
	});
	
	//emits goneuser
	socket.on('disconnect', function() {
		io.sockets.in(socket.roomIn).emit("goneuser", socket.nickname);
	});
	
	//emits chat
	socket.on("textsend", function(msg) {
		var name = socket.nickname;
		var data = [name, msg];
		io.sockets.in(socket.roomIn).emit("chat", data);
	});
});
