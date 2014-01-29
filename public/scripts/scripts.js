window.onload = function() {
 
    var messages = [];
    var socket = io.connect('http://172.16.211.104:3700');
    var field = document.querySelector(".field");
    var sendButton = document.querySelector(".send");
    var privateButton = document.querySelector(".private");
    var content = document.getElementById("content");

    var usersList = document.getElementById("users-list");

    var usersSelect = document.querySelector(".users-select");

    var newUser = prompt('Quel est votre pseudo ?');
    socket.emit('newUser', newUser);
 
    socket.on('message', function (data) {
        if(data.message) {
           messages.push(data);
            var html = '';
            var username;
            var hours;
            for(var i = 0; i < messages.length; i++) {
                username =  (messages[i].username ? messages[i].username : 'Server');
                hours =  (messages[i].hours ? ' (' + messages[i].hours + ')' : '');

                html += '<b>' + username + ': </b>';
                html += messages[i].message + hours + '<br />';
            }
            content.innerHTML = html;
        } else {
            console.log("There is a problem:", data);
        }
    });

    socket.on('duplicate', function(){
        newUser = prompt('Veuillez en sélectionner un autre, celui-ci est déjà utilisé');
        socket.emit('newUser', newUser);
    });

    
    socket.on('newUser', function(_newUser) {
        //console.log(_newUser, newUser);
        //if (_newUser !== newUser) {
            if (Notification && Notification.permission === "granted") {
                displayNotification('Nouveau venu', _newUser + ' vient d\'arriver dites lui bonjour', 'newUser');
            } 
            else if (Notification && Notification.permission !== "denied") {
                Notification.requestPermission(function (status) {
                    if (Notification.permission !== status) {
                      Notification.permission = status;
                    }

                    // If the user said okay
                    if (status === "granted") {
                        displayNotification('Nouveau venu', _newUser + ' vient d\'arriver dites lui bonjour', 'newUser');
                    }
                });
            } 
        //};
    });

    socket.on('users_list', function(data){
        var html = '';
        console.log(data.users)
       
        for(var i = 0; i < data.users.length; i++) {
            html += '<li>' + data.users[i] + ' connected at ' + data.datas[i].date + (data.users[i] == newUser ? ' <b>(You)</b>' : '') + ' </li>';
        }
        usersList.innerHTML = html;

        var select = document.getElementsByTagName('select')[0];
        select.options.length = 0; // clear out existing items
        select.options.add(new Option('Everyone', ''));

        for(var i = 0; i < data.users.length; i++) {
            var pseudo =  (data.users[i] == newUser ? data.users[i] + ' (You)' : data.users[i]);
            var value =  (data.users[i] == newUser ? data.users[i] : data.users[i]);
            select.options.add(new Option(pseudo, value));
        }
    });

    socket.on('disconnect', function(){
    });

    socket.on('change_name_enabled', function(name){
        newUser = name;
        console.log('changed', name);

    });

    socket.on('are', function(data){
        console.log(data);
    });

    socket.on('send_message', function(data){
        // console.log(data.to, newUser);
       // if(data.to == newUser) {
            console.log('PRIVATE ' + data.content);
        //}
        if (Notification && Notification.permission === "granted") {
            displayNotification('Private message from ' + data.from + ' at ' + data.hours, data.content, data.content);
        } 
        else if (Notification && Notification.permission !== "denied") {
            Notification.requestPermission(function (status) {
                if (Notification.permission !== status) {
                  Notification.permission = status;
                }

                // If the user said okay
                if (status === "granted") {
                    displayNotification('Private message from ' + data.from + ' at ' + data.hours, data.content, data.content);
                }
            });
        } 
    });

    socket.on('user_leave', function(data){
        //console.log(data);
          if (Notification && Notification.permission === "granted") {
                displayNotification("Déconnexion", data.username + ' est parti', 'data.username');
            } 
            else if (Notification && Notification.permission !== "denied") {
                Notification.requestPermission(function (status) {
                    if (Notification.permission !== status) {
                      Notification.permission = status;
                    }
                    // If the user said okay
                    if (status === "granted") {
                      displayNotification("Déconnexion", data.username + ' est parti', 'data.username');
                    }
                });
            }
    });

    socket.on('new', function(message) {
        console.log(message);
    })

    privateButton.onclick = function() {
        console.log('private_message');
        //socket.emit('private_message', { to: 'doge', content: 'master', from: newUser });
    };

    sendButton.onclick = function() {
        var text = field.value;
        var privateMessageReceiver = usersSelect.options[usersSelect.selectedIndex].value;

        var demain  = new Date();
        var time    = new Date();
        var hours   = time.getHours();

        var minutes = time.getMinutes();
        minutes     = ((minutes < 10) ? "0" : "") + minutes;

        var seconds = time.getSeconds();
        seconds     = ((seconds < 10) ? "0" : "") + seconds;

        var clock   = hours + ":" + minutes + ":" + seconds;


        if (privateMessageReceiver) {
            socket.emit('private_message', { to: privateMessageReceiver, content: text, from: newUser, hours: clock });
        } else {
            socket.emit('send', { message: text, username: newUser, hours: clock });
        }
        //var text = field.value;
        //socket.emit('private_message', { to: 'doge', content: 'master', from: newUser });
        //L'utilisateur émet un message
        //socket.emit('send', { message: text, username: newUser });
        //socket.emit('userinfo_request');
        //socket.emit('change_name', 'dogemaster');

/*        socket.get('date', function (error, data) {
           console.log(data);
        });*/
        field.value = '';
    };
}

document.querySelector('form').onsubmit = function () {
    return false;
}

function displayNotification (title, body, tag, img) {
    var n = new Notification(title, 
                                {
                                    tag: tag,
                                    body: body
                                }
                            );
}