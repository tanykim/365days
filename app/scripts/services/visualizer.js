'use strict';

angular.module('365daysApp').service('visualizer', [
    '_', 'moment', 'd3', function (_, moment, d3) {

    var margin = { top: 20, right: 20, bottom: 20, left: 50 };
    var dim = {
        w: 1000 - margin.left - margin.right,
        h: 180 - margin.top - margin.bottom
    };

    this.drawVis = function () {
        console.log('---vis draw');
        d3.select('#vis').append('svg')
            .attr('width', dim.w + margin.left + margin.right)
            .attr('height', dim.h + margin.top + margin.bottom)
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    };

    this.editVis = function () {
        //edit comes here
        console.log('---vis edit');
    };

    return this;
}]);
