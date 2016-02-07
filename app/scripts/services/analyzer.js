'use strict';

angular.module('365daysApp').factory('analyzer', [
    '_',
    'moment',
    function (_, moment) {

    //list of all places
    var allPlaces = [];
    var duplicates = {};
    var selectedPlaces = {};

    function getDuration(st, et, currentDate) {

        //trim if the segment starts from the previous day or end on the next day
        var sDate = +st.substring(0, 8);
        var eDate = +et.substring(0, 8);
        if (+currentDate > sDate) {
            st = currentDate + 'T000000Z';
        } else if (eDate > +currentDate) {
            et = currentDate + 'T235959Z';
        }
        return moment(et, 'YYYYMMDDThhmmssZ').diff(moment(st, 'YYYYMMDDThhmmssZ'), 'minutes');
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
                //count is always 1 when group by day
                count: g[0].count ? sum(_.pluck(g, 'count')) : 1
            };
        });
    }

    this.getPlaceList = function (data) {
        var placesGroupedByDay = _.flatten(_.compact(_.map(data, function (day) {
                if (!_.isNull(day.segments)) {
                    var placesInDay = _.compact(_.map(day.segments, function (seg) {
                        return {
                            id: seg.place.id,
                            name: seg.place.name ? seg.place.name : seg.place.type,
                            location: { lat: seg.place.location.lat, lng: seg.place.location.lon },
                            duration: getDuration(seg.startTime, seg.endTime, day.date),
                            atMidnight: day.date !== seg.startTime.substring(0, 8) ? 1 : 0,
                        };
                    }));
                    return groupPlacesById(placesInDay);
                }
            })));

        var all = groupPlacesById(placesGroupedByDay);
        allPlaces = all;

        //Check same names with different IDs
        duplicates = _.filter(_.omit(_.groupBy(all, function (d) {
            return d.name;
        }), 'unknown'), function (places) {
            return places.length > 1;
        });

        return duplicates;

    };

    this.mergeDuplicates = function (index, ids) {

        //get place objects with the ids and update them into the same id;
        var checkedPlaces = _.map(duplicates[index], function (p) {
            if (_.contains(ids, p.id)) {
                p.id = ids[0];
            }
            return p;
        });
        var newMergedPlace = groupPlacesById(checkedPlaces);

        //replace duplicated places with the new place
        allPlaces = _.filter(_.clone(allPlaces), function (p) {
            return !_.contains(ids, p.id);
        }).concat(newMergedPlace);

        //send merged duplicates to the view
        duplicates[index] = _.filter(duplicates[index], function (p) {
            return p.id === newMergedPlace.id;
        }).concat(newMergedPlace);

    };

    this.getPlaces = function (type, exceptions) {

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

    this.setSelectedPlaces = function (d) {
        selectedPlaces = d;
    };

    this.getSelectedPlaces = function () {
        return selectedPlaces;
    };

    return this;
}]);
