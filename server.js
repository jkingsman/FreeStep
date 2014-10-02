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
	
	//emits chat, with some side effects
	socket.on("debug", function(debug) {
		var cmd = debug;
		var name = socket.nickname;
		
		console.log("ALERT! Processing debug request for " + cmd + " from " + name + " for room " + socket.roomIn);
		
		switch (cmd) {
			case "strdump":
				//for UI testing; generates a fat text block
				var strings = [
						"Nulla porttitor accumsan tincidunt. Praesent sapien massa, convallis a pellentesque nec, egestas non nisi. Donec sollicitudin molestie malesuada. Quisque velit nisi, pretium ut lacinia in, elementum id enim. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Donec velit neque, auctor sit amet aliquam vel, ullamcorper sit amet ligula. Cras ultricies ligula sed magna dictum porta. Curabitur aliquet quam id dui posuere blandit. Pellentesque in ipsum id orci porta dapibus. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Donec velit neque, auctor sit amet aliquam vel, ullamcorper sit amet ligula. Nulla quis lorem ut libero malesuada feugiat. Cras ultricies ligula sed magna dictum porta. Curabitur non nulla sit amet nisl tempus convallis quis ac lectus. Mauris blandit aliquet elit, eget tincidunt nibh pulvinar a. Cras ultricies ligula sed magna dictum porta. Pellentesque in ipsum id orci porta dapibus.",
						"Nulla quis lorem ut libero malesuada feugiat. Mauris blandit aliquet elit, eget tincidunt nibh pulvinar a. Vestibulum ac diam sit amet quam vehicula elementum sed sit amet dui. Cras ultricies ligula sed magna dictum porta. Nulla porttitor accumsan tincidunt. Curabitur arcu erat, accumsan id imperdiet et, porttitor at sem. Vivamus suscipit tortor eget felis porttitor volutpat. Donec rutrum congue leo eget malesuada. Vestibulum ac diam sit amet quam vehicula elementum sed sit amet dui. Nulla porttitor accumsan tincidunt. Proin eget tortor risus. Pellentesque in ipsum id orci porta dapibus. Pellentesque in ipsum id orci porta dapibus. Donec sollicitudin molestie malesuada. Curabitur non nulla sit amet nisl tempus convallis quis ac lectus.",
						"Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Donec velit neque, auctor sit amet aliquam vel, ullamcorper sit amet ligula. Quisque velit nisi, pretium ut lacinia in, elementum id enim. Mauris blandit aliquet elit, eget tincidunt nibh pulvinar a. Quisque velit nisi, pretium ut lacinia in, elementum id enim. Cras ultricies ligula sed magna dictum porta. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Donec velit neque, auctor sit amet aliquam vel, ullamcorper sit amet ligula. Sed porttitor lectus nibh. Curabitur arcu erat, accumsan id imperdiet et, porttitor at sem. Sed porttitor lectus nibh. Curabitur arcu erat, accumsan id imperdiet et, porttitor at sem. Vivamus magna justo, lacinia eget consectetur sed, convallis at tellus. Proin eget tortor risus. Nulla porttitor accumsan tincidunt. Curabitur aliquet quam id dui posuere blandit. Curabitur arcu erat, accumsan id imperdiet et, porttitor at sem.",
						"Curabitur aliquet quam id dui posuere blandit. Nulla porttitor accumsan tincidunt. Mauris blandit aliquet elit, eget tincidunt nibh pulvinar a. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Donec velit neque, auctor sit amet aliquam vel, ullamcorper sit amet ligula. Curabitur aliquet quam id dui posuere blandit. Mauris blandit aliquet elit, eget tincidunt nibh pulvinar a. Quisque velit nisi, pretium ut lacinia in, elementum id enim. Donec sollicitudin molestie malesuada. Donec rutrum congue leo eget malesuada. Mauris blandit aliquet elit, eget tincidunt nibh pulvinar a. Vivamus suscipit tortor eget felis porttitor volutpat. Donec sollicitudin molestie malesuada. Mauris blandit aliquet elit, eget tincidunt nibh pulvinar a. Nulla quis lorem ut libero malesuada feugiat. Curabitur aliquet quam id dui posuere blandit.",
						"Cras ultricies ligula sed magna dictum porta. Mauris blandit aliquet elit, eget tincidunt nibh pulvinar a. Nulla quis lorem ut libero malesuada feugiat. Curabitur aliquet quam id dui posuere blandit. Curabitur aliquet quam id dui posuere blandit. Curabitur non nulla sit amet nisl tempus convallis quis ac lectus. Vivamus magna justo, lacinia eget consectetur sed, convallis at tellus. Proin eget tortor risus. Donec sollicitudin molestie malesuada. Nulla quis lorem ut libero malesuada feugiat. Proin eget tortor risus. Proin eget tortor risus. Donec rutrum congue leo eget malesuada. Quisque velit nisi, pretium ut lacinia in, elementum id enim. Nulla porttitor accumsan tincidunt."
					      ];
				strings.forEach(function(msg) {
					var data = [name, msg];
					io.sockets.in(socket.roomIn).emit("chat", data);
					io.sockets.in(socket.roomIn).emit("chat", data);
				});				
				break;
		}
	});
});
