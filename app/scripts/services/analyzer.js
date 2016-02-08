'use strict';

angular.module('365daysApp').factory('analyzer', [
    '_',
    'moment',
    function (_, moment) {

    //list of all places
    var allPlaces = [];
    var selectedPlaces = {};
    var duplicates = [];
    var originalAllPlaces = [];
    var originalDuplicates = [];

    function getDuration(st, et, currentDate) {

        //trim if the segment starts from the previous day or end on the next day
        var sDate = +st.substring(0, 8);
        var eDate = +et.substring(0, 8);

        if (+currentDate > sDate) {
            st = currentDate + 'T000001';
        } else if (eDate > +currentDate) {
            et = currentDate + 'T235959';
        }
        return Math.round(moment(et, 'YYYYMMDDTHHmmss')
            .diff(moment(st, 'YYYYMMDDTHHmmss'), 'minutes', true));

    }

    function toHourMinute(m) {
        var hour = Math.floor(m / 60);
        var minute = m % 60;
        return hour + ' hour' + (hour > 1 ? 's ' : ' ') +
            minute + ' minute' + (minute > 1 ? 's ' : ' ');
    }

    function sum(list) {
        return _.reduce(list, function (memo, num) {
                return memo + num;
            }, 0);
    }

    function groupPlacesById(list) {
        return _.map(_.groupBy(list, function (p) {
            return p.id;
        }), function (g, id) {
            return {
                id: id,
                name: g[0].name,
                location: g[0].location,
                duration: sum(_.pluck(g, 'duration')),
                atMidnight: sum(_.pluck(g, 'atMidnight')),
                logs: _.flatten(_.pluck(g, 'logs')),
                //count is always 1 when group by day
                count: g[0].count ? sum(_.pluck(g, 'count')) : 1
            };
        });
    }

    this.getPlaceList = function (data) {
        var placesGroupedByDay = _.flatten(_.compact(_.map(data, function (day) {
                if (!_.isNull(day.segments)) {
                    var placesInDay = _.compact(_.map(day.segments, function (seg) {
                        var name = seg.place.name ? seg.place.name : seg.place.type;
                        name = name === 'unknown' ? 'unnamed' : name;
                        return {
                            id: seg.place.id,
                            name: name,
                            location: { lat: seg.place.location.lat, lng: seg.place.location.lon },
                            duration: getDuration(seg.startTime, seg.endTime, day.date),
                            atMidnight: day.date !== seg.startTime.substring(0, 8) ? 1 : 0,
                            logs: { date: day.date, start: seg.startTime, end: seg.endTime }
                        };
                    }));
                    return groupPlacesById(placesInDay);
                }
            })));

        originalAllPlaces = groupPlacesById(placesGroupedByDay);
        allPlaces = angular.copy(originalAllPlaces);
        console.log(_.size(originalAllPlaces), _.size(allPlaces));
    };

    this.getPlaces = function (type) {

        //get candidates excluding previously selected places
        var exceptions = _.flatten(_.values(selectedPlaces));

        return _.map(_.sortBy(_.filter(allPlaces, function (place) {
                return !_.contains(exceptions, place.id);
            }), function (place) {
                if (type === 'home') {
                    return place.atMidnight;
                } else {
                    return place.duration;
                }
            }).reverse().slice(0, 10), function (place) {
                place.humanTime = toHourMinute(place.duration);
                return place;
            });
    };

    this.getDuplicates = function () {

        var selectedPlacesIds = _.flatten(_.values(selectedPlaces));

        //Check same names with different IDs of selected places
        originalDuplicates = _.filter(_.omit(_.groupBy(allPlaces, function (d) {
            return d.name;
        }), 'unnamed'), function (places) {
            var ids = _.pluck(places, 'id');
            var commonIds = _.intersection(selectedPlacesIds, ids);
            //find only one common ids --> 2 or more means selected places with same name
            return commonIds.length === 1 && places.length > 1;
        });

        duplicates = angular.copy(originalDuplicates);
        return duplicates;
    };

    this.mergeDuplicates = function (index, ids) {

        //get place with the highest count number
        var placeWithMaxCount = _.max(duplicates[index], function (p) {
            return p.count;
        });
        //get place objects with the ids and update them into the id with highest count;
        var checkedPlaces = _.map(duplicates[index], function (p) {
            if (_.contains(ids, p.id)) {
                p.id = placeWithMaxCount.id;
            }
            return p;
        });
        var newMergedPlace = groupPlacesById(checkedPlaces);

        //replace duplicated places with the new place
        allPlaces = _.filter(_.clone(allPlaces), function (p) {
            return !_.contains(ids, p.id);
        }).concat(newMergedPlace);

        //send merged duplicates to the view
        duplicates[index] = _.filter(_.clone(duplicates[index]), function (p) {
            return p.id === newMergedPlace.id;
        }).concat(newMergedPlace);
    };

    /***
    **** from setup.js
    ***/
    this.addSelectedPlace = function (type, ids) {
        selectedPlaces[type] = ids;
    };

    //when edit happens
    this.resetToOriginalDuplicate = function (index) {
        duplicates[index] = angular.copy(originalDuplicates[index]);
        return originalDuplicates[index];
    };
    this.resetSelectedPlace = function (type) {
        selectedPlaces[type] = [];
    };
    this.resetAllPlaces = function () {
        allPlaces = _.clone(originalAllPlaces);
    };
    this.isAlreadySetup = function () {
        return _.isEmpty(originalAllPlaces) ? false : true;
    };
    this.reset = function () {
        allPlaces = [];
        selectedPlaces = {};
        duplicates = [];
        originalAllPlaces = [];
        originalDuplicates = [];
    };

    /***
    **** from vis.js
    ***/
    this.getSelectedPlaces = function () {
        return _.object(_.map(selectedPlaces, function (ids, type) {
            var placeObj = _.map(ids, function (id) {
                return _.findWhere(allPlaces, { id: id });
            });
            return [type, placeObj];
        }));
    };

    return this;
}]);
