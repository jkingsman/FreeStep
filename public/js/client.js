/*
 * 
 * Functions
 *
 * 
*/
function showChat() {
   $("#login-screen").hide();
   $("#main-chat-screen").show();
}

function sendJoinReq(tryName, tryRoomID, tryPassword){
   //load up the globals with our given data
   if (tryName === "" || tryName.length < 2 || tryRoomID === "" || tryRoomID.length < 2) {
      //we have a problem
      $("#connect-status").append("<li>Please enter a nickname and room longer than 2 characters.</li>");
 
   } else {
      //good to go, request to join
      //load our globals with our validated data
      name = tryName;
      myRoomID = tryRoomID;
      password = tryPassword;
      
      //make it so
      $("#connect-status").append("<li>Sending join request</li>");
      socket.emit("joinReq", name, CryptoJS.SHA1(myRoomID).toString(), CryptoJS.SHA1(tryPassword).toString());
   }
}

//attempt to decrypt the given data with the given password, or return a failure string
function decryptOrFail(data, password) {
   try {
      var encoded = CryptoJS.Rabbit.decrypt(data, password);
      var decrypted = encoded.toString(CryptoJS.enc.Utf8);
   } catch (err) {
      var decrypted = "Unable to decrypt: " + data;
   }
   return decrypted;
}

//return a timestamp
function getHTMLStamp() {
   var date = new Date();
   var stamp = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
   return "<span class=\"message-timestamp\">" + stamp + " </span>";
}

//add the text to the chat window, and handle notifications
function postChat(message) {
   $("#msgs").append(message);
   $("#msgs").append("<div class=\"clearfix\"></div>");
   $(window).scrollTop($(window).scrollTop() + 5000);
   
   //handle the options for the window being in and out of focus  
   if (configAudioUnfocus && !document.hasFocus()) {
      notify.play();
   }
   
   //handle the options for the window being in and out of focus  
   if (configAudioFocus && document.hasFocus()) {
      notify.play();
   }
   
   //add to our missed notifications if appropriate
   if (!document.hasFocus()) {
      missedNotifications++;
   }
}

//query the url for the given parameter; used in case of a link to the room
var urlParam = (function(a) {
    if (a == "") return {};
    var b = {};
    for (var i = 0; i < a.length; ++i)
    {
        var p=a[i].split('=', 2);
        if (p.length == 1)
            b[p[0]] = "";
        else
            b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
    }
    return b;
})(window.location.search.substr(1).split('&'));

function clearFileInput(){ 
    var oldInput = document.getElementById("file-select"); 
     
    var newInput = document.createElement("input"); 
     
    newInput.type = "file"; 
    newInput.id = oldInput.id; 
    newInput.name = oldInput.name; 
    newInput.className = oldInput.className; 
    newInput.style.cssText = oldInput.style.cssText; 
    // copy any other relevant attributes 
     
    oldInput.parentNode.replaceChild(newInput, oldInput); 
}

//sanitize from non-alphanumberic characters
function convertToAlphanum(string) {
   return string.replace(/\W/g, '');
}

//sanitize from non-HTML safe characters
function sanitizeToHTMLSafe(string) {
   return _.escape(string);
}

// chats and updates while the window is blurred
function notificationCheck() {
   if (document.hasFocus()) {
      missedNotifications = 0;
   }

   if (missedNotifications > 0) {
      document.title = "(" + missedNotifications + " new) FreeStep | " + myRoomID;
   } else {
      document.title = "FreeStep | " + myRoomID;
   }
}

function typingTimeout() {
   typing = false;
   socket.emit("typing", false);
}

/*
 * 
 * Variable defs
 *
 *  
*/
//connection string
var socket = io.connect("freestep.net:443");

//vars for room data
var myRoomID = password = name = null;

//config vars
var configFile = configAudioFocus = configAudioUnfocus = true;

//message unique id
var messageCount = 0;

/* 
 *
 * Config options
 *
 */

$('#config-timestamps').change(function () {
   $('.message-timestamp').toggle();
});

$('#config-files').change(function () {
   configFile = $('#config-files').is(':checked');
});

$('#config-audio-focus').change(function () {
   configAudioFocus = $('#config-audio-focus').is(':checked');
});
 
$('#config-audio-unfocus').change(function () {
   configAudioUnfocus = $('#config-audio-unfocus').is(':checked');
});

$('#config-imglink').change(function () {
   $('.img-download-link').toggle();
});

//mobile checking
var isMobile = false;
(function (a) {
   if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) isMobile = true
})(navigator.userAgent || navigator.vendor || window.opera);

//typing vars
var typing = false;
var stopTimeout = undefined;

//alert sound
var notify = new Audio('notify.wav');

//page blur handling
var missedNotifications = 0;

