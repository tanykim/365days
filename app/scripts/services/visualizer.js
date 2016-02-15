'use strict';

angular.module('365daysApp').factory('visualizer', [
    '_', 'moment', 'd3', 'textures', function (_, moment, d3, textures) {

    //TODO: check real size of A0 in pixel
    var size = {
        portrait: { w: 3000, h: 4000 },
        landscape: { w: 4000, h: 3000 }
    };
    var options = { orientation: 'portrait', size: 1 };
    this.getCanvasSettings = function () {
        return options;
    };

    var svg;
    var margin = { top: 200 };
    var dim = {};

    //single bar chart width and height
    var barH = 30;
    var barW = 200;
    var h = barH * 0.4; //bar height
    var placeCountMax;
    var maxTitleWidth = 400; //temporary

    this.setCanvas = function (newOptions, places) {
        options = newOptions;
        placeCountMax = _.max(_.map(places, function (d) {
            return d.length;
        }));
        if (options.orientation === 'landscape') {
            margin.left = 50;
            margin.right = 20;
            //gap includes travel indications and title of bar charts
            margin.gap = 100;
            //bottom includes bar charts area and type title and gap
            margin.bottom = placeCountMax * barH + margin.gap;
        } else {
            margin.left = 200;
            margin.gap = 30;
            margin.right = barW * 2 + maxTitleWidth + 20; //400 is temporary, width of place name
            margin.bottom = 20;
        }
        dim = {
            //set half size of A0 if size is set to A1
            w: size[options.orientation].w * (-options.size / 2 + 1) - margin.left - margin.right,
            h: size[options.orientation].h * (-options.size / 2 + 1) - margin.top - margin.bottom
        };
    };

    this.drawCanvas = function () {
        //draw canvas - keep only one SVG for export later
        svg = d3.select('#vis').append('svg')
            .attr('width', dim.w + margin.left + margin.right)
            .attr('height', dim.h + margin.top + margin.bottom);
    };

    function drawDay(g, startDate, dayUnit, index) {

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
        if (currentDate.day() === 0 || currentDate.date() === 1) { //Sunday of date is 1
            label.push('week');
            text.push(currentDate.date());
        }
        if (currentDate.date() === 1) { //of month
            label.push('month');
            text.push(currentDate.format('MMM'));
        }
        if (currentDate.dayOfYear() === 1) { //or year
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
                g.append('text')
                    .text(t)
                    .attr('x', nx1 + (_.isObject(x1) ? 0 : 2))
                    .attr('y', ny1 + (_.isObject(y1) ? 0 : 2))
                    .attr('class', 'label-' + label[i]);
            }
            if (i === text.length - 1) {
                g.append('line')
                    .attr('x1', nx1)
                    .attr('x2', x2)
                    .attr('y1', ny1)
                    .attr('y2', y2)
                    .attr('class', 'stroke-1 stroke-black');
            }
        });
    }

    function drawElements(g, data, colors) {

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
                    g.append('rect')
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
            drawDay(g, data.period.startDate, dayUnit, i);
        });

        //draw lines of hours
        var hourUnit = units[1] * 60;
        _.each(_.range(25), function (i) {
            if (options.orientation === 'landscape') {
                g.append('line')
                    .attr('x1', 0)
                    .attr('x2', dim.w)
                    .attr('y1', i * hourUnit)
                    .attr('y2', i * hourUnit)
                    .attr('class', 'stroke-1 stroke-axis');
                g.append('text')
                    .text(i)
                    .attr('x', -6)
                    .attr('y', i * hourUnit)
                    .attr('class', 'v-central pos-end');
            } else {
                g.append('line')
                    .attr('x1', i * hourUnit)
                    .attr('x2', i * hourUnit)
                    .attr('y1', 0)
                    .attr('y2', dim.h)
                    .attr('class', 'stroke-1 stroke-axis');
                g.append('text')
                    .text(i)
                    .attr('x', i * hourUnit)
                    .attr('y', -6)
                    .attr('class', 'pos-end');
            }
        });
    }

    function drawBarCharts(svg, data, colors) {

        //draw another below the 365 days graph
        var chartPos = { left: margin.left, top: margin.top + dim.h + margin.gap };
        if (options.orientation === 'portrait') {
            chartPos.left = margin.left + dim.w + margin.gap;
            chartPos.top = margin.top;
        }
        var g = svg.append('g')
                .attr('transform', 'translate(' + chartPos.left + ',' + chartPos.top + ')');

        //update places objects to array
        var placesArray = _.map(angular.copy(data.places), function (places, type) {
            places.type = type;
            return places;
        });

        //chart wrapper array
        var cw = [];
        _.each(placesArray, function (places, i) {

            //chart wrapper
            cw[i] = g.append('g');

            //title
            cw[i].append('text')
                .text(places.type.toUpperCase())
                .attr('x', 0)
                .attr('y', -6)
                .attr('class', 'size-large');

            //places name
            _.each(places, function (p, j) {
                cw[i].append('text') //place name
                    .text(p.name)
                    .attr('x', 0)
                    .attr('y', j * barH + barH / 2)
                    .attr('class', 'size-small v-central js-place-name');
            });
        });

        //get the max width of the title in order to find the position of the bars
        var placeTitles = document.getElementsByClassName('js-place-name');
        maxTitleWidth = _.max(_.pluck(placeTitles, 'clientWidth')) + 12;

        //max bar values
        var durationMaxVal = _.max(_.map(data.places, function (places) {
            return _.max(_.pluck(places, 'duration'));
        }));
        var countMaxVal = _.max(_.map(data.places, function (places) {
            return _.max(_.pluck(places, 'count'));
        }));

        //margin-right update if it's portrait mode
//         if (options.orientation === 'portrait') {
//             margin.right = barW * 2 + maxTitleWidth + 20;
// //            console.log(margin.right);
//         }

        _.each(placesArray, function (places, i) {

            var wrapperPos = {
                left: i * (barW * 2 + maxTitleWidth),
                top: 0
            };
            if (options.orientation === 'portrait') {
                wrapperPos.left = margin.gap;
                wrapperPos.top = i * (placeCountMax * barH + margin.gap);
            }
            //move wrappers to the right width of two bars + place width
            cw[i].attr('transform', 'translate(' + wrapperPos.left + ',' + wrapperPos.top + ')');
            _.each(places, function (p, j) {
                cw[i].append('rect') // duration
                    .attr('x', maxTitleWidth)
                    .attr('y', j * barH + barH / 2 - h / 2)
                    .attr('width', (barW - 20) * p.duration / durationMaxVal)
                    .attr('height', h)
                    .attr('class', 'stroke-none')
                    .style('fill', colors[places.type][j]);
                cw[i].append('rect') // number of days
                    .attr('x', maxTitleWidth + barW)
                    .attr('y', j * barH + barH / 2 - h / 2)
                    .attr('width', (barW - 20) * p.count / countMaxVal)
                    .attr('height', h)
                    .attr('class', 'stroke-none')
                    .style('fill', colors[places.type][j]);
            });
        });
    }

    this.drawVis = function (data, colors) {

        //console.log('---vis draw', colors);
        var g = svg.append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        //title
        g.append('text')
            .text(data.period.dayCount + ' Days')
            .attr('x', 0)
            .attr('y', -margin.top)
            .attr('class', 'title');
        g.append('text')
            .text('From ' + data.period.rangeLabel[0] + ' to ' + data.period.rangeLabel[1])
            .attr('x', 0)
            .attr('y', -margin.top + 60)
            .attr('class', 'headline');

        //draw bar charts
        drawBarCharts(svg, data, colors);

        //draw elements
        drawElements(g, data, colors);
    };

    this.drawColorTextureChip = function (wrapper, color, texture) {
        console.log(texture);
        var t = {};
        if (texture.type === 'line') {
            t = textures.lines().size(texture.size).background(color);
            wrapper.call(t);
        } else if (texture.type === 'circles') {
            t = textures.circles().radius(texture.size).background(color);
            wrapper.call(t);
        } else { // case of 'none'
            t.url = function () { return color; };
        }
        wrapper.append('rect')
            .attr('width', 100)
            .attr('height', 20)
            .style('fill', t.url());
    };

    this.updateColor = function (type, i, c) {
        d3.selectAll('.js-block-' + type + '-' + i).style('fill', c);
    };

    return this;
}]);
