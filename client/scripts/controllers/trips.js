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
                from: d.from,
                to: d.to,
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
            console.log(loc);
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
        $scope.userSetTrips = [];

        //test
        // $scope.loaded = true;
        // $scope.selectedList =
        // $scope.tripList = [{"date":"20150106","from":{"lat":37.3401848315,"lon":-122.010942795},"to":{"lat":36.1182471261,"lon":-115.1543239001},"name":{"from":"Sunnyvale, United States","to":"Las Vegas, United States"}},{"date":"20150110","from":{"lat":36.1182471261,"lon":-115.1543239001},"to":{"lat":37.3401848315,"lon":-122.010942795},"name":{"from":"Las Vegas, United States","to":"Sunnyvale, United States"}},{"date":"20150829","from":{"lat":37.3401848315,"lon":-122.010942795},"to":{"lat":50.0498463566,"lon":8.5814561002},"name":{"from":"Sunnyvale, United States","to":"Frankfurt am Main, Germany"}},{"date":"20150829","from":{"lat":50.0498463566,"lon":8.5814561002},"to":{"lat":60.3160300648,"lon":24.9716455031},"name":{"to":"Vantaa, Finland","from":"Frankfurt am Main, Germany"}},{"date":"20150913","from":{"lat":60.3160300648,"lon":24.9716455031},"to":{"lat":40.6472252762,"lon":-73.7932215488},"name":{"from":"Vantaa, Finland","to":"United States"}},{"date":"20150914","from":{"lat":40.6472252762,"lon":-73.7932215488},"to":{"lat":37.6186123465,"lon":-122.3815549568},"name":{"to":"San Francisco, United States","from":"United States"}},{"date":"20151012","from":{"lat":37.6186123465,"lon":-122.3815549568},"to":{"lat":37.4563964834,"lon":126.4466473998},"name":{"from":"San Francisco, United States","to":"Incheon, South Korea"}},{"date":"20151101","from":{"lat":37.4563964834,"lon":126.4466473998},"to":{"lat":37.6176510517,"lon":-122.3897675034},"name":{"to":"San Francisco, United States","from":"Incheon, South Korea"}},{"date":"20151219","from":{"lat":37.6176510517,"lon":-122.3897675034},"to":{"lat":40.7656199059,"lon":-115.9202142037},"name":{"to":"United States","from":"San Francisco, United States"}},{"date":"20151220","from":{"lat":40.7656199059,"lon":-115.9202142037},"to":{"lat":40.4862048754,"lon":-106.8260737653},"name":{"from":"United States","to":"Steamboat Springs, United States"}}];
        // $scope.selected = _.map(_.range($scope.tripList.length), function () {
        //     return true;
        // });

    }
]);