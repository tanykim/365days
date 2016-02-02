'use strict';

angular.module('365daysApp').service('analyzer', [
    '_',
    'moment',
    function (_, moment) {

    /* time convert functions */
    function getDuration(st, et, trim, currentDate) {

        //trim if the segment starts from the previous day or end on the next day
        if (trim) {
            var sDate = +st.substring(0, 8);
            var eDate = +et.substring(0, 8);
            if (+currentDate > sDate) {
                st = currentDate + 'T000000Z';
            } else if (eDate > +currentDate) {
                et = currentDate + 'T000000Z';
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

        //order places by total time stpend, object by place id
        return _.map(_.sortBy(_.map(_.groupBy(placesByDay, function (day) {
                return day.id;
            }), function (placeList) {
                return {
                    id: placeList[0].id,
                    name: placeList[0].name,
                    location: placeList[0].location,
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

    function getPlaceElements(p, trim, date) {
        return {
            id: p.place.id,
            name: p.place.name ?
                p.place.name :
                p.place.type,
            location: { lat: p.place.location.lat, lng: p.place.location.lon },
            duration: getDuration(p.startTime, p.endTime, trim, date)
        };
    }

    function getHome(dayList) {

        var placesByDay = _.compact(_.map(dayList, function (day) {
            //first place of the day - present at midnight
            if (!_.isNull(day.segments) && day.date !== day.segments[0].startTime.substring(0, 8)) {
                var firstPlace = day.segments[0];
                return getPlaceElements(firstPlace, false);
            }
        }));
        return orderPlaces(placesByDay);
    }

    function getAllPlaces(dayList, exceptions) {
        return _.flatten(_.compact(_.map(dayList, function (day) {
                if (!_.isNull(day.segments)) {
                    return _.compact(_.map(day.segments, function (seg) {
                        if (!_.contains(exceptions, seg.place.id)) {
                            return getPlaceElements(seg, true, day.date);
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
