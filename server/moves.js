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

        var sendTokenStatus = function (d) {
            io.emit('tokenStatus', d);
        };

        var getProfile = function (d) {
            if (d.access_token) {
                io.emit('token');
                get('/api/1.1/user/profile?', { access_token: d.access_token }, 'GET', sendProfile);
            } else {
                io.emit('error', d)
            }
        };

        var sendProfile = function (d, params) {
            console.log(d);
            io.emit('profile', { profile: d, token: params.access_token });
        };

        var sendPlaces = function (d) {
            console.log('--sending places data');
            io.emit('places', d);
        };

        function get(path, params, method, callback) {
            var options = {
                host: apiOptions.root,
                port: 443,
                path: path + qs.stringify(params),
                method: method
            };
            var data = '';
            var apiReq = https.request(options, function (apiRes) {
                apiRes.setEncoding('utf8');
                apiRes.on('data', function (chunk) {
                    data = data + chunk;
                });
                apiRes.on('end', function () {
                    var results = JSON.parse(data);
                    console.log('--end');
                    callback(results, params);
                });
                apiRes.on('error', function (err) {
                    console.log('WTF ERR ', err);
                    io.emit('error', { error: 'API error' });
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
            console.log(d);
            get('/oauth/v1/access_token?', params, 'POST', getProfile);
        });

        socket.on('checkToken', function (params) {
            get('/oauth/v1/tokeninfo?', params, 'GET', sendTokenStatus);
        });

        socket.on('places', function (params) {
            console.log('--call places', params.from, params.to);
            get('/api/1.1/user/places/daily?', params, 'GET', sendPlaces)
        });
    });

};