'use strict';

/* select year, then select and customize places to visualize */

angular.module('365daysApp').controller('PlacesCtrl', [
    'moment', '_', '$scope', '$http', '$location', 'analyzer', 'leafletBoundsHelpers',
    function (moment, _, $scope, $http, $location, analyzer, leafletBoundsHelpers) {

        //map - set first to avoid leaflet error
        $scope.map = { center: {} };

        // if (!analyzer.hasPlacesData()) {
        //     $location.path('/year');
        //     return false;
        // } else {
        //     $scope.map = { center: {} };
        // }

        //testing
        var tY = 2015;
        $http.get('data/places/places_' + tY + '.json').then(function (d) {
            analyzer.setYear(tY);
            analyzer.getPlaceList(d.data);
            getCandidates('home');
            // $scope.completeStep(0);
            // $scope.completeStep(1);
            // $scope.completeStep(2);
            // $scope.completeStep(3);
        });

        //markers
        $scope.highlighted = -1;
        var markerNormalColor = 'black';
        var markerSelectedColor = 'blue';
        var markerHighlightedColor = 'red';

        //set up process variables
        $scope.steps = [
            { title: 'Select home(s)', style: '', result: '', label : 'home' },
            { title: 'Select work(s)', style: 'inactive', result: '',label : 'work' },
            { title: 'Select other places', style: 'inactive', result: '', label : 'others' },
            { title: 'Merge places with a same name', style: 'inactive', result: '' },
        ];

        //selected home and work, others IDs
        $scope.candidates = {}; //home, work, and other places
        $scope.selected = {}; //true or false, selected candidates' index, used in checkbox ng-model
        $scope.placeCount = { home: 10, work: 10, others: 10 }; //places count in the candidate list
        var selectUpto = 3; //default number of selection
        $scope.namedPlaces = []; //name places to use auto completion
        $scope.typedPlace = undefined;

        //place name edit
        $scope.isEditCollapsed = true;
        $scope.newLocationNames = [];

        //duplicates
        $scope.duplicates = null; //array of duplicated names
        $scope.merged = []; //selected places index by duplicates id, used in checkbox ng-model
        $scope.mergingAt = 0; //current merging index

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
        **** Map
        ****/

        function getMarkerIcon(i) {

            var markerColor = markerNormalColor;

            //if markers are not for merging places
            if ($scope.steps[3].style === 'inactive') {
                if ($scope.highlighted === -1 && i < selectUpto) {
                    markerColor = markerSelectedColor;
                } else if ( i === $scope.highlighted) {
                    markerColor = markerHighlightedColor;
                }
            }

            return {
                type: 'extraMarker',
                icon: 'fa-star',
                prefix: 'fa',
                shape: 'circle',
                markerColor: markerColor
            };
        }

        function addMarker(place, i, isTypedPlace) {
            var marker = _.extend(place, { icon: getMarkerIcon(i) });
            if (isTypedPlace) {
                //put the markers as the first one if the added place is a typed one
                $scope.map.markers.unshift(marker);
            } else {
                $scope.map.markers.push(marker);
            }
        }

        function putMarkers(placelist) {
            var markers = _.map(placelist, function (p, i) {
                p.icon = getMarkerIcon(i);
                return p;
            });
            $scope.map.markers = angular.copy(markers);
        }

        function setMapBoundaries(placelist) {
            var lats = _.pluck(placelist, 'lat');
            var lngs = _.pluck(placelist, 'lng');
            $scope.map.bounds = leafletBoundsHelpers.createBoundsFromArray([
                [_.max(lats), _.max(lngs)],[_.min(lats), _.min(lngs)]
            ]);
        }

        function locateOnMap(type, i) {

            console.log('---highlighting marker', i);

            //update the previously highlighted marker colors
            var prevMarker = $scope.map.markers[$scope.highlighted];
            if (!_.isUndefined(prevMarker) && !_.isNumber(type)) {
                if ($scope.selected[type][$scope.highlighted]) {
                    prevMarker.icon.markerColor = markerSelectedColor;
                } else {
                   prevMarker.icon.markerColor = markerNormalColor;
                }
            }

            //markers for merging places
            if (!_.isUndefined(prevMarker) && _.isNumber(type)) {
                prevMarker.icon.markerColor = markerSelectedColor;
            }

            //update highlight
            $scope.highlighted = i;

            $scope.map.markers[i].icon.markerColor = markerHighlightedColor;

            //centering map by changing boundaries
            var lat = $scope.map.markers[i].lat;
            var lng = $scope.map.markers[i].lng;
            var offset = 0.04;
            $scope.map.bounds = leafletBoundsHelpers.createBoundsFromArray([
                [lat + offset, lng + offset], [lat - offset, lng - offset]
            ]);

        }

        /***
        **** places at the later steps
        ****/

        function getCandidates(type, isReverted) {

            $scope.candidates[type] = analyzer.getPlaces(type);
            $scope.namedPlaces = _.filter($scope.candidates[type], function (p) {
                return p.name !== 'unnamed';
            });

            //by default choose up to 3 places
            var count = $scope.candidates[type].length;
            $scope.selected[type]  = _.map(_.range(count), function (i) {
                return i < selectUpto ? true : false;
            });

            //remove all markers if it's reverting
            if (isReverted) {
                $scope.map.markers = [];
            }

            //for markers
            var topLocations = _.pluck($scope.candidates[type], 'location').slice(0, 10);
            //set map boundaries
            setMapBoundaries(topLocations);
            //show candidates on map
            putMarkers(topLocations);
        }

        /***
        **** control from HTML
        ****/

        //from step 0 (selecting home)
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
                    var placelist = _.pluck($scope.duplicates[0], 'location');
                    setMapBoundaries(placelist);
                    putMarkers(placelist);
                }
            } else if (stepIndex < $scope.steps.length - 2) { //get candidates of next places
                getCandidates($scope.steps[stepIndex + 1].label);
            } else { //last step
                $scope.done = true;
            }
        };

        //type place to search
        $scope.addTypedPlace = function (item, type) {

            //shoe one more candidate in the list
            $scope.placeCount[type]++;

            //first, remove typed place from the candidate list
            var typedPlaceId = _.findIndex($scope.candidates[type], { id: item.id });
            $scope.candidates[type].splice(typedPlaceId, 1);
            $scope.map.markers.splice(typedPlaceId, 1);

            //add the typed place on top of the current candidate list
            $scope.candidates[type].unshift(item); //add the typed place on top
            $scope.selected[type].unshift(true); //select it by default

            //add a new marker to the newly added place
            console.log('---add marker');
            addMarker($scope.candidates[type][0].location, 0, true);
            locateOnMap(type, 0); //highlight on map
        };

        //check/uncheck candidate
        $scope.updateMarkerColor = function (type, index, placeId) {
            if (!_.isNumber(type)) { //home, work, others markers
                if ($scope.selected[type][index]) {
                    $scope.map.markers[index].icon.markerColor = markerSelectedColor;
                } else {
                    $scope.map.markers[index].icon.markerColor = markerNormalColor;
                }
            } else { //merging place markers
                if ($scope.merged[type][placeId]) {
                    $scope.map.markers[index].icon.markerColor = markerSelectedColor;
                } else {
                    $scope.map.markers[index].icon.markerColor = markerNormalColor;
                }
            }

        };

        //when 'map' is clicked
        $scope.locateOnMap = locateOnMap;

        //delete candidate
        $scope.deleteCandidate = function (type, index) {
            $scope.candidates[type].splice(index, 1);
            $scope.map.markers.splice(index, 1);

            //add a new marker to the newly added place
            var markerCount = $scope.map.markers.length;
            addMarker($scope.candidates[type][markerCount].location, markerCount);
        };

        //update location name
        $scope.updateLocationName = function (type, index) {
            $scope.candidates[type][index].name = $scope.newLocationNames[index];
            $scope.newLocationNames[index] = '';
        };
        $scope.clearLocationName = function (index) {
            $scope.newLocationNames[index] = '';
        };

        //merge locate
        $scope.mergeAt = function (index) { //index in the list
            $scope.mergingAt = index;
            putMarkers(_.pluck($scope.duplicates[index], 'location'));
        };
        $scope.mergeDuplicates = function (index) {
            analyzer.mergeDuplicates(index, _.keys($scope.merged[index]));
            if ($scope.isReadyToMerge && index < $scope.duplicates.length - 1) {
                $scope.mergeAt(index + 1);
            }
        };
        $scope.isReadyToMerge = function (index) {
            return _.size(_.compact($scope.merged[index])) > 1 ? true : false;
        };
        $scope.editMergedPlaces = function (index) {
            analyzer.resetToOriginalDuplicate(index);
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
            getCandidates($scope.steps[index].label, true);
            $scope.done = false;
        };

        //get candidates of home --comment when testing
        //getCandidates('home');
    }
]);