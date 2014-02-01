var express = require("express");
var markdown = require( "markdown" ).markdown;

var port = 3700;

var app = express();
app.set('views', __dirname + '/tpl');
app.set('view engine', "jade");
app.locals.pretty = true;
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


var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/chat');

var chatSchema = mongoose.Schema({
    username: String,
    message: String,
    createdAt: {
    	type: Date, default: Date.now 
    }
});

var Message = mongoose.model('Message', chatSchema);
 
var io = require('socket.io').listen(app.listen(port));
io.sockets.on('connection', function (socket) {

	socket.on('old', function () {
		var query = Message.find({}).sort({'createdAt': -1});
		query.limit(7).exec( function(err, data){
	    		if(err) throw err;
	    		var datas = [];
	    		for (var i = 0; i < data.length; i++) {
	    			var object = {
		    			username: data[i].username,
		    			message: markdown.toHTML(data[i].message),
		    			createdAt: data[i].createdAt
		    		}
		    		datas.push(object);
	    		};

	    		socket.emit('load_old_messages', datas);
	    });
    });

    var messageFromServer = {
    	message: 'welcome to the chat',
    	createdAt: new Date()
    }

    socket.emit('message', messageFromServer);
    

    socket.on('send', function (data) {
    	var newMessage = new Message({ username: data.username, message: data.message  });
    	newMessage.save(function (err) {
		  if (err) // ...
		  throw err;
		});
    	//console.log(data);
    	var datas = {
			username: data.username,
			message: markdown.toHTML(data.message),
			createdAt: data.createdAt
		}
    	//console.log( markdown.toHTML( data[0].message ) )
        io.sockets.emit('message', datas);
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

			var time    = new Date();
			var hours   = time.getHours();

			var minutes = time.getMinutes();
			minutes     = ((minutes < 10) ? "0" : "") + minutes;

			var seconds = time.getSeconds();
			seconds     = ((seconds < 10) ? "0" : "") + seconds;

			var clock   = hours + ":" + minutes + ":" + seconds;

	    	socket.broadcast.emit('newUser', newUser);
	    	var object = {
	    		pseudo: newUser,
	    		date: clock
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

	socket.on('disconnect', function(){
		
		var userDisconnected = socket.pseudo;
	    socket.broadcast.emit('user_leave', { username: userDisconnected });

	    //console.log('DOGE ', socket.date);
		delete users[socket.pseudo];
		io.sockets.emit('users_list', Object.keys(users));
	}); 

	socket.on('private_message', function(data) {
		if(!users[data.to]) return;
		users[data.to].emit('send_message', data);
	});

	socket.on('userinfo_request', function(){
		if(!socket.pseudo) return;
		socket.emit('are', socket.pseudo);
	});


}); 

console.log("Listening on port " + port);