$(document).ready(function () {
   //start watching for missed notifications
   setInterval(notificationCheck, 200);
   
   //default RoomID gets put in the page title; make is sane for page load
   myRoomID = "Home";

   //all forms are handled, never actually submitted
   $("form").submit(function (event) {
      event.preventDefault();
   });

   //prep for login display - hide the main screen and focus on the name box when appropriate
   $("#main-chat-screen").hide();
   if (!isMobile) {
      $("#name").focus();
   }
   else{
      $("#name").blur();
   }
   
   //check if they got here via a link
   if (typeof urlParam["room"] != "undefined") {
      $("#name").val("Guest" + Math.floor((Math.random() * 10000) + 1));
      $("#room").val(urlParam["room"]);
      $("#pass").focus();
   }

   //check file upload support
   if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
      ("#connect-status").append("<li>Warning: file uploads not supported in this browser.</li>");
   }

   //form submit hook - they want to join
   $("#nameForm").submit(function () {
      //load up the form
      name = $("#name").val();
      myRoomID = $("#room").val();
      password = $("#pass").val();

      sendJoinReq($("#name").val(), $("#room").val(), $("#pass").val());
   });
   

/* 
     *
     * Connection operations
     *
     */
   socket.on("joinConfirm", function () {
      //we've recieved request approval
      $("#connect-status").append("<li>Join request approved!</li>");
      $("#connect-status").append("<li>Setting room title...</li>");
      
      //set the room title classes to sanitized room name
      $(".room-title").html(sanitizeToHTMLSafe(myRoomID));
      $("#share-url").val("https://freestep.net/?room=" + encodeURIComponent(myRoomID));
      
      //seet page title
      document.title = "FreeStep | " + myRoomID;

      /* Focus the message box, unless you're mobile, it which case blur
       * everything that might have focus so your keyboard collapses and
       * you can see the full room layout and options, especially the menu.
       */ 
      if (!isMobile) {
         $("#msg").focus()
      }else{
	 $("#name").blur();
	 $("#room").blur();
	 $("#pass").blur();
      }
      
      //check mobile, and, if mobile, expose the image link config option and file chooser for upload, and hide the drag/drop message
      if (isMobile) {
	 $('#config-imglink-container').removeClass("hidden");
	 $('#file-select').removeClass("hidden");
	 $('#file-drag-message').addClass("hidden");
      }

      //finally, expose the main room
      showChat();
      
   });

   //oops. They done goofed.
   socket.on("joinFail", function (failure) {
      $("#connect-status").append("<li><strong>Join request denied: " + failure + "</strong></li>");
   });


    /* 
     *
     * Chat operations
     *
     */

   //send a message
   $("#chatForm").submit(function () {
      //load vars
      var msg = $("#msg").val();
      var encrypted = null;
      
      if (msg !== "") {
	 //if we have something to send, crypt and send it.
	 encrypted = CryptoJS.Rabbit.encrypt(msg, password);
	 socket.emit("textSend", encrypted.toString());
      }

      //clear the message bar after send
      $("#msg").val("");

      //if they're mobile, close the keyboard
      if (isMobile) {
         $("#msg").blur();
      }
   });

   //get a chat message
   socket.on("chat", function (payload) {
      //type = 0 for text, 1 for image
      var type = payload[0];
      var msgName = payload[1];
      var msg = decryptOrFail(payload[2], password);
      
      //msg core is used later in message construction
      var msgCore, msgOwner = null;

      /*
       * Message Core Assembly
       * Some parts of the message are always the same
       * (layout, alignment, etc) - so we build a core,
       * which contains (most of the) unique parts,
       * so actually sending it is relatively simple.
       */
      
      if (type == 0) {
	 //it's text - sanitize the decrypted text and we're done
         msgCore = sanitizeToHTMLSafe(msg);
      }
      else if (type == 1) {
	 //it's an image
         if (configFile) {
	    //they're okay with getting images
            msgCore = "<img src=\"" + msg + "\"><span class=\"img-download-link\" style=\"display: none;\"><br /><a target=\"_blank\" href=\"" + msg + "\">View/Download Image</a>";
         }
         else {
            msgCore = "<span class=\"text-danger\">Image blocked by configuration</span>";
         }
      }

      //post the message
      if (name == msgName) {
	 //this is our message; format accordingly
	 msgOwner = "my-message";
      }
      else {
	 msgOwner = "their-message";
      }
      
      //package it and post it!
      postChat("<div class=\"message " + msgOwner + "\" id=\"message-" + messageCount + "\"><span class=\"message-metadata\"><span class=\"message-name\">" + sanitizeToHTMLSafe(msgName) + "</span><br />" + getHTMLStamp() + "</strong></span><span class=\"message-body\"> " + msgCore + "</span></div>");
      messageCount++;
   });

   //get a status update
   socket.on("update", function (msg) {
      //post the sanitized message
      postChat("<div class=\"status-message\">" + sanitizeToHTMLSafe(msg) + "</div>");
   });

   socket.on("rateLimit", function (msg) {
      postChat("<div class=\"status-message text-warning\">Please wait before doing that again.</div>");
   });

/* 
     *
     * Typing operations
     * These are kind of tricky. Essentially, if the user types,
     * emit that the user is typing, and alert the server that
     * they've stopped (the alert to be sent 250ms from now). If
     * they keep typing, don't send any more alerts that they're
     * typing, and keep pushing back the "stopped" emission.
     *
     */

   $("#msg").keypress(function (e) {
      if (e.which !== 13) {
	 if (!typing) {
	    socket.emit("typing", true);
	    typing = true;
	    clearTimeout(stopTimeout);
	    stopTimeout = setTimeout(typingTimeout, 250);
	 }
	 else{
	    clearTimeout(stopTimeout);
	    stopTimeout = setTimeout(typingTimeout, 250);
	 }
      }
   });

   //Recieving a typing status update; update css
   socket.on("typing", function (typing) {
      //typing[0] is boolean to indicate typing (true) or not (false)
      if (typing[0]) {
         $("#typing-" + convertToAlphanum(typing[1])).removeClass("hidden");
      } else {
         $("#typing-" + convertToAlphanum(typing[1])).addClass("hidden");
      }
   });

/* 
     *
     * User operations
     *
     */

   //User joins the room
   socket.on("newUser", function (newName) {

      //post the message
      postChat("<div class=\"status-message\">" + sanitizeToHTMLSafe(newName) + " joined the room.</li>");

      //add user to the user list
      $("#members").append("<li id=\"user-" + convertToAlphanum(newName) + "\">" + sanitizeToHTMLSafe(newName) + " <span id=\"typing-" + convertToAlphanum(newName) + "\" class=\"badge hidden pull-right\">...</span></li>");
   });

   //User leaves the room
   socket.on("goneUser", function (leftName) {
      //post the message
      postChat("<div class=\"status-message\">" + sanitizeToHTMLSafe(leftName) + " left the room.</div>");
      
      //strike user from userlist
      $("#user-" + leftName).remove();
   });

   //Recieving a list of users
   socket.on("userList", function (users) {
      //clear the user list
      $("[id^='user-']").remove();
      
      //for each user we got, add them to the list
      users.forEach(function (user) {
         $("#members").append("<li id=\"user-" + convertToAlphanum(user) + "\">" + sanitizeToHTMLSafe(user) + " <span id=\"typing-" + convertToAlphanum(user) + "\" class=\"badge hidden pull-right\">...</span></li>");
      });
   });

   //reload when we get disconnected
   socket.on("disconnect", function () {
      location.reload();
   });


    /* 
     *
     * File upload -- http://www.html5rocks.com/en/tutorials/file/dndfiles/
     * handleFileDrop is a pretty standard upload script. More can be learned above.
     */

   function handleFileDrop(evt) {
      evt.stopPropagation();
      evt.preventDefault();

      //determine whether this is a drag/drop or a file selector input
      if (typeof evt.target.files == 'undefined'){
	 var files = evt.dataTransfer.files; // FileList object.
      }
      else{
	 var files = evt.target.files;
      }
      // files is a FileList of File objects. List some properties.
      // Loop through the FileList and render image files as thumbnails.
      for (var i = 0, f; f = files[i]; i++) {
         // only process image files.
         if (!f.type.match('image.*')) {
            postChat("<div class=\"status-message\">Please upload images only.</div>");
            continue;
         }

         var reader = new FileReader();

         // closure to capture the file information, encrypt, and send..
         reader.onload = (function (theFile) {
            return function (e) {
               //alert the user
               postChat("<div class=\"status-message\">Processing & encrypting image... Please wait.</div>");

               var image = e.target.result;

               //restrict to oneish megs (not super accurate because base64, but eh)
               if (image.length > 1000000) {
                  postChat("<div class=\"status-message\">Image too large.</li>");
               } else {
                  encrypted = CryptoJS.Rabbit.encrypt(image, password);
                  socket.emit("dataSend", encrypted.toString());

                  postChat("<div class=\"status-message\">Image sent. Distributing...</li>");
               }
            };
         })(f);

         // read in the image file as a data URL.
         reader.readAsDataURL(f);
	 clearFileInput();
      }
   }


   function handleDragOver(evt) {
      evt.stopPropagation();
      evt.preventDefault();
      evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
   }

   // setup the  listeners.
   var dropZone = document.getElementById('main-body');
   var fileSelect = document.getElementById('file-select');
   dropZone.addEventListener('dragover', handleDragOver, false);
   dropZone.addEventListener('drop', handleFileDrop, false);
   fileSelect.addEventListener('change', handleFileDrop, false);
});
