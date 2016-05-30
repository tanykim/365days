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

    //trip
    var tracedTrips = [];
    var userSetTrips = [];

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
    **** from year.js
    ***/

    // only for testing
    this.setYear = function (year) {
        this.setPeriod(
            moment(year, 'YYYY').startOf('year'),
            moment(year, 'YYYY').endOf('year')
        );
    };

    this.setPeriod = function (st, et) {
        //actual end date if this year is selected
        var thisYearEndDate = et.year() === moment().year() ? moment() : et;
        period = {
            startDate: st,
            endDate: et,
            thisYearEndDate: thisYearEndDate,
            rangeLabel: [st.format('MMMM D, YYYY'), et.format('MMMM D, YYYY')],
            dayCount: et.diff(st, 'days') + 1
        };
    };

    this.getPlaceList = function (data) {

        //sort data by day
        data = _.sortBy(data, function (d) {
            return d.date;
        });

        var prevPlaceLocation = undefined;
        var trips = [];

        var placesGroupedByDay = _.flatten(_.compact(_.map(data, function (day) {
            if (!_.isNull(day.segments)) {

                var placesInDay = _.compact(_.map(day.segments, function (seg, i) {
                    var name = seg.place.name ? seg.place.name : seg.place.type;
                    name = name === 'unknown' ? 'unnamed' : name;

                    //check longitude for travel status
                    if (_.isUndefined(prevPlaceLocation) && day.segments.length - 1 === i) {
                        prevPlaceLocation = seg.place.location;
                        //add the timestamp of the moment of leaving --> needed for place merging
                        prevPlaceLocation.timestamp = moment(seg.endTime, 'YYYYMMDDTHHmmssZ').format('x');
                    }
                    //compare with the place with the previous day, exclude when lat and lon are 0
                    if (!_.isUndefined(prevPlaceLocation) && seg.place.location.lat !== 0 && seg.place.location.lon !== 0) {
                        //roughly one hour timezone difference: longitude 6
                        //include vertical trips too
                        if (Math.abs(prevPlaceLocation.lon - seg.place.location.lon) > 6 ||
                            Math.abs(prevPlaceLocation.lat - seg.place.location.lat) > 6) {
                            //add traveled places, add timestamp of leaving momemnt
                            var toInfo = _.extend(_.clone(seg.place.location), {
                                    timestamp: moment(seg.startTime, 'YYYYMMDDTHHmmssZ').format('x')
                                });
                            trips.push({
                                date: day.date,
                                //timestampe of the date, needed for Google timezone API on the server side
                                timestamp: moment(day.date, 'YYYYMMDD').format('x') / 1000,
                                from: prevPlaceLocation,
                                to: toInfo
                            });
                            prevPlaceLocation = toInfo;
                        }
                    }

                    return {
                        id: seg.place.id,
                        name: name,
                        location: { lat: seg.place.location.lat, lng: seg.place.location.lon },
                        duration: getDuration(seg.startTime, seg.endTime, day.date),
                        atMidnight: day.date !== seg.startTime.substring(0, 8) ? 1 : 0,
                        logs: {
                            dateIndex: toDayIndex(day.date),
                            start: toFormatForVis(seg.startTime, day.date),
                            end: toFormatForVis(seg.endTime, day.date)
                        }
                    };
                }));
                return groupPlacesById(placesInDay);
            }
        })));

        originalAllPlaces = groupPlacesById(placesGroupedByDay);
        allPlaces = angular.copy(originalAllPlaces);
        tracedTrips = trips;
    };

    /***
    **** from places.js
    ***/

    this.getPlaces = function (type) {

        //get candidates excluding previously selected places
        var exceptions = _.flatten(_.values(selectedPlaces));

        //TODO: sort home places by atMidnight first, then duration (nested sorting)
        return _.map(_.sortBy(_.filter(allPlaces, function (place) {
                return !_.contains(exceptions, place.id);
            }), function (place) {
                if (type === 'home') {
                    return place.atMidnight;
                } else {
                    return place.duration;
                }
            }).reverse(), function (place) {
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
    };
    this.resetSelectedPlace = function (type) {
        selectedPlaces[type] = [];
    };
    this.resetAllPlaces = function () {
        allPlaces = _.clone(originalAllPlaces);
    };
    this.resetAllSelectedPlaces = function() {
        selectedPlaces = {};
    };
    this.hasPlacesData = function () {
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
    **** from trips.js
    ***/

    this.getTracedTrips = function () {
        return tracedTrips;
    };
    this.getDateRanges = function () {
        return period;
    };
    this.getRoundTrips = function (tripList) {

        //merge trips if the trip happens within 24 hours -- assuming transfer
        var mergedIds = [];
        _.each(tripList, function (trip, i) {
            if (i > 0) {
                //hours between two trips
                var timeDiff = (trip.timestamp.to - trip.timestamp.from) / 3600000;
                if (timeDiff < 24) {
                    tripList[i - 1].offset.to = trip.offset.to;
                    tripList[i - 1].name.to = trip.name.to;
                    mergedIds.push(i);
                }
            }
        });

        //remove the merged trips from the list
        _.each(mergedIds.reverse(), function (id) {
            tripList.splice(id, 1);
        });

        //create roundTrips
        var roundTrips = [];
        var returnTripIds = [-1];

        //check if it's a return trip from the previous trip
        _.each(tripList, function (trip, i) {
            if (i > 0) {

                var isBtwSameTz = trip.offset.from === tripList[i - 1].offset.to &&
                    trip.offset.to === tripList[i - 1].offset.from;
                var isBtwSameName = trip.name.from === tripList[i - 1].name.to &&
                    trip.name.to === tripList[i - 1].name.from;

                //check with the previous trip that is not the return trip
                if (i - 1 > returnTripIds[returnTripIds.length - 1] && (isBtwSameTz || isBtwSameName)) {
                    roundTrips.push({
                        startDate: tripList[i - 1].date,
                        endDate: trip.date,
                        destination: trip.name.from,
                        offsetDiff: (trip.offset.from - trip.offset.to) / 3600
                    });
                    returnTripIds.push(i);
                }
            }
        });

        //check if the first and last trip are one-way trip
        if (returnTripIds.indexOf(1) === -1) {
            roundTrips.unshift({
                startDate: null,
                endDate: tripList[0].date,
                destination: tripList[0].name.from,
                offsetDiff: (tripList[0].offset.from - tripList[0].offset.to) / 3600
            });
        }
        if (returnTripIds[returnTripIds.length - 1] !== tripList.length - 1) {
            roundTrips.push({
                startDate: tripList[tripList.length - 1].date,
                endDate: null,
                destination: tripList[tripList.length - 1].name.to,
                offsetDiff: (tripList[tripList.length - 1].offset.to - tripList[tripList.length - 1].offset.from) / 3600
            });
        }
        return roundTrips;
    };
    this.setUserSelectedTrips = function (tripList) {
        if (!_.isEmpty(tripList)) {
            userSetTrips = _.map(angular.copy(tripList), function (trip) {
                return {
                    startDateId: _.isNull(trip.startDate) ? -1 : toDayIndex(trip.startDate.format('YYYYMMDD')),
                    //add one more day to indicate the ending moment of the day
                    endDateId: _.isNull(trip.endDate) ?
                        -1 :
                        toDayIndex(angular.copy(trip.endDate).add(1, 'days').format('YYYYMMDD')),
                    destination: trip.destination,
                    offsetDiff: trip.offsetDiff
                };
            });
        }
    };

    /***
    **** from vis.js
    ***/
    this.getDatasetForVis = function () {
        var places = _.object(_.map(selectedPlaces, function (ids, type) {
            var placeObj = _.map(_.map(ids, function (id) {
                return _.findWhere(allPlaces, { id: id });
            }), function (d) {
                d.humanTime = d.humanTime ? d.humanTime : toHourMinute(d.duration);
                return d;
            });
            return [type, placeObj];
        }));

        return {
            period: period,
            places: places,
            trips: userSetTrips
        };
    };

    return this;
}]);
