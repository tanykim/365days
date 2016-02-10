'use strict';

angular.module('365daysApp').factory('visualizer', [
    '_', 'moment', 'd3', function (_, moment, d3) {

    //margin is consistent regardless the size or orientation
    var margin = { top: 200, right: 20, bottom: 100, left: 50 };

    //TODO: check real size of A0 in pixel
    var size = {
        portrait: { w: 800, h: 2000 },
        landscape: { w: 2000, h: 800 }
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
            h: size[options.orientation].h * ( - options.size / 2 + 1) - margin.top - margin.bottom
        };
        console.log(dim);
    };

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

        //TODO: change axis depending on orientation
        var w = dim.w / data.period.dayCount;
        var h = dim.h / 60 / 60;
        _.each(data.places, function (list, type) {
            _.each(list, function (place, i) {
                _.each(place.logs, function (d) {
                    svg.append('rect')
                        .attr('x', d.dateIndex * w)
                        .attr('y', h * d.start)
                        .attr('width', w)
                        .attr('height', h * (d.end - d.start))
                        .attr('class', 'block js-block-' + type + '-' + i)
                        .style('fill', colors[type][i]);
                });
            });
        });
    };

    this.updateColor = function (type, i, c) {
        d3.selectAll('.js-block-' + type + '-' + i).style('fill', c);
    };

    return this;
}]);
