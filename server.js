// modules =================================================
var express        = require('express');
var app            = express();
var favicon        = require('serve-favicon');

// configuration ===========================================
var port = process.env.PORT || 8180; // set our port
app.use(favicon(__dirname + '/public/assets/logo.png'));
app.use(express.static(__dirname + '/public'));


// launch ======================================================================
app.listen(port);
console.log('Listening at port: ' + port);
