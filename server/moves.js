'use strict';

module.exports = function(app, server) {

    var socketio = require('socket.io');
    var io = socketio.listen(server);
    var https = require('https');
    var qs = require('querystring');
    var settings = require('./config/settings.json');

    var apiOptions = {
        protocol: 'https://',
        root: 'api.moves-app.com',
        clientId: settings['client_id'],
        clientSecret: settings['client_secret']
    };

    //socket io setting
    io.on('connection', function (socket){
        console.log('socket connected');

        socket.on('authenticate', function (){
            io.emit('url', {
                url: apiOptions.protocol + apiOptions.root + '/oauth/v1/authorize?' +
                    'response_type=code' +
                    '&client_id=' + apiOptions.clientId +
                    '&scope=location'
                });
        });

        function getProfile(token) {
            var options = {
                host: apiOptions.root,
                port: 443,
                path: '/api/1.1/user/profile?access_token=' + token,
                method: 'GET'
            };
            var data = '';
            var apiReq = https.request(options, function (apiRes) {
                apiRes.setEncoding('utf8');
                apiRes.on('data', function (chunk) {
                    data += chunk;
                });
                apiRes.on('end', function () {
                    console.log(JSON.parse(data));
                    io.emit('profile', {
                        profile: JSON.parse(data),
                        token: token
                    });
                });
                apiRes.on('error', function (err) {
                    console.log('WTF ERR ', err);
                });
            });
            apiReq.end();
        }

        socket.on('code', function (d) {
            var params = {
                'grant_type':'authorization_code',
                'code': d.code,
                'client_id': apiOptions.clientId,
                'client_secret': apiOptions.clientSecret
            };
            var options = {
                host: apiOptions.root,
                port: 443,
                path: '/oauth/v1/access_token?' + qs.stringify(params),
                method: 'POST'
            };
            var data = '';
            var apiReq = https.request(options, function (apiRes) {
                apiRes.setEncoding('utf8');
                apiRes.on('data', function (chunk) {
                    data += chunk;
                });
                apiRes.on('end', function () {
                    var results = JSON.parse(data);
                    console.log(results);
                    if (results.access_token) {
                        io.emit('token');
                        getProfile(results.access_token);
                    } else {
                        io.emit('error', results)
                    }
                });
                apiRes.on('error', function (err) {
                    console.log('WTF ERR ', err);
                    io.emit('error', { error: 'API error' });
                });
            });
            apiReq.end();
        });
    });

};