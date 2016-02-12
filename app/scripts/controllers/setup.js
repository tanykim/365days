'use strict';

/* select year, then select and customize places to visualize */

angular.module('365daysApp').controller('SetupCtrl', [
    'moment', '_', '$scope', '$http', 'analyzer', 'leafletBoundsHelpers',
    function (moment, _, $scope, $http, analyzer, leafletBoundsHelpers) {

        //check already data selected, reset factory variables
        if (analyzer.isAlreadySetup()) {
            analyzer.reset();
        }

        //set up process variables
        $scope.steps = [
            { title: 'Select a year', style: '', result: '' },
            { title: 'Select home(s)', style: 'inactive', result: '', label : 'home' },
            { title: 'Select work(s)', style: 'inactive', result: '',label : 'work' },
            { title: 'Select other places', style: 'inactive', result: '', label : 'others' },
            { title: 'Merge places with a same name', style: 'inactive', result: '' },
        ];

        //year
        $scope.validYear = [];
        var yearNum = 3; //number of years to check
        var fileNum = 0;

        //selected home and work IDs
        $scope.candidates = {}; //home, work, and other places
        $scope.selected = {}; //true or false, selected candidates' index, used in checkbox ng-model
        var selectUpto = 3; //default number of selection

        //place name edit
        $scope.isEditCollapsed = true;
        $scope.newLocationNames = [];

        //duplicates
        $scope.duplicates = null; //array of duplicated names
        $scope.merged = []; //selected places index by duplicates id, used in checkbox ng-model
        $scope.mergingAt = 0; //current merging index

        //map
        $scope.map = { center: { lat: 37, lng: -122, zoom: 10 } };
        $scope.highlighted = -1;
        var markerNormalColor = 'black';
        var markerSelectedColor = 'blue';
        var markerHighlightedColor = 'red';

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

        /***
        **** Map
        ****/

        function getMarkerIcon(i) {

            var markerColor = markerNormalColor;
            if ($scope.highlighted === -1 && i < selectUpto) {
                markerColor = markerSelectedColor;
            } else if ( i === $scope.highlighted) {
                markerColor = markerHighlightedColor;
            }

            return {
                type: 'extraMarker',
                icon: 'fa-star',
                prefix: 'fa',
                shape: 'circle',
                markerColor: markerColor
            };
        }

        function addMarker(place, i) {
            var marker = _.extend(place, { icon: getMarkerIcon(i) });
            $scope.map.markers.push(marker);
        }

        function getMarkers(placelist) {
            //show candidates on map
            var markers = _.map(_.pluck(placelist, 'location').slice(0, 10), function (p, i) {
                p.icon = getMarkerIcon(i);
                return p;
            });

            $scope.map.markers = angular.copy(markers);
            $scope.map.bounds = leafletBoundsHelpers.createBoundsFromArray([
                [_.max(_.pluck($scope.map.markers, 'lat')), _.max(_.pluck($scope.map.markers, 'lng'))],
                [_.min(_.pluck($scope.map.markers, 'lat')), _.min(_.pluck($scope.map.markers, 'lng'))]
            ]);
            $scope.map.center = { lat: markers[0].lat, lng: markers[0].lng };
        }

        /***
        **** places at the later steps
        ****/

        function getCandidates(type) {

            $scope.candidates[type] = analyzer.getPlaces(type);

            //by default choose up to 3 places
            var count = $scope.candidates[type].length;
            $scope.selected[type]  = _.map(_.range(count), function (i) {
                return i < selectUpto ? true : false;
            });

            //show candidates on map
            getMarkers($scope.candidates[type]);
        }

        /***
        **** control from HTML
        ****/

        //step 0: load the data JSON file
        $scope.loadFile = function (year) {
            updateStep(0, year);
            $http.get(getUrl(year)).then(function (d) {
                analyzer.setYear(year);
                analyzer.getPlaceList(d.data);
                getCandidates('home');
            });
        };

        //from step 1 (selecting home)
        $scope.completeStep = function (stepIndex) {

            var lastStep = $scope.steps[stepIndex].label;

            //results of text for html dislpay at the end of each step
            var results = '';
            if (_.isUndefined(lastStep)) { //merged locations
                _.each($scope.merged, function (val, i) {
                    if (_.size(_.compact(val)) > 1) { //2 or more selected
                        results = results + $scope.duplicates[i][0].name + ', ';
                    }
                });
            } else {  //home, work, and others
                var ids = [];
                _.each($scope.selected[lastStep], function (d, i) {
                    if (d) { //get place IDs of home and work
                        var p = $scope.candidates[lastStep][i];
                        results = results + p.name + ', ';
                        ids.push(p.id);
                    }
                });
                //add selected place to Analyzer
                analyzer.addSelectedPlace(lastStep, ids);

            }
            updateStep(stepIndex, results.slice(0, -2)); //remove last ', '

            //call next step functions
            if (stepIndex === $scope.steps.length - 2) { //after all place selection done
                //send selected places and get duplicates
                $scope.duplicates = analyzer.getDuplicates();
                if (_.size($scope.duplicates) === 0) {
                    updateStep(stepIndex + 1, 'not needed');
                    $scope.done = true;
                } else {
                    getMarkers($scope.duplicates[0]);
                }
            } else if (stepIndex < $scope.steps.length - 2) { //get candidates of next places
                getCandidates($scope.steps[stepIndex + 1].label);
            } else { //last step
                $scope.done = true;
            }
        };

        //when "map" is clicked
        $scope.locateOnMap = function (type, i) {

            //update the previously highlighted marker colors
            var prevMarker = $scope.map.markers[$scope.highlighted];
            if (!_.isUndefined(prevMarker)) {
                if ($scope.selected[type][$scope.highlighted]) {
                    prevMarker.icon.markerColor = markerSelectedColor;
                } else {
                   prevMarker.icon.markerColor = markerNormalColor;
                }
            }

            //update highlight
            $scope.highlighted = i;
            $scope.map.markers[i].icon.markerColor = markerHighlightedColor;
            //centering map
            $scope.map.center = {
                lat: $scope.map.markers[i].lat,
                lng: $scope.map.markers[i].lng,
                zoom: 12
            };
        };

        //check/uncheck candidate
        $scope.updateMarkerColor = function (type, index) {
            if ($scope.selected[type][index]) {
                $scope.map.markers[index].icon.markerColor = markerSelectedColor;
            } else {
                $scope.map.markers[index].icon.markerColor = markerNormalColor;
            }
        };

        //delete candidate
        $scope.deleteCandidate = function (type, index) {
            $scope.candidates[type].splice(index, 1);
            $scope.map.markers.splice(index, 1);

            //add a new marker
            var markerCount = $scope.map.markers.length;
            addMarker($scope.candidates[type][markerCount].location, markerCount);
            $scope.locateOnMap(index);
        };

        //update location name
        $scope.updateLocationName = function (i, type) {
            $scope.candidates[type][i].name = $scope.newLocationNames[i];
            $scope.newLocationNames[i] = '';
        };
        $scope.clearLocationName = function (i) {
            $scope.newLocationNames[i] = '';
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
            return _.size(_.compact($scope.merged[index])) > 1 ? true : false;
        };
        $scope.editMergedPlaces = function (index) {
            var temp = analyzer.resetToOriginalDuplicate(index);
            console.log(temp);
        };

        //edit previous steps
        $scope.revertStepTo = function (index) {

            //reset the selected and following steps
            _.each($scope.steps, function (d, i) {
                if (i === index) {
                    d.style = '';
                    d.result = '';
                } else if (i > index) {
                    d.style = 'inactive';
                    d.result = '';
                }
                //reset selected places
                var placeType = $scope.steps[i].label;
                if (i >= index && !_.isUndefined(placeType)) {
                    analyzer.resetSelectedPlace(placeType);
                }
            });

            //revert to all places and candidates to original
            analyzer.resetAllPlaces();
            var type = $scope.steps[index].label;
            $scope.candidates[type] = analyzer.getPlaces(type);

            $scope.done = false;
        };

        //testing
        selectUpto = 4;
        var tY = 2015;
        updateStep(0, tY);
        $http.get(getUrl(tY)).then(function (d) {
            analyzer.setYear(tY);
            analyzer.getPlaceList(d.data);
            getCandidates('home');
            // $scope.completeStep(1);
            // $scope.completeStep(2);
            // $scope.completeStep(3);
            // $scope.completeStep(4);
        });
    }
]);