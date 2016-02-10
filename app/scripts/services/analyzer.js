'use strict';

angular.module('365daysApp').factory('analyzer', [
    '_',
    'moment',
    function (_, moment) {

    //period of dataset
    var period = {};

    //list of all places
    var allPlaces = [];
    var selectedPlaces = {};
    var duplicates = [];
    var originalAllPlaces = [];
    var originalDuplicates = [];

    function getDuration(st, et, currentDate) {

        //trim if the segment starts from the previous day or end on the next day
        var sDate = +st.substr(0, 8);
        var eDate = +et.substr(0, 8);

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

    function toDayIndex(date) {
        var startDate = period.startDate;
        //index(day count) from the start date
        return moment(date, 'YYYYMMDD').diff(startDate, 'days');
    }

    function toFormatForVis(t, currentDate) {
        var date = +t.substr(0, 8);
        var hms = t.substr(9, 4);
        if (+currentDate > date) {
            hms = '0000';
        } else if (date > +currentDate) {
            hms = '2400';
        }
        //convert to HHmm to minutes
        return (+hms.substr(0, 2) * 60) + (+hms.substr(2, 2));
    }

    function sum(list) {
        return _.reduce(list, function (memo, num) {
                return memo + num;
            }, 0);
    }

    function setPeriod(st, et) {
        period = {
            startDate: st,
            rangeLabel: [st.format('MMMM D, YYYY'), et.format('MMMM D, YYYY')],
            dayCount: et.diff(st, 'days') + 1
        };
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

    /***
    **** from setup.js
    ***/

    this.setYear = function (year) {
        setPeriod(
            moment(year, 'YYYY').startOf('year'),
            moment(year, 'YYYY').endOf('year')
        );
    };

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
                            logs: { dateIndex: toDayIndex(day.date), start: toFormatForVis(seg.startTime, day.date), end: toFormatForVis(seg.endTime, day.date) }
                        };
                    }));
                    return groupPlacesById(placesInDay);
                }
            })));

        originalAllPlaces = groupPlacesById(placesGroupedByDay);
        allPlaces = angular.copy(originalAllPlaces);
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
    // var colors = {
    //     home: ['#db59a0', '#eb7e58', '#eb535a', '#ebcd53'], //warm color
    //     work: ['#4fa6ce', '#5dd5ba', '#527cb0', '#96d070'], //cold color
    //     others: ['#666666', '#8c8c8c', '#b3b3b3', '#d9d9d9'] //grey HSB B- 40, 55, 70, 85%
    // };
    this.getDatasetForVis = function () {
        var places = _.object(_.map(selectedPlaces, function (ids, type) {
            var placeObj = _.map(_.map(ids, function (id) {
                return _.findWhere(allPlaces, { id: id });
            }), function (d) {
                d.humanTime = d.humanTime ? d.humanTime : toHourMinute(d.duration);
                // d.color = colors[type][i % colors[type].length];
                return d;
            });
            return [type, placeObj];
        }));

        return {
            period: period,
            places: places
        };
    };

    return this;
}]);
