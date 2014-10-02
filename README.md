# FreeStep

Open source, private chat goodness. Built on node.js/socket.io/Bootstrap.


* _It's repsonsive!_
* It's 100% HTML5 compliant
* It's well commented!
* It's minimal but functional!
* It's easy for beginners to extend!
* It slices!
* It dices!

## Libraries used
<ul>
  <li>node.js / npm</li>
  <li>socket.io</li>
  <li>express</li>
</ul>

Super easy to develop on your own. Will expand this later; pardon the domain name used in dev - it was all I had unused.

Special thanks to https://github.com/tamaspiros/advanced-chat, whose project was my main teacher of node and socket.

## Shut up and let me try it

* Install node & npm (beyond this doc)
* Fork this repo to your own
* Clone to your box (`git init && git clone git@github.com:youruser/FreeStep.git`)

* Change port and host to your own port and IP in `server.js`:
```js
app.set('port', process.env.OPENSHIFT_NODEJS_PORT || 3000);
app.set('ipaddr', process.env.OPENSHIFT_NODEJS_IP || "drunkbroncos.com");
```
* Change port and host to your own port and IP in `public/js/client.js`:
```js
var socket = io.connect("drunkbroncos.com:3000");
```
* Install the app (`npm install`)
* Run the app (`npm start`)
