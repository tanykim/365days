'use strict';

/* select year, then select and customize places to visualize */

angular.module('365daysApp').controller('SetupCtrl', [
    'moment', '_', '$scope', '$http', 'analyzer',
    function (moment, _, $scope, $http, analyzer) {

        //set up process variables
        $scope.completedStepIndex = 0;
        $scope.steps = [
            { label : 'year', title: 'Select a year', style: '', result: '' },
            { title: 'Merge places with a same name', style: '', result: '' },
            { label : 'home', title: 'Select home(s)', style: 'inactive', result: '' },
            { label : 'work', title: 'Select work(s)', style: 'inactive', result: '' },
            { label : 'others', title: 'Select other places', style: 'inactive', result: '' }
        ];

        //selected home and work IDs
        $scope.validYear = [];
        var yearNum = 3; //number of years to check
        var fileNum = 0;

        //places
        $scope.selected = {}; //selected candidates' index, used in checkbox ng-model
        var places = []; //selected place IDs, used for exceptions in calculation places of next steps
        $scope.candidates = {}; //home, work, and other places

        //place name edit
        $scope.isLocationEditCollapsed = true;
        $scope.newLocationNames = [];

        //map
        $scope.map = { center: { lat: 37, lng: -122, zoom: 10 } };

        /***
        **** update steps
        ****/

        function updateStep(stepIndex, result) {
            $scope.completedStepIndex = stepIndex + 1;
            $scope.steps[stepIndex].style = 'done';
            $scope.steps[stepIndex].result = result;
            if (stepIndex < $scope.steps.length - 1) {
                $scope.steps[stepIndex + 1].style = '';
            }
        }

        /***
        **** years at the first steps
        ****/

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
        **** merge duplicate
        ****/

        function mergeDuplicates(duplicates) {
            console.log(duplicates);
        }

        /***
        **** places at the later steps
        ****/

        function getCandidates(type) {

            //get candidates excluding previously selected places
            var selectedIds = _.values(places);
            $scope.candidates[type] = analyzer.getPlaces(type, selectedIds);
            console.log(type, $scope.candidates[type]);
            var count = $scope.candidates[type].length;
            $scope.selected[type]  = _.map(_.range(count), function (i) {
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

        /***
        **** control from HTML
        ****/

        //step 1: load the data JSON file
        $scope.loadFile = function (year) {
            updateStep(0, year);
            $http.get(getUrl(year)).then(function (d) {
                var duplicates = analyzer.getPlaceList(d.data);
                if (duplicates.length > 0) {
                    mergeDuplicates(duplicates);
                } else {
                    updateStep(1, 'not needed');
                    getCandidates('home');
                }
            });
        };

        //from step 2 (selecting home)
        $scope.completeStep = function (stepIndex) {
            var lastStep = $scope.steps[stepIndex].label;

            //get place IDs, results of text for html dislpay at the end of each step
            var results = '';
            _.each($scope.selected[lastStep], function (d, i) {
                if (d) {
                    results = results + $scope.candidates[lastStep][i].name + ', ';
                    places.push($scope.candidates[lastStep][i].id);
                }
            });
            updateStep(stepIndex, results.slice(0, -2)); //remove last ', '

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
        //update location name
        $scope.updateLocationName = function (i, type) {
            $scope.candidates[type][i].name = $scope.newLocationNames[i];
            $scope.newLocationNames[i] = '';
        };
        $scope.clearLocationName = function (i) {
            $scope.newLocationNames[i] = '';
        };

        //testing
        $scope.loadFile(2015);

    }
]);