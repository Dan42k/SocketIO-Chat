var express = require("express");
var app = express();
var port = 3700;
 
app.set('views', __dirname + '/tpl');
app.set('view engine', "jade");
app.engine('jade', require('jade').__express);

app.get("/", function(req, res){
    res.render("index");
});

app.get("/doge.html", function(req, res){
    res.render("doge");
});

app.use(express.static(__dirname + '/public'));

var users = {};
var usersData = [];
 
var io = require('socket.io').listen(app.listen(port));
io.sockets.on('connection', function (socket) {

    socket.emit('message', { message: 'welcome to the chat' });

    socket.on('send', function (data) {
        io.sockets.emit('message', data);
    });

    socket.on('newUser', function(data) {
    	var newUser = data;
    	var date = new Date();
    	if (data in users){
    		// On informe l'utilisateur que ce pseudonyme est déjà utilisé
    		socket.emit('duplicate');
    	} else {
    		//Crée une session pour l'utilisateur
	    	socket.set('pseudo', newUser);
	    	socket.set('date', new Date());

	    	var demain=new Date();
			demain.setTime(demain.getTime() + 24 * 3600 * 1000);

	    	socket.broadcast.emit('newUser', newUser);
	    	var object = {
	    		pseudo: newUser,
	    		date: demain
	    	};

	    	socket.pseudo = newUser;
	    	socket.object = object;
	    	//socket.doge = 'doge';

	    	usersData.push(object);

	    	//socket.pseudo
	    	//users[socket] = object;
	    	users[socket.pseudo] = socket;
	    	//users[socket.pseudo] = socket;

	    	//users[date] = socket;

	    	console.log(
	    		 Object.keys(users)
	    	);
	    	//io.sockets.emit('users_list', Object.keys(users));
	    	io.sockets.emit('users_list', {
	    									users: Object.keys(users),
	    									datas: usersData
	    					});
	    	
    	}
	}); 

	socket.on('change_name', function(name){
		socket.get('pseudo', function (error, data) {
		    socket.set('pseudo', name);
		    socket.emit('change_name_enabled', name);

		    //socket.broadcast.emit('new', "this is a test");
		}); 
	});  


	var hs = socket.handshake;
	//console.log(hs);

	socket.on('disconnect', function(){
		
		var userDisconnected = socket.pseudo;
	    socket.broadcast.emit('user_leave', { username: userDisconnected });

	    //console.log('DOGE ', socket.date);
		delete users[socket.pseudo];
		io.sockets.emit('users_list', Object.keys(users));
	}); 

	socket.on('private_message', function(data) {
		console.log(users[data.to]);
		if(!users[data.to]) return;
		users[data.to].emit('send_message', data);
	});

	socket.on('userinfo_request', function(){
		if(!socket.pseudo) return;
		socket.emit('are', socket.pseudo);
	});
}); 

 
console.log("Listening on port " + port);