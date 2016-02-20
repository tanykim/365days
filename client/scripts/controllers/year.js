'use strict';

/* select year, then select and customize places to visualize */

angular.module('365daysApp').controller('YearCtrl', [
    'moment', '_', '$scope', '$window', '$location', '$http', '$cookies', 'socket', 'analyzer',
    function (moment, _, $scope, $window, $location, $http, $cookies, socket, analyzer) {

        //check cookies
        if (!$cookies.get('firstDate')) {
            $window.location = '/';
        }

        $scope.progress = 0;
        $scope.style = '';
        $scope.result = '';
        $scope.done = false;

        //get valid years and first Date
        $scope.validYear = [];
        if ($cookies.get('firstDate')) {
            $scope.minDate = moment($cookies.get('firstDate'), 'YYYYMMDD');
            $scope.firstDate = $scope.minDate.format('MMMM DD, YYYY');
            var firstYear = $scope.minDate.year();
            $scope.validYear = _.map(_.range(moment().year() - firstYear + 1), function (i) {
                return moment().year() - i;
            });
        }

        //for date picker
        $scope.initDate = moment().subtract(1, 'years');
        $scope.maxDate = moment().subtract(1, 'days');
        $scope.datePicker = {
            opened: false
        };
        $scope.open = function() {
            $scope.datePicker.opened = true;
        };

        //365 days range, actual data range, data recived from the server
        var range365;
        var ranges = [];
        var dataFromServer = [];

        //set dates from input
        function getRanges(startDate, endDate) {
            ranges = [];
            dataFromServer = [];
            range365 = [startDate.clone(), endDate.clone()];

            //trim range if it's out of min-max date
            if ($scope.minDate.diff(startDate, 'days') > 0) {
                startDate = $scope.minDate;
            }
            if ($scope.maxDate.diff(endDate, 'days') < 1) {
                endDate = $scope.maxDate;
            }
            //start with one day earlier to make the array of ranges
            startDate = startDate.clone().subtract(1, 'days');
            //var ranges = [];
            do {
                ranges.push([
                    startDate.add(1, 'days').format('YYYYMMDD'),
                    startDate.add(30, 'days').format('YYYYMMDD')
                ]);
            } while (
                endDate.diff(startDate, 'days', true) >= 1
            );
            //update the last ending date with the end of the range
            ranges[ranges.length - 1][1] = endDate.format('YYYYMMDD');

            $scope.downloading = true;

            //call server
            _.each(ranges, function (range, i) {
                console.log('calling data for ', i, range[0], range[1]);
                socket.emit('places', {
                    from: range[0],
                    to: range[1],
                    access_token: $cookies.get('token')
                });
            });
        }

        //getting data from server
        socket.on('places', function (d) {

            console.log('---adding data', dataFromServer.length);
            dataFromServer.push(d);
            $scope.progress = Math.round(dataFromServer.length / ranges.length * 100);

            if (ranges.length === dataFromServer.length) {
                console.log('received all data for',
                    (Math.ceil(range365[1].diff(range365[0], 'days', true)) + 1), ' days');
                $scope.downloading = false;
                $scope.style = 'done';
                $scope.result = (Math.ceil(range365[1].diff(range365[0], 'days', true)) + 1)+
                    ' days from ' + range365[0].format('MMMM DD, YYYY') +
                    ' to ' + range365[1].format('MMMM DD, YYYY');

                //set period and make places objects in Analyzer
                analyzer.setPeriod(range365[0], range365[1]);
                analyzer.getPlaceList(_.flatten(dataFromServer));
                $scope.done = true;
            }
        });

        /***
        **** control from HTML
        ****/

        //TODO: disable input while downloading
        $scope.setYear = function (year) {
            var startDate = moment(new Date(year, 0, 1));
            var endDate = moment(new Date(year + 1, 0, 1)).subtract(1, 'days');
            getRanges(startDate, endDate);
        };

        function getUrl(year) {
            return 'data/places/places_' + year + '.json';
        }
        $scope.loadFile = function (year) {
            $scope.style = 'done';
            $scope.result = year;
            $http.get(getUrl(year)).then(function (d) {
                analyzer.setYear(year);
                analyzer.getPlaceList(d.data);
                $scope.done = true;
            });
        };

        $scope.setStartDate = function (e) {
            var startDate = moment(new Date(e.dt));
            var endDate = startDate.clone().add(1, 'years').subtract(1, 'days');
            getRanges(startDate, endDate);
        };

        $scope.revert = function () {
            $scope.style = '';
            $scope.result = '';
            $scope.done = false;
            ranges = [];
            dataFromServer = [];
        };

        //testing
        // var tY = 2015;
        // $scope.style = 'done';
        // $scope.result = tY;
        // $scope.done = true;
        // $http.get(getUrl(tY)).then(function (d) {
        //     analyzer.setYear(tY);
        //     analyzer.getPlaceList(d.data);
        // });
    }
]);