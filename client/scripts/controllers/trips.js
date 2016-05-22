'use strict';

/* select year, then select and customize places to visualize */

angular.module('365daysApp').controller('TripsCtrl', [
    'moment', '_', '$scope', '$window', '$location', '$cookies', 'socket', 'analyzer',
    function (moment, _, $scope, $window, $location, $cookies, socket, analyzer) {

        //TODO: status check, and go to the pages
        // if (!$cookies.get('firstDate')) {
        //     $window.location = '/';
        //     return false;
        // } else if (!analyzer.hasPlacesData()) {
        //     $location.path('/year');
        //     return false;
        // }

        if (!analyzer.hasPlacesData()) {
            $location.path('/places');
            return false;
        }

        //find traveled places
        $scope.loaded = false;
        var tracedTrips = analyzer.getTracedTrips();
        $scope.selected = _.map(_.range(tracedTrips.length), function (i) {
            return true;
        });

        //transform TracedTrip with the location name (city, country) acquired from the API on the server side
        //then process with Analyzer to merge trips and get round trips
        var locations = [];
        var singleTrips = _.map(angular.copy(tracedTrips), function (d) {
            return {
                date: moment(d.date, 'YYYYMMDD'),
                timestamp: { from: d.from.timestamp, to: d.to.timestamp },
                name: {},
                offset: { from: null, to: null }
            };
        });
        socket.emit('trips', tracedTrips);
        socket.on('location', function (location) {
            locations.push(location);
            if (locations.length === tracedTrips.length * 2) {
                _.each(locations, function (d) {
                    singleTrips[d.id].name[d.type] = d.name;
                    if (d.timezone.status === 'OK') {
                        singleTrips[d.id].offset[d.type] = d.timezone.rawOffset;
                    }
                });
                $scope.tripList = analyzer.getRoundTrips(singleTrips);
                $scope.loaded = true;
            }
        });

        //remove trip
        $scope.removeTrip = function (index) {
            $scope.tripList.splice(index, 1);
            $scope.selected.splice(index, 1);
        };
        //place name edit
        $scope.isEditCollapsed = true;
        $scope.newLocationNames = [];
        //update location name
        $scope.updateLocationName = function (index) {
            console.log(index, $scope.tripList[index], $scope.newLocationNames[index]);
            $scope.tripList[index].destination = $scope.newLocationNames[index];
            $scope.newLocationNames[index] = '';
        };
        $scope.clearLocationName = function (index) {
            $scope.newLocationNames[index] = '';
        };

        //for date picker
        var dateRange = analyzer.getDateRanges();
        $scope.minDate = dateRange.startDate;
        $scope.maxDate = dateRange.endDate;
        $scope.datePicker = {
            opened: false
        };
        $scope.open = function() {
            $scope.datePicker.opened = true;
        };
        $scope.addedTripDates = [$scope.minDate, $scope.minDate.clone().add(7, 'days')];
        $scope.setTripDate = function (e, index) {
            $scope.addedTripDates[index] = moment(new Date(e.dt));
        };

        //add trip
        var newLocation = { destination: null, startDate: null, endDate: null };
        $scope.searchTripGeocoding = function() {
            console.log($scope.newTrip.typed);
            //valid input
            if ($scope.newTrip.typed) {
                newLocation = { destination: null };
                socket.emit('newTrip', $scope.newTrip.typed);
            }
        };
        $scope.newTrip = { searched: false, newName: {} };
        socket.on('newTripLocation', function (loc) {

            newLocation.destination = loc.name;
            //change to new suggested name
            if (newLocation.name) {
                console.log(newLocation);
                $scope.newTrip.searched = true;
                $scope.newTrip.newName = newLocation.destination;
            }
        });
        //add the new location to trip list
        $scope.addTrip = function (useNewName) {
            console.log(useNewName);
            newLocation.startDate = addedTripDates[0];
            newLocation.endDate = addedTripDates[1];
            var newTripIndex = 0;
            for (var i = 0; i < $scope.tripList.length; i++ ) {
                if ($scope.tripList[i].startDate.diff(anewLocation.endDate, 'days') >= 0) {
                    newTripIndex = i;
                    break;
                }
            }
            //use typed name
            if (!useNewName) {
                newLocation.destination = $scope.newTrip.typed;
            }
            $scope.tripList.splice(newTripIndex, 0, newLocation);
            $scope.selected.splice(newTripIndex, 0, true);

            //reset
            $scope.newTrip = { searched: false, newName: null };
            newLocation = { destination: null };
            $scope.isAddOpen = false;
        };

        //finalize
        $scope.setUserSelectedTrips = function () {
            analyzer.setUserSelectedTrips($scope.tripList);
            $location.path('/canvas');
        };
    }
]);