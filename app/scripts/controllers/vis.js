'use strict';

/* select year, then select and customize places to visualize */

angular.module('365daysApp').controller('VisCtrl', [
    '$location', '_', 'analyzer',
    function ($location, _, analyzer) {

        //check data created
        if (!analyzer.isAlreadySetup()) {
            $location.path('/setup');
            return false;
        }

        var places = analyzer.getSelectedPlaces();
        // if (_.size(places) === 0) {
        //     $location.path('/setup');
        //     return false;
        // }
        console.log(places);
    }
]);