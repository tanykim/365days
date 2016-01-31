'use strict';

angular.module('365daysApp').service('analyzer', [
    '_',
    'moment',
    function (_, moment) {


    /* time convert functions */
    function getDuration(st, et, trim) {

        //trim if the segment starts from the previous day or end on the next day
        if (trim) {
            var sDate = +st.substring(0, 8);
            var eDate = +et.substring(0, 8);
            if (eDate - sDate === 1) {
                st = eDate.toString() + 'T000000Z';
            } else if (eDate - sDate === 1) {
                et = eDate.toString() + 'T000000Z';
            }
        }
        return moment(et, 'YYYYMMDDThhmmssZ').diff(moment(st, 'YYYYMMDDThhmmssZ'), 'minutes');
    }

    function toHourMinute(m) {
        var hour = Math.floor(m / 60);
        var minute = m % 60;
        return hour + ' hour' + (hour > 1 ? 's ' : ' ') +
            minute + ' minute' + (minute > 1 ? 's ' : ' ');
    }

    function orderPlaces(placesByDay) {
        return _.map(_.sortBy(_.map(_.groupBy(placesByDay, function (day) {
            return day.id;
        }), function (placeList) {
            return {
                id: placeList[0].id,
                name: placeList[0].name,
                totalMinute: _.reduce(_.pluck(placeList, 'duration'), function (memo, num) {
                    return memo + num;
                }, 0),
                count: _.size(placeList)
            };
        }), function (place) {
            return place.totalMinute;
        }).reverse().slice(0, 10), function (place) {
            place.duration = toHourMinute(place.totalMinute);
            delete place.totalMinute;
            return place;
        });
    }

    function getHome(dayList) {

        var placesByDay = _.compact(_.map(dayList, function (day) {
            console.log(day);
            //first place of the day - present at midnight
            if (!_.isNull(day.segments) && day.date !== day.segments[0].startTime.substring(0, 8)) {
                var firstPlace = day.segments[0];
                return {
                    id: firstPlace.place.id,
                    name: firstPlace.place.name ?
                        firstPlace.place.name :
                        firstPlace.place.type,
                    duration: getDuration(firstPlace.startTime, firstPlace.endTime, false)
                };
            }
        }));

        return orderPlaces(placesByDay);
    }

    function getAllPlaces(dayList, exceptions) {
        return _.flatten(_.compact(_.map(dayList, function (day) {
                    if (!_.isNull(day.segments)) {
                        return _.compact(_.map(day.segments, function (seg) {
                            if (!_.contains(exceptions, seg.place.id)) {
                                return {
                                    id: seg.place.id,
                                    name: seg.place.name ?
                                        seg.place.name :
                                        seg.place.type,
                                    duration: getDuration(seg.startTime, seg.endTime, true)
                                };
                            }
                        }));
                    }
                })));
    }

    this.getPlaces = function (type, data, exceptions) {
        if (type === 'home') {
            return getHome(data);
        } else {
            var allPlaces = getAllPlaces(data, exceptions);
            return orderPlaces(allPlaces);
        }
    };

    return this;
}]);
