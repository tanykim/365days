'use strict';

angular.module('365daysApp').factory('visualizer', [
    '_', 'moment', 'd3', function (_, moment, d3) {

    //margin is consistent regardless the size or orientation
    var margin = { top: 200, right: 20, bottom: 100, left: 200 };

    //TODO: check real size of A0 in pixel
    var size = {
        portrait: { w: 800, h: 4000 },
        landscape: { w: 4000, h: 800 }
    };
    var options = { orientation: 'landscape', size: 0 };
    var dim = {
        w: size[options.orientation].w - margin.left - margin.right,
        h: size[options.orientation].h - margin.top - margin.bottom
    };

    this.getCanvasSettings = function () {
        return options;
    };

    this.setCanvas = function (newOptions) {
        console.log(newOptions);
        options = newOptions;
        dim = {
            //set half size of A0 if size is set to A1
            w: size[options.orientation].w * (-options.size / 2 + 1) - margin.left - margin.right,
            h: size[options.orientation].h * (-options.size / 2 + 1) - margin.top - margin.bottom
        };
        console.log(dim);
    };

    function drawDay(svg, startDate, dayUnit, index) {

        //offset from the rectangle composed of the blocks to put text
        //and positions of elements
        var offset = {};
        var x1, x2, y1, y2;
        if (options.orientation === 'landscape') {
            offset = { year: -60, month: -40, week: -10, day: 0 };
            x1 = dayUnit * index;
            x2 = dayUnit * index;
            y1 = offset;
            y2 = dim.h;
        } else {
            offset = { year: -120, month: -60, week: -20, day: 0 };
            x1 = offset;
            x2 = dim.w;
            y1 = dayUnit * index;
            y2 = dayUnit * index;
        }

        //add labels at the beginning of year, month, week
        var label = ['day'];
        var text = [''];
        var currentDate = startDate.clone().add(index, 'days');
        if (currentDate.day() === 0 ? true : false) { //begining of the week
            label.push('week');
            text.push(currentDate.date());
        }
        if (currentDate.date() === 1 ? true : false) { //of month
            label.push('month');
            text.push(currentDate.format('MMM'));
        }
        if (currentDate.dayOfYear() === 1 ? true : false) { //or year
            label.push('year');
            text.push(currentDate.year());
        }

        //put text and lines
        _.each(text, function (t, i) {

            //set position of line and text
            var nx1 = _.isObject(x1) ? x1[label[i]] : x1;
            var ny1 = _.isObject(y1) ? y1[label[i]] : y1;

            if (text) { //put year, month, and sunday date
                //2 is the distance from the line
                svg.append('text')
                    .text(t)
                    .attr('x', nx1 + (_.isObject(x1) ? 0 : 2))
                    .attr('y', ny1 + (_.isObject(y1) ? 0 : 2))
                    .attr('class', 'label-' + label[i]);
            }
            if (i === text.length - 1) {
                svg.append('line')
                    .attr('x1', nx1)
                    .attr('x2', x2)
                    .attr('y1', ny1)
                    .attr('y2', y2)
                    .attr('class', 'stroke-1 stroke-black');
            }
        });
    }

    function drawElements(svg, data, colors) {

        console.log(data.period.startDate);

        function getUnits() {
            if (options.orientation === 'landscape') {
                return [dim.w / data.period.dayCount, dim.h / 60 / 24];
            } else {
                return [dim.h / data.period.dayCount, dim.w / 60 / 24];
            }
        }

        //diff setting depending on orientation
        function getVals(d, dayUnit, minuteUnit) {
            if (options.orientation === 'landscape') {
                return {
                    x: d.dateIndex * dayUnit,
                    y: minuteUnit * d.start,
                    w: dayUnit,
                    h: minuteUnit * (d.end - d.start)
                };
            } else {
                return {
                    x: minuteUnit * d.start,
                    y: d.dateIndex * dayUnit,
                    w: minuteUnit * (d.end - d.start),
                    h: dayUnit
                };
            }
        }

        //get unit size of day and minute
        var units = getUnits();
        var dayUnit = units[0];

        //draw each block of place
        _.each(data.places, function (list, type) {
            _.each(list, function (place, i) {
                _.each(place.logs, function (d) {
                    var vals = getVals(d, dayUnit, units[1]);
                    svg.append('rect')
                        .attr('x', vals.x)
                        .attr('y', vals.y)
                        .attr('width', vals.w)
                        .attr('height', vals.h)
                        .attr('class', 'block js-block-' + type + '-' + i)
                        .style('fill', colors[type][i]);
                });
            });
        });

        //draw lines and labels of each day, month, year
        _.each(_.range(data.period.dayCount), function (i) {
            drawDay(svg, data.period.startDate, dayUnit, i);
        });

    }

    this.drawVis = function (data, colors) {

        console.log('---vis draw', colors);

        //draw canvas
        var svg = d3.select('#vis').append('svg')
            .attr('width', dim.w + margin.left + margin.right)
            .attr('height', dim.h + margin.top + margin.bottom)
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        //title
        svg.append('text')
            .text(data.period.dayCount + ' Days')
            .attr('x', 0)
            .attr('y', -margin.top)
            .attr('class', 'title');
        svg.append('text')
            .text('From ' + data.period.rangeLabel[0] + ' to ' + data.period.rangeLabel[1])
            .attr('x', 0)
            .attr('y', -margin.top + 60)
            .attr('class', 'headline');

        //draw elements
        drawElements(svg, data, colors);
    };

    this.updateColor = function (type, i, c) {
        d3.selectAll('.js-block-' + type + '-' + i).style('fill', c);
    };

    return this;
}]);
