/*
Functions
*/
function showChat() {
   $("#login-screen").hide();
   $("#main-chat-screen").show();
}

function decryptOrFail(data, password) {
   try {
      var encoded = CryptoJS.Rabbit.decrypt(data, password);
      var decrypted = encoded.toString(CryptoJS.enc.Utf8);
   } catch (err) {
      var decrypted = "Unable to decrypt: " + data;
   }

   return decrypted;
}

function getHTMLStamp(align) {
   align = typeof align !== 'undefined' ? align : 'left';

   var date = new Date();
   var stamp = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
   if (align == 'left') {
      return "<span class=\"timestamp\">" + stamp + " </span>";
   } else {
      return "<span class=\"timestamp pull-right\">" + stamp + " </span>";
   }
}

function postChat(message) {
   $("#msgs").append(message);
   $("#msgs").append("<div class=\"clearfix\"></div>");
   $(window).scrollTop($(window).scrollTop() + 5000)
   
   if (configAudio) {
      notify.play();
   }
   if (!document.hasFocus()) {
      missedNotifications++;
   }
}

/*
vars
*/
//connection string
var socket = io.connect("168.235.152.38:80");

//vars for room data
var myRoomID = password = name = null;

//config vars
var configFile = configAudio = true;

//causes nickname to be random hex and room/password to be 'test', and log you in on load
var debug = 0;

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

function notificationCheck() {
   if (document.hasFocus()) {
      missedNotifications = 0;
   }

   if (missedNotifications > 0) {
      document.title = "(" + missedNotifications + " new) FreeChat | " + myRoomID;
   } else {
      document.title = "FreeChat | " + myRoomID;
   }
}

$(document).ready(function () {
   //start watching for missed notifications
   setInterval(notificationCheck, 200);
   
   myRoomID = "Home";

   $("form").submit(function (event) {
      event.preventDefault();
   });

   $("#main-chat-screen").hide();
   $("#errors").hide();
   if (!isMobile) {
      $("#name").focus();
   }


   //debug
   if (debug) {
      name = Math.random().toString(36).substring(7);
      myRoomID = "TestRoom1";
      password = "testpwd";

      socket.emit("joinReq", name, myRoomID);
   }

   //check file upload support
   if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
      ("#connect-status").append("<li>Warning: file uplaods not supported in this browser.</li>");
   }

   //room join hook
   $("#nameForm").submit(function () {
      name = $("#name").val();
      myRoomID = $("#room").val();
      password = $("#pass").val();

      if (name === "" || name.length < 2 || myRoomID === "" || myRoomID.length < 2) {
         //we have a problem
         $("#errors").empty();
         $("#errors").append("Please enter a nickname and room longer than 2 characters.");
         $("#errors").show();
      } else {
         //good to go, request to join
         $("#connect-status").append("<li>Sending join request</li>");
         socket.emit("joinReq", name, myRoomID);
         $("#connect-status").append("<li>Join request sent</li>");
      }
   });

/* 
     *
     * Config options
     *
     */

   $('#config-timestamps').change(function () {
      $('.timestamp').toggle();
   });

   $('#config-files').change(function () {
      configFile = $('#config-files').is(':checked');
   });

   $('#config-audio').change(function () {
      configAudio = $('#config-audio').is(':checked');
   });

/* 
     *
     * Connection operations
     *
     */
   socket.on("joinConfirm", function () {
      $("#connect-status").append("<li>Join request approved</li>");

      $("#connect-status").append("<li>Setting room title...</li>");
      $(".room-title").html(_.escape(myRoomID));
      document.title = "FreeChat | " + myRoomID;

      $("#errors").hide();

      if (!isMobile) {
         $("#msg").focus()
      }

      showChat();
   });

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
      var msg = $("#msg").val();
      var encrypted = null;
      if (msg !== "") {
         if (msg.indexOf("debug::") > -1) {
            socket.emit("debug", msg.split('::')[1]);
         } else {
            encrypted = CryptoJS.Rabbit.encrypt(msg, password);
            socket.emit("textSend", encrypted.toString());
         }
      }

      //clear the message bar after send
      $("#msg").val("");

      //if they're mobile, close the keyboard
      if (isMobile) {
         $("#msg").blur()
      } else {
         $("#msg").focus()
      }
   });

   //get a chat message
   socket.on("chat", function (payload) {
      var type = payload[0];
      var msgName = payload[1];
      var msg = decryptOrFail(payload[2], password);
      var msgCore = null;

      if (name == msgName) {
         //this is our own post; color it
         var defaultColor = "text-success";
      }
      else {
         //it's not ours
         var defaultColor = "text-default";
      }

      //assemble message core
      if (type == 0) {
         msgCore = _.escape(msg);
      }
      else if (type == 1) {
         if (configFile) {
            msgCore = "<img src=\"" + msg + "\">";
         }
         else {
            msgCore = "<span class=\"text-danger\">Image blocked by configuration</span>";
         }
      }

      //post the message
      if (name == msgName) {
	 //this is our message; format accordingly
         postChat("<div class=\"message my-message\"><span class=\"message-body\"> " + msgCore + "</span><br /><span class=\"message-metadata\"> " + _.escape(msgName) + " " + getHTMLStamp() + "</span></div>");
      }
      else {
         postChat("<div class=\"message their-message\"><span class=\"message-body\"> " + msgCore + "</span><br /><span class=\"message-metadata\">" + getHTMLStamp() + "<strong>" + _.escape(msgName) + "</strong></span></div>");
      } 
   });

   //get a status update
   socket.on("update", function (msg) {
      //post the message
      postChat("<div class=\"status-message\">" + _.escape(msg) + "</div>");
   });

   //we're being rate limited...
   socket.on("rateLimit", function (msg) {
      //post the message
      postChat("<div class=\"status-message text-warning\">Please wait before doing that again.</div>");
   });

