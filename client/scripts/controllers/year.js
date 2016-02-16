'use strict';

/* select year, then select and customize places to visualize */

angular.module('365daysApp').controller('YearCtrl', [
    'moment', '_', '$scope', '$http', '$cookies', 'socket', 'analyzer',
    function (moment, _, $scope, $http, $cookies, socket, analyzer) {

        //check already data selected, reset factory variables
        if (analyzer.isAlreadySetup()) {
            analyzer.reset();
        }

        //get valid years first Date
        $scope.validYear = [];
        if ($cookies.get('firstDate')) {
            var firstDate = moment($cookies.get('firstDate'), 'YYYYMMDD');
            $scope.firstDate = firstDate.format('MM ddd, YYYY');
            var firstYear = firstDate.year();
            $scope.validYear = _.map(_.range(moment().year() - firstYear + 1), function (i) {
                return moment().year() - i;
            });
        }


        $scope.style = '';
        $scope.result = '';
        $scope.done = false;

        /***
        **** control from HTML
        ****/

        //step 0: load the data JSON file
        function getUrl(year) {
            return 'data/places/places_' + year + '.json';
        }
        //TODO: update to get the data from API
        //socket io
        console.log(socket);
        $scope.loadFile = function (year) {
            $scope.style = 'done';
            $scope.result = year;
            $http.get(getUrl(year)).then(function (d) {
                analyzer.setYear(year);
                analyzer.getPlaceList(d.data);
                $scope.done = true;
            });
        };
        $scope.revert = function () {
            $scope.style = '';
            $scope.result = '';
            $scope.done = false;
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