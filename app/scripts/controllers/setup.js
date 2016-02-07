'use strict';

/* select year, then select and customize places to visualize */

angular.module('365daysApp').controller('SetupCtrl', [
    'moment', '_', '$scope', '$http', 'analyzer',
    function (moment, _, $scope, $http, analyzer) {

        //set up process variables
        $scope.steps = [
            { label : 'year', title: 'Select a year', style: '', result: '' },
            { title: 'Merge places with a same name', style: '', result: '' },
            { label : 'home', title: 'Select home(s)', style: 'inactive', result: '' },
            { label : 'work', title: 'Select work(s)', style: 'inactive', result: '' },
            { label : 'others', title: 'Select other places', style: 'inactive', result: '' }
        ];

        //year
        $scope.validYear = [];
        var yearNum = 3; //number of years to check
        var fileNum = 0;

        //duplicates
        $scope.duplicates = null; //array of duplicated names
        $scope.merged = []; //selected places index by duplicates id, used in checkbox ng-model
        $scope.mergingAt = 0; //current merging index

        //selected home and work IDs
        $scope.selected = {}; //true or false, selected candidates' index, used in checkbox ng-model
        var places = {}; //selected place IDs, used for exceptions in calculation places of next steps, sent to VisCntl
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

        function getMarkers(placelist) {

            //show candidates on map
            var markers = _.map(_.pluck(placelist, 'location'), function (m, i) {
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
            console.log(markers);
            $scope.map.center = { lat: markers[0].lat, lng: markers[0].lng, zoom: 10 };
        }

        /***
        **** duplicated place names
        ****/

        function getDuplicates(data) {
            $scope.duplicates = analyzer.getPlaceList(data);
            if (_.size($scope.duplicates) === 0) {
                updateStep(1, 'not needed');
                getCandidates('home');
            }
            getMarkers($scope.duplicates[0]);
        }

        /***
        **** places at the later steps
        ****/

        function getCandidates(type) {

            //get candidates excluding previously selected places
            var selectedIds = _.flatten(_.values(places));
            $scope.candidates[type] = analyzer.getPlaces(type, selectedIds);
            var count = $scope.candidates[type].length;
            $scope.selected[type]  = _.map(_.range(count), function (i) {
                return i < 3 ? true : false; //by default choose up to 3 places
            });

            //show candidates on map
            getMarkers($scope.candidates[type]);
        }

        /***
        **** control from HTML
        ****/

        //step 1: load the data JSON file
        $scope.loadFile = function (year) {
            updateStep(0, year);
            $http.get(getUrl(year)).then(function (d) {
                getDuplicates(d.data);
            });
        };

        //merge locate
        $scope.mergeAt = function (index) {
            $scope.mergingAt = index;
            getMarkers($scope.duplicates[index]);
        };
        $scope.mergeDuplicates = function (index) {
            analyzer.mergeDuplicates(index, _.keys($scope.merged[index]));
        };
        $scope.isReadyToMerge = function (index) {
            return _.size(_.keys($scope.merged[index])) > 1 ? true : false;
        };

        //from step 2 (selecting home)
        $scope.completeStep = function (stepIndex) {
            var lastStep = $scope.steps[stepIndex].label;

            //results of text for html dislpay at the end of each step
            var results = '';
            if (_.isUndefined($scope.steps[stepIndex].label)) { //merged locations
                _.each($scope.merged, function (val, i) {
                    if (_.size(val) > 0) {
                        results = results + $scope.duplicates[i][0].name + ', ';
                    }
                });
            } else {  //home, work, and others
                places[lastStep] = [];
                _.each($scope.selected[lastStep], function (d, i) {
                    if (d) { //get place IDs of home and work
                        results = results + $scope.candidates[lastStep][i].name + ', ';
                        places[lastStep].push($scope.candidates[lastStep][i].id);
                    }
                });
            }
            updateStep(stepIndex, results.slice(0, -2)); //remove last ', '

            //get candidates of next places
            if (stepIndex < $scope.steps.length - 1) {
                getCandidates($scope.steps[stepIndex + 1].label);
            } else {
                $scope.done = true;
                analyzer.setSelectedPlaces(places);
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