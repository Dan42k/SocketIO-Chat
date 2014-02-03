window.onload = function() {

    
    var isActive;
    var isTyping;

    window.onfocus = function () { 
      isActive = true; 
    };  

    window.onblur = function () { 
      isActive = true; 
    };

    

    //checkChecking();

    var messages      = [];
    var socket        = io.connect('http://127.0.0.1:3700');
    var field         = document.querySelector(".field");
    var sendButton    = document.querySelector(".send");
    var privateButton = document.querySelector(".private");
    var section       = document.querySelector("section.row");
    
    var content       = document.getElementById("content");
    var typing        = document.getElementsByClassName("typing")[0];
    
    var usersList     = document.getElementById("users-list");
    var usersSelect   = document.querySelector(".users-select");
    
    var input         = document.getElementsByTagName("input")[0];
    
    var audioElement  = document.querySelector("audio");
    
    var newUser       = prompt('Choose your username');
    while(newUser === undefined) {
        newUser = prompt('Choose your username');
    }


    //Contains list of  previous receivers
    var sendedTo = []; 
    var color = [];

    //Create a little animation chat container
    section.className = section.className + " active";
    socket.emit('newUser', newUser);

    // New user ask for previous messages
    socket.emit('old');
 
    socket.on('message', function (data) {
        //console.log(isActive ? 'active' : 'inactive'); 
        if(data) {
            //All users (not on this tab) except sender get a sound notification
            if (data.username && data.username !== newUser && !isActive) {
                audioElement.play();
                audioElement.currentTime = 0;
            };
            
            displayMessage(data, false);
        } else {
            console.log("There is a problem:", data);
        }
    });

    var myVar = setInterval(
                    function(){
                        checkChecking();
                    }, 1000);

    function checkChecking() {
        input.onfocus = function () { 
          isTyping = true;
        };  

        input.onblur = function () { 
          isTyping = false;
        };

        socket.emit('typing', { isTyping: isTyping, username: newUser});
    }

    socket.on('is_typing', function(data){
        var html = '';

        if(data.length) {
            for(var i = 0; i < data.length; i++) {
                html += data[i] + ' is typing | ';
            } 
        }
        typing.innerHTML = html;
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
            displayNotification('Nouveau venu', _newUser + ' vient d\'arriver dites lui bonjour', 'newUser', true);
        } 
        else if (Notification && Notification.permission !== "denied") {
            Notification.requestPermission(function (status) {
                if (Notification.permission !== status) {
                  Notification.permission = status;
                }

                // If the user said okay
                if (status === "granted") {
                    displayNotification('Nouveau venu', _newUser + ' vient d\'arriver dites lui bonjour', 'newUser', true);
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

    socket.on('receive_pm', function(data){
        // console.log(data.to, newUser);
       // if(data.to == newUser) {

        console.log('PRIVATE ', data.to, data.from, data);
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
            displayNotification('Private message from ' + sender + ' at ' + clock, data.content, data.content, isActive);
        } 
        else if (Notification && Notification.permission !== "denied") {
            Notification.requestPermission(function (status) {
                if (Notification.permission !== status) {
                  Notification.permission = status;
                }

                // If the user said okay
                if (status === "granted") {
                    displayNotification('Private message from ' + sender + ' at ' + clock, data.content, data.content, isActive);
                }
            });
        }

        // Receiver gets the color of the sender
        if (sendedTo.indexOf(data.from) === -1) {
            sendedTo.push(data.from);
            color.push(data.bgColor);
        } 

        displayMessage(data, false, true);
    });

    // When user quit the chat everyone get notified
    socket.on('user_leave', function(data){
          if (Notification && Notification.permission === "granted") {
                displayNotification("Déconnexion", data.username + ' est parti', 'data.username', isActive);
            } 
            else if (Notification && Notification.permission !== "denied") {
                Notification.requestPermission(function (status) {
                    if (Notification.permission !== status) {
                      Notification.permission = status;
                    }
                    // If the user said okay
                    if (status === "granted") {
                      displayNotification("Déconnexion", data.username + ' est parti', 'data.username', isActive);
                    }
                });
            }
    });

    socket.on('new', function(message) {
        console.log(message);
    });

    sendButton.onclick = function() {
        var text = field.value;
        if (text === '') return;
        var privateMessageReceiver = usersSelect.options[usersSelect.selectedIndex].value;

        var time  = new Date();

        if (privateMessageReceiver) {
            var color1 = (Math.floor((Math.random()*222)+33).toString(16));
            var color2 = (Math.floor((Math.random()*222)+33).toString(16));
            var color3 = (Math.floor((Math.random()*222)+33).toString(16));

            if (sendedTo.indexOf(privateMessageReceiver) === -1) {
                sendedTo.push(privateMessageReceiver);

                var colour = '#' + String(color1) + String(color2) + String(color3);
                color.push(colour);
            } 

            var colorToMessage = color[sendedTo.indexOf(privateMessageReceiver)];

            socket.emit('private_message', { to: privateMessageReceiver, message: text, from: newUser, createdAt: time, color: colorToMessage });
        } else {
            socket.emit('send', { message: text, username: newUser, createdAt: time });
        }
        field.value = '';
    };

    function displayMessage(data, isOld, isPrivate){
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

        //Message contains a img tag
        var regex = /<img /g;

        if (isOld) {
            CSSClass = "msg-old";
        } else {
            CSSClass = "msg";
        }

        if(regex.test(message)){
            message = message.replace('src=', 'onclick="toggleSize(this)" src=');
        }

        
        // Message is private
        if (isPrivate) {
            var borderColor = invertColor(data.bgColor);
            // Special display for sender
            if (newUser === data.from) {
                if (data.to === data.from) {
                    content.innerHTML += '<span style="background-color:' + data.bgColor + '; border-left: 2px solid ' + borderColor + '" class="' + CSSClass +' private"><b>You to You: </b>' + message + clock;
                } else {
                    content.innerHTML += '<span style="background-color:' + data.bgColor + '; border-left: 2px solid ' + borderColor + '" class="' + CSSClass +' private"><b>You to ' + data.to + ': </b>' + message + clock;
                }
            } else {
                content.innerHTML += '<span style="background-color:' + data.bgColor + '; border-left: 2px solid ' + borderColor + '" class="' + CSSClass +' private"><b>' + data.from + ' to You: </b>' + message + clock;
            }
        } else {
            if (isOld) {
                content.innerHTML += '<span class="' + CSSClass +'"><b>' + username + ': </b>' + message + clock;
            } else {
                content.innerHTML += '<span class="new ' + CSSClass +'"><b>' + username + ': </b>' + message + clock;
            }
        }
        
        content.innerHTML += "<br/></span>";

        if (!isOld && !isPrivate) {
            setTimeout(function(){
                var spanLists = content.getElementsByTagName("span");

                spanLists[spanLists.length-1].className = '';
                spanLists[spanLists.length-1].className = CSSClass;
            }, 700);
        }        
        
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

function invertColor(hexTripletColor) {
   var color = hexTripletColor;
    color = color.substring(1);           // remove #
    console.log(hexTripletColor);
    color = parseInt(color, 16);          // convert to integer
    color = 0xFFFFFF ^ color;             // invert three bytes
    color = color.toString(16);           // convert to hex
    color = ("000000" + color).slice(-6); // pad with leading zeros
    color = "#" + color;                  // prepend #
    return color;
}


function displayNotification (title, body, tag, img, isActive) {
    //var for users who don't want to be annoyed by notifications
    var WANT_TO_BE_ANNOYED_BY_NOTIFICATIONS = false; 

    if(WANT_TO_BE_ANNOYED_BY_NOTIFICATIONS && !isActive){
        var n = new Notification(title, 
                                {
                                    tag: tag,
                                    body: body
                                }
                            );
    }
    
}