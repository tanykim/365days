'use strict';

/* select year, then select and customize places to visualize */

angular.module('365daysApp').controller('SetupCtrl', [
    'moment', '_', '$scope', '$http', 'analyzer',
    function (moment, _, $scope, $http, analyzer) {

        //set up process variables
        $scope.completedStepIndex = 0;
        $scope.steps = [
            { label : 'year', title: 'Select a year', style: '', result: '' },
            { label : 'home', title: 'Select home(s)', style: 'inactive', result: '' },
            { label : 'work', title: 'Select work(s)', style: 'inactive', result: '' },
            { label : 'others', title: 'Select other places', style: 'inactive', result: '' }
        ];
        $scope.validYear = [];
        $scope.candidates = {}; //home, work, and other places
        $scope.selected = {}; //selected candidates' index

        var data = null; //JSON object
        var places = {}; //selected home and work IDs

        //map
        $scope.map = { center: { lat: 37, lng: -122, zoom: 10 } };

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

            //show candidates on map
            var markers = _.map(_.pluck($scope.candidates[type], 'location'), function (m, i) {
                m.icon = {
                    type: 'extraMarker',
                    icon: 'fa-star',
                    prefix: 'fa',
                    shape: 'circle',
                    markerColor: i < 3 ? 'red' : 'blue'
                };
                return m;
            });
            $scope.map.markers = markers;
            $scope.map.center = { lat: markers[0].lat, lng: markers[0].lng, zoom: 10 };
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
            var lastStep = $scope.steps[stepIndex].label;

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
                getCandidates($scope.steps[stepIndex + 1].label);
            }
        };

        //centering map
        $scope.recenterMap = function (i) {
            $scope.map.center = {
                lat: $scope.map.markers[i].lat,
                lng: $scope.map.markers[i].lng,
                zoom: 12,
            };
        };

        //testing
        //$scope.loadFile(2015);

    }
]);