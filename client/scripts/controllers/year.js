'use strict';

/* select year, then select and customize places to visualize */

angular.module('365daysApp').controller('YearCtrl', [
    'moment', '_', '$scope', '$http', 'analyzer',
    function (moment, _, $scope, $http, analyzer) {

        //check already data selected, reset factory variables
        if (analyzer.isAlreadySetup()) {
            analyzer.reset();
        }

        $scope.style = '';
        $scope.result = '';
        $scope.done = false;

        $scope.validYear = [];
        var yearNum = 3; //number of years to check
        var fileNum = 0;

        function checkYearCount() {
            if (fileNum === yearNum) {
                $scope.validYear.sort().reverse();
            }
        }
        function addYears(d) {
            $scope.validYear.push(d.config.url.substr(19, 4));
            fileNum = fileNum + 1;
            checkYearCount();
        }

        function addCount() {
            fileNum = fileNum + 1;
            checkYearCount();
        }

        function getUrl(year) {
            return 'data/places/places_' + year + '.json';
        }

        _.each(_.range(yearNum), function (i) {
            $http.get(getUrl(moment().year() - i))
                .then(addYears, addCount);
        });

        /***
        **** control from HTML
        ****/

        //step 0: load the data JSON file
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