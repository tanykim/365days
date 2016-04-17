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
        socket.emit('trips', tracedTrips);
        var locations = [];
        $scope.tripList = _.map(angular.copy(tracedTrips), function (d) {
            return {
                date: moment(d.date, 'YYYYMMDD'),
                name: {}
            };
        });
        socket.on('location', function (location) {
            locations.push(location);
            if (locations.length === tracedTrips.length * 2) {
                _.each(locations, function (d) {
                    $scope.tripList[d.id].name[d.type] = d.name;
                });
                $scope.loaded = true;
            }
        });

        //remove trip
        $scope.removeTrip = function (index) {
            $scope.tripList.splice(index, 1);
            $scope.selected.splice(index, 1);
        };
        //merge with the previous trip
        $scope.mergeTrips = function (index) {
            $scope.tripList[index - 1].to = $scope.tripList[index].to;
            $scope.tripList[index - 1].name.to = $scope.tripList[index].name.to;
            //remove the merged trip index
            $scope.tripList.splice(index, 1);
            $scope.selected.splice(index, 1);
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
        var addedTripDate = $scope.minDate;
        $scope.setTripDate = function (e) {
            addedTripDate = moment(new Date(e.dt));
        };

        //add trip
        var newLocation = { name: {} };
        $scope.searchTripGeocoding = function() {
            //valid input
            if ($scope.newTrip.typed.from && $scope.newTrip.typed.to) {
                newLocation = { name: {} };
                socket.emit('newTrip', $scope.newTrip.typed);
            }
        };
        $scope.newTrip = { searched: false, newName: {} };
        socket.on('newTripLocation', function (loc) {
            newLocation.name[loc.type] = loc.name;
            //change to new suggested name
            if (newLocation.name.from && newLocation.name.to) {
                console.log(newLocation);
                $scope.newTrip.searched = true;
                $scope.newTrip.newName = newLocation.name;
            }
        });
        //add the new location to trip list
        $scope.addTrip = function (useNewName) {
            newLocation.date = addedTripDate;
            var newTripIndex = 0;
            for (var i = 0; i < $scope.tripList.length; i++ ) {
                if ($scope.tripList[i].date.diff(addedTripDate, 'days') >= 0) {
                    newTripIndex = i;
                    break;
                }
            }
            //use typed name
            if (!useNewName) {
                newLocation.name = $scope.newTrip.typed;
            }
            $scope.tripList.splice(newTripIndex, 0, newLocation);
            $scope.selected.splice(newTripIndex, 0, true);

            //reset
            $scope.newTrip = { searched: false, newName: {} };
            newLocation = { name: {} };
            $scope.isAddOpen = false;
        };

        //finalize
        $scope.setUserSelectedTrips = function () {
            analyzer.setUserSelectedTrips($scope.tripList);
            $location.path('/canvas');
        };
    }
]);