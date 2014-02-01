window.onload = function() {

    var isActive;

    window.onfocus = function () { 
      isActive = true; 
    }; 

    window.onblur = function () { 
      isActive = false; 
    }; 

    // test
    setInterval(function () { 
      //console.log(isActive ? 'active' : 'inactive');
    }, 1000);
 
    var messages = [];
    var socket = io.connect('http://127.0.0.1:3700');
    var field = document.querySelector(".field");
    var sendButton = document.querySelector(".send");
    var privateButton = document.querySelector(".private");
    var section = document.querySelector("section.row");
    
    var content = document.getElementById("content");

    var usersList = document.getElementById("users-list");
    var usersSelect = document.querySelector(".users-select");

    var audioElement = document.querySelector("audio");
    
    var newUser = prompt('Choose your username');
    while(newUser == undefined) {
        newUser = prompt('Choose your username');
    }


    section.className = section.className + " active";
    socket.emit('newUser', newUser);

    // New user ask for previous messages
    socket.emit('old');
 
    socket.on('message', function (data) {
        //console.log(isActive ? 'active' : 'inactive'); 
        if(data) {
            console.log(isActive);
            //All users except sender get a sound notification
            if (data.username && data.username !== newUser && !isActive) {
                audioElement.play();
                audioElement.currentTime = 0;
            };
            
            displayMessage(data, false);
        } else {
            console.log("There is a problem:", data);
        }
    });
    
    
    socket.on('load_old_messages', function (data) {
        if(data) {
            for(var i = data.length - 1; i > 0; i--) {
                displayMessage(data[i], true);
            }
            content.innerHTML += "<hr/>";
        }
    });

    socket.on('duplicate', function(){
        newUser = prompt('Veuillez en sélectionner un autre, celui-ci est déjà utilisé');
        socket.emit('newUser', newUser);
    });

    // Everybody gets notified because someone is just coming
    socket.on('newUser', function(_newUser) {
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
    });

    // Display the list on users connected
    socket.on('users_list', function(data){
        var html = '';
       
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
            console.log('PRIVATE ', data.to, data.from);
        //}
        var receiver = data.to,
        sender = (data.from !== data.to ? data.from : 'Me');

        var time =  new Date(data.createdAt);
        var hours   = time.getHours();

        var minutes = time.getMinutes();
        minutes     = ((minutes < 10) ? "0" : "") + minutes;

        var seconds = time.getSeconds();
        seconds     = ((seconds < 10) ? "0" : "") + seconds;

        var clock   = hours + ":" + minutes + ":" + seconds;

        if (Notification && Notification.permission === "granted") {
            displayNotification('Private message from ' + sender + ' at ' + clock, data.content, data.content);
        } 
        else if (Notification && Notification.permission !== "denied") {
            Notification.requestPermission(function (status) {
                if (Notification.permission !== status) {
                  Notification.permission = status;
                }

                // If the user said okay
                if (status === "granted") {
                    displayNotification('Private message from ' + sender + ' at ' + clock, data.content, data.content);
                }
            });
        } 
    });

    // When user quit the chat everyone get notified
    socket.on('user_leave', function(data){
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
        if (text === '') return;
        var privateMessageReceiver = usersSelect.options[usersSelect.selectedIndex].value;

        var time  = new Date();

        if (privateMessageReceiver) {
            socket.emit('private_message', { to: privateMessageReceiver, content: text, from: newUser, createdAt: time });
        } else {
            socket.emit('send', { message: text, username: newUser, createdAt: time });
        }
        field.value = '';
    };

    function displayMessage(data, isOld){
        var username;

        username =  (data.username ? data.username : 'Server');
        username =  (username === newUser ? username + ' (You)' : username);

        var time =  new Date(data.createdAt);
        var hours   = time.getHours();

        var minutes = time.getMinutes();
        minutes     = ((minutes < 10) ? "0" : "") + minutes;
 
        var seconds = time.getSeconds();
        seconds     = ((seconds < 10) ? "0" : "") + seconds;

        var clock   = ' (' + hours + ":" + minutes + ":" + seconds + ')';

        var CSSClass;

        var message = data.message;

        //var regex = /^(https?):\/\/+[a-z0-9._-]{2,}\/+[\w\/-]{1,}\.(je?pg|png|gif)/g;
        var regex = /<img /g;

        if (isOld === true) {
            CSSClass = "msg-old";
        } else {
            CSSClass = "msg";
        }

        if(regex.test(message)){
            message = message.replace('src=', 'onclick="toggleSize(this)" src=');
        }
        
        content.innerHTML += '<span class="' + CSSClass +'"><b>' + username + ': </b>' + message + clock + "</span>";
        content.innerHTML += "<br/>";
        
        content.scrollTop = content.scrollHeight;
    } /* end diplayMsg function() */
} /* end window onload function() */

document.querySelector('form').onsubmit = function () {
    return false;
}

function hasClass(element, className) {
    return element.className && new RegExp("(^|\\s)" + className + "(\\s|$)").test(element.className);
}

function toggleSize (evt) {
    if (evt.className === "active") {
        evt.className = "";
    } else {
        evt.className = "active";
    }
}


function displayNotification (title, body, tag, img) {
    var n = new Notification(title, 
                                {
                                    tag: tag,
                                    body: body
                                }
                            );
}