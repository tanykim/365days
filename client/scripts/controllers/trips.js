'use strict';

/* select year, then select and customize places to visualize */

angular.module('365daysApp').controller('TripsCtrl', [
    'moment', '_', '$scope', '$window', '$location', '$cookies', 'socket', 'analyzer',
    function (moment, _, $scope, $window, $location, $cookies, socket, analyzer) {

        //TODO: status check, and go to the pages
        if (!$cookies.get('firstDate')) {
            $window.location = '/';
            return false;
        } else if (!analyzer.hasPlacesData()) {
            $location.path('/year');
            return false;
        }

        //find traveled places
        $scope.loaded = false;
        var tracedTrips = analyzer.getTracedTrips();
        $scope.tripList = _.map(angular.copy(tracedTrips), function (d) {
            return {
                date: d.date
            };
        });
        $scope.selected = _.map(_.range(tracedTrips.length), function (i) {
            return true;
        });

        socket.emit('trips', tracedTrips);

        var locations = [];
        socket.on('location', function (location) {
            locations.push(location);
            if (locations.length === tracedTrips.length * 2) {
                _.each(locations, function (d) {
                    if (d.type === 'from') {
                        $scope.tripList[d.id].from = d.name;
                    } else {
                        $scope.tripList[d.id].to = d.name;
                    }
                });
                $scope.loaded = true;
            }
        });


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
        var addedTripDate = $scope.minDate.format('YYYYMMDD');
        $scope.setTripDate = function (e) {
            addedTripDate = moment(new Date(e.dt)).format('YYYYMMDD');
        };
        $scope.addTrip = function() {
            $scope.tripList.push({
                date: addedTripDate,
                from: $scope.from,
                to: $scope.to
            });
            $scope.selected.push(true);
        };

        //finalize
        $scope.userSetTrips = [];

    }
]);