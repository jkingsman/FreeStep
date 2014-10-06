# FreeStep

Open source, fully encrypted chat goodness. Built as an open source clone of ChatStep, with node.js/socket.io/Bootstrap. 

**_I welcome your feedback greatly! Whether you're a beginner trying to use this to learn, or an expert who can poke holes in my encryption, please let me know! This is imperfect software that I'll keep developing as time goes own._**

## Cool Frontend Things
* _It's repsonsive and mobile friendly!_
* It's built on bootstrap and underscore, so manipulating it is easy
* It's 100% HTML5 W3C compliant
* It's IOS web app capable

## Cool Backend Things
* It runs on node.js & socket.io 1.1.0 - up to date!
* It's easy for beginners to extend!

## Cool Things
* 100% encrypted with the Rabbit cipher - encryption can be trusted even over untrusted connections!
* The key never leaves the user side, nor is there any logging performed whatsoever - extremely anonymous
* It supports the drag and drop sending of images with the HTML5 File API (encrypted, of course), with fallbacks for mobile
* It's open source and MIT licensed - you can edit, inspect the code, and tweak to your needs
* **Because it's open source, _it's transparent._ Don't trust your data to a chat service that is purportedly secure, but unwilling to open the code for you to examine.**

Special thanks to [tamaspiros](https://github.com/tamaspiros/advanced-chat), whose project was my main teacher of node and socket, and the spiritual predecessor to this app.

## Shut up and let me try it!

### Get the files

* Install node & npm (`sudo yum install nodejs npm` for CentOS with `EPEL` repos; beyond that, try [here](https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager))
* Fork this repo to your own account
* Clone to your box (`git init && git clone git@github.com:youruser/FreeStep.git`)

### Configure the app
* Change port and host to your own port and IP in `server.js`:
  ```js
  app.set('port', process.env.OPENSHIFT_NODEJS_PORT || 80);
  app.set('ipaddr', process.env.OPENSHIFT_NODEJS_IP || "168.235.152.38");
  ```
  
* Change port and host to your own port and IP in `public/js/client.js`:
  ```js
  var socket = io.connect("168.235.152.38:80");
  ```

### IMPORTANT SSL NOTE

* The current build is configured for SSL. To configure for non-SSL, change `https = require("https"),` to `http = require("http"),` remove the `sslOptions` param from `var server = https.createServer(sslOptions, app);`, and change port numbers to something more appropriate. You'll lso need to delete the big comment-block-bracketed chunk at the top that redirects from HTTP->HTTPS.

### Install and run the app

* Install the app (`npm install`)
* Run the app (`sudo npm start`) (`sudo` required due to the low port number)
* Access in your browser at your host's address (or whatever your host is)

For development, I highly recommend `supervisor` (`npm install supervisor`) - it watches files for changes and restarts your server when they occur. When combined with the `debug` variable in `client.js`, this is powerful way to have the app restarted and be dropped into a room whenever you change a file. My customary command for development was:
```
sudo supervisor --watch .,public --extensions node,js,css,html server.js
```