/* 
     *
     * Typing operations
     *
     */

   function typingTimeout() {
      typing = false;
      socket.emit("typing", false);
   }

   $("#msg").keypress(function (e) {
      if (e.which !== 13) {
         if (typing === false && $("#msg").is(":focus")) {
            typing = true;
            socket.emit("typing", true);
         } else {
            clearTimeout(stopTimeout);
            stopTimeout = setTimeout(typingTimeout, 250);
         }
      } else {
         //it was enter; they're done
         clearTimeout(stopTimeout);
         typingTimeout();
      }
   });

   //Recieving a typing status update
   socket.on("typing", function (typing) {
      if (typing[0]) {
         $("#typing-" + typing[1].replace(/\W/g, '')).show();
      } else {
         $("#typing-" + typing[1].replace(/\W/g, '')).hide();
      }
   });



/* 
     *
     * User operations
     *
     */

   //User joins the room
   socket.on("newUser", function (newName) {

      //build the message
      postChat("<div class=\"status-message\">" + _.escape(newName) + " joined the room.</li>");

      //add user to the user list
      $("#members").append("<li id=\"user-" + newName.replace(/\W/g, '') + "\">" + _.escape(newName) + " <span id=\"typing-" + newName.replace(/\W/g, '') + "\" style=\"display: none;\" class=\"badge\">...</span></li>");
   });

   //User leaves the room
   socket.on("goneUser", function (leftName) {
      postChat("<div class=\"status-message\">" + _.escape(leftName) + " left the room.</div>");
      $("#user-" + leftName).remove();
   });

   //Recieving a list of users
   socket.on("userList", function (users) {
      $("[id^='user-']").remove();
      users.forEach(function (user) {
         $("#members").append("<li id=\"user-" + user.replace(/\W/g, '') + "\">" + _.escape(user) + " <span id=\"typing-" + user.replace(/\W/g, '') + "\" style=\"display: none;\" class=\"badge\">...</span></li>");
      });
   });

   //Current user is disconnected
   socket.on("disconnect", function () {
      $("#overlay-message").text("Connection Lost");
      $("#overlay").show();
      location.reload();
   });

   $(window).focus(function () {
      window_focus = true;
   })


/* 
     *
     * File upload -- http://www.html5rocks.com/en/tutorials/file/dndfiles/
     *
     */

   function handleFileSelect(evt) {
      evt.stopPropagation();
      evt.preventDefault();

      var files = evt.dataTransfer.files; // FileList object.
      // files is a FileList of File objects. List some properties.
      // Loop through the FileList and render image files as thumbnails.
      for (var i = 0, f; f = files[i]; i++) {
         // only process image files.
         if (!f.type.match('image.*')) {
            var post = "<div class=\"status-message\">Please upload images only.</div>";
            $("#msgs").append(post);
            continue;
         }

         var reader = new FileReader();

         // closure to capture the file information.
         reader.onload = (function (theFile) {
            return function (e) {
               //alert the user
               var post = "<div class=\"status-message\">Processing & encrypting image... Please wait.</div>";
               $("#msgs").append(post);

               var image = e.target.result;

               //restrict to fiveish megs (not super accurate because base64, but eh)
               if (image.length > 5000000) {
                  var post = "<div class=\"status-message\">Image too large.</li>";
                  $("#msgs").append(post);
               } else {
                  encrypted = CryptoJS.Rabbit.encrypt(image, password);
                  socket.emit("dataSend", encrypted.toString());

                  var post = "<div class=\"status-message\">Image sent. Distributing...</li>";
                  $("#msgs").append(post);
               }
            };
         })(f);

         // read in the image file as a data URL.
         reader.readAsDataURL(f);
      }
   }


   function handleDragOver(evt) {
      evt.stopPropagation();
      evt.preventDefault();
      evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
   }

   // setup the  listeners.
   var dropZone = document.getElementById('main-body');
   dropZone.addEventListener('dragover', handleDragOver, false);
   dropZone.addEventListener('drop', handleFileSelect, false);
});