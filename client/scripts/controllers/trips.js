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
        $scope.progress = 0;
        var tracedTrips = analyzer.getTracedTrips();
        $scope.selected = _.map(_.range(tracedTrips.length), function (i) {
            return true;
        });

        //transform TracedTrip in the server 1) add location name (city, country) via reverse geocoding, then
        //2) get timezone (with google timezone api)
        //then process with Analyzer to merge trips and get roundtrips

        $scope.tripList = [];

        function getLocationInfo(id, type) {
            var loc = _.findWhere(angular.copy(locations), { id: id, type: type });
            return {
                name: loc.name,
                offset: loc.timezone.status === 'OK' ? loc.timezone.rawOffset : null
            };
        }

        if (!_.isEmpty(tracedTrips)) {

            //emit each trip, get two locations per trip (from, to)
            socket.emit('trips', tracedTrips);

            var locations = [];
            socket.on('location', function (location) {
                if (location.error) {
                    $scope.error = location.error;
                    $scope.loaded = true;
                } else {
                    locations.push(location);
                    $scope.progress = Math.round(locations.length / (tracedTrips.length * 2) * 100);
                }
                //get round trips when all locations are received
                if (locations.length === tracedTrips.length * 2) {
                    var tripsWithInfo = _.map(angular.copy(tracedTrips), function (d, i) {
                        var fromInfo = getLocationInfo(i, 'from');
                        var toInfo = getLocationInfo(i, 'to');
                        return {
                            date: moment(d.date, 'YYYYMMDD'),
                            timestamp: { from: d.from.timestamp, to: d.to.timestamp },
                            name: { from: fromInfo.name, to: toInfo.name },
                            offset: { from: fromInfo.offset, to: toInfo.offset }
                        };
                    });
                    $scope.tripList = analyzer.getRoundTrips(angular.copy(tripsWithInfo));
                    $scope.loaded = true;
                }
            });
        } else {
            $scope.error = "No trips are found";
            $scope.loaded = true;
        }

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
            $scope.tripList[index].destination = $scope.newLocationNames[index];
            $scope.newLocationNames[index] = '';
        };
        $scope.clearLocationName = function (index) {
            $scope.newLocationNames[index] = '';
        };

        //for date picker
        var dateRange = analyzer.getDateRanges();
        $scope.minDate = dateRange.startDate;
        $scope.maxDate = dateRange.thisYearEndDate.clone().add(-1, 'days');
        $scope.datePicker = [{ opened: false }, { opened: false }];
        $scope.open = function(index) {
            $scope.datePicker[index].opened = true;
        };
        $scope.addedTripDates = [$scope.minDate, $scope.minDate.clone().add(7, 'days')];

        //disable dates previously selected dates
        $scope.dateDisabled = function (date, mode) {
            //check if each date is overlaped with the trip list
            var hasOverlaps = _.size(_.compact(_.map(angular.copy($scope.tripList), function (trip) {
                var inRange = trip.startDate.diff(date, 'days') * trip.endDate.diff(date, 'days');
                return inRange <= 0 ? true : false;
            })));
            return hasOverlaps > 0 && mode === 'day';
        };

        $scope.setTripDate = function (e, index) {
            var nd = moment(new Date(e.dt));
            $scope.addedTripDates[index] = nd;
            //set min and max date of the endDate when startDate is selected
            if (index === 0) {
                $scope.minDate = nd.clone().add(1, 'days');
                if (!_.isEmpty($scope.tripList)) {
                    var maxDateOffset = 0;
                    _.each(_.pluck($scope.tripList, 'startDate'), function (sd) {
                        var diff = sd.diff($scope.minDate, 'days');
                        if (diff > 0) {
                            maxDateOffset = Math.max(diff, maxDateOffset);
                        }
                    });
                    if (maxDateOffset > 0) {
                        $scope.maxDate = $scope.minDate.clone().add(maxDateOffset, 'days');
                    }
                }
                var todayOffset = moment().clone().diff($scope.addedTripDates[0], 'days');
                //if the selected start date is today
                if (todayOffset === 1) {
                    $scope.maxDate = dateRange.thisYearEndDate;
                }
                $scope.addedTripDates[1] = $scope.addedTripDates[0].clone()
                    .add(Math.min(7, todayOffset), 'days');
            }
        };

        //add trip
        var newLocation = { destination: null, startDate: null, endDate: null };
        $scope.searchTripGeocoding = function() {
            //valid input
            if ($scope.newTrip.typed) {
                //no sever error previously
                if (!$scope.error) {
                    newLocation = { destination: null };
                    socket.emit('newTrip', $scope.newTrip.typed);
                } else {
                    $scope.addTrip(false);
                }
            }
            //reset min and max date
            $scope.minDate = dateRange.startDate;
            $scope.maxDate = dateRange.thisYearEndDate;
            //set the next trip after the last endDate
            if (!_.isEmpty($scope.tripList)) {
                var led = $scope.tripList[$scope.tripList.length - 1].endDate;
                $scope.addedTripDates = [led.clone().add(7, 'days'), led.clone().add(14, 'days')];
            }
        };
        $scope.newTrip = { searched: false, newName: null };
        socket.on('newTripLocation', function (loc) {
            if (!loc.error) {
                //change to new suggested name
                newLocation.destination = loc.name;
                $scope.newTrip.searched = true;
                $scope.newTrip.newName = newLocation.destination;
            } else {
                $scope.addTrip(false);
            }
        });
        //add the new location to trip list
        $scope.addTrip = function (useNewName) {
            newLocation.startDate = $scope.addedTripDates[0];
            newLocation.endDate = $scope.addedTripDates[1];

            //TODO: add offsetDiff in the new trip
            newLocation.offsetDiff = '';
            var newTripIndex = 0;
            for (var i = 0; i < $scope.tripList.length; i++) {
                if ($scope.tripList[i].startDate.diff(newLocation.endDate, 'days') <= 0) {
                    newTripIndex = i + 1;
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