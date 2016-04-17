'use strict';

module.exports = function(app, server) {

    var _ = require('underscore');
    var socketio = require('socket.io');
    var io = socketio.listen(server);

    var geocoderProvider = 'google';
    var httpAdapter = 'https';
    var settings = require('./config/settings.json');
    var extra = {
        apiKey: settings['google_api'],
        formatter: null
    };
    var geocoder = require('node-geocoder')(geocoderProvider, httpAdapter, extra);

    var locations = [];
    var tripsCount = 0;

    function reverseGeocoding(id, type, lat, lng) {
        geocoder.reverse({ lat:lat, lon:lng }, function (err, res) {
            if (_.isArray(res)) {
                locations.push({
                    id: id,
                    type: type,
                    name: (res[0].city ? (res[0].city + ', ') : '') + res[0].country
                });
            } else {
                locations.push({
                    id: id,
                    type: type,
                    name: lat + ', ' + lng
                });
            }
            //when done, send the results to client
            if (locations.length === tripsCount * 2) {
                io.emit('locations', locations);
            }
        });

    }
    //socket io setting
    io.on('connection', function (socket){

        console.log('socket connected: geocoding');
        socket.on('trips', function (trips) {
            tripsCount = trips.length;
            _.each(trips, function (trip, i) {
                reverseGeocoding(i, 'from', trip.from.lat, trip.from.lon);
                reverseGeocoding(i, 'to', trip.to.lat, trip.to.lon);
            });
        });
    });
};