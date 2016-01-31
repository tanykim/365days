'use strict';

/* select year, then select and customize places to visualize */

angular.module('365daysApp').controller('SetupCtrl', [
    'moment', '_', '$scope', '$http', 'analyzer',
    function (moment, _, $scope, $http, analyzer) {

        $scope.completedStepIndex = 0;
        // $scope.steps = [ 'year', 'home', 'work', 'others'];
        // $scope.done = ['', 'inactive', 'inactive', 'inactive'];
        $scope.steps = [
            { title : 'year', style: '', result: '' },
            { title : 'home', style: 'inactive', result: '' },
            { title : 'work', style: 'inactive', result: '' },
            { title : 'others', style: 'inactive', result: '' }
        ];

        $scope.validYear = [];
        $scope.candidates = {}; //home, work, and other places
        $scope.selected = {}; //selected candidates' index

        var data = null; //JSON object
        var places = {}; //selected home and work IDs

        //selected home and work IDs
        //number of years to check
        var yearNum = 3;
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

        var thisYear = moment().year();

        function getUrl(year) {
            return 'data/places/places_' + year + '.json';
        }

        _.each(_.range(yearNum), function (i) {
            $http.get(getUrl(thisYear - i))
                .then(addYears, addCount);
        });

        function getCandidates(type) {

            //get candidates excluding previously selected places
            var selectedIds = _.flatten(_.values(places));
            $scope.candidates[type] = analyzer.getPlaces(type, data, selectedIds);
            console.log(type, $scope.candidates[type]);
            $scope.selected[type]  = _.map(_.range($scope.candidates[type].length), function (i) {
                return i < 3 ? true : false; //by default choose up to 3 places
            });
        }

        function updateStep(stepIndex, result) {
            $scope.completedStepIndex = stepIndex + 1;
            $scope.steps[stepIndex].style = 'done';
            $scope.steps[stepIndex].result = result;
            if (stepIndex < $scope.steps.length - 1) {
                $scope.steps[stepIndex + 1].style = '';
            }
        }

        //step 1: load the data JSON file
        $scope.loadFile = function (year) {
            updateStep(0, year);
            $http.get(getUrl(year)).then(function (d) {
                data = d.data;
                getCandidates('home');
            });
        };

        //from step 2 (selecting home)
        $scope.completeStep = function (stepIndex) {
            var lastStep = $scope.steps[stepIndex].title;

            //get place IDs at the end of each step
            var results = '';
            places[lastStep] = _.compact(_.map($scope.selected[lastStep], function (d, i) {
                if (d) {
                    results = results + $scope.candidates[lastStep][i].name + ', ';
                    return $scope.candidates[lastStep][i].id;
                }
            }));
            //remove last ', '
            updateStep(stepIndex, results.slice(0, -2));

            //get candidates of next places
            if (stepIndex < $scope.steps.length - 1) {
                getCandidates($scope.steps[stepIndex + 1].title);
            }
        };

        //map
        angular.extend($scope, {
            center: {
                lat: 51.505,
                lng: -0.09,
                zoom: 4
            }
        });

        //testing
        //$scope.loadFile(2015);
    }
]);