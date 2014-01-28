SocketIO-Chat
=============

Socket IO test | Creating a little chat

http://flippinawesome.org/2013/09/30/building-multiplayer-games-with-node-js-and-socket-io/


 // send to current request socket client
 socket.emit('message', "this is a test");

 // sending to all clients, include sender
 io.sockets.emit('message', "this is a test");

 // sending to all clients except sender
 socket.broadcast.emit('message', "this is a test");

 // sending to all clients in 'game' room(channel) except sender
 socket.broadcast.to('game').emit('message', 'nice game');

  // sending to all clients in 'game' room(channel), include sender
 io.sockets.in('game').emit('message', 'cool game');

 // sending to individual socketid
 io.sockets.socket(socketid).emit('message', 'for your eyes only');