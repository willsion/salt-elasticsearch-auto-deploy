// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
/*global Rickshaw: true */
define([
  "cloudera/common/Humanize",
  "underscore",
  "cloudera/common/charts/rickshaw/FormatUtils",
  "d3",
  "rickshaw"
], function(Humanize, _, FormatUtils, d3) {

  return function(options) {
    var args = _.defaults({}, options, {
      yFormatter : function(y) {
        return y.toFixed(2);
      },
      formatter: function(series, x, y, formattedX, formattedY, d) {
        $(this.element).find(".x_label").css("top", this.graph.height + "px");
        var label = series.name.split(",").join("<br>");
        var swatch = '<span class="detail_swatch" style="background-color: ' + series.color + '"></span>';
        var formattedDate = Humanize.humanizeDateTimeMedium(new Date(x));
        // Format the y value, returns the formatted value and its units.
        var originalY = d && d.value && d.value.originalY;
        formattedY = FormatUtils.formatYValueForHoverDetail(series, y, originalY);
        var rawYValue = FormatUtils.rawYValueForHoverDetail(series, y, originalY);
        if (rawYValue && formattedY !== rawYValue) {
          rawYValue = " (" + rawYValue + ")";
        } else {
          rawYValue = "";
        }
        return '<span>' + swatch + ' ' + label + '<br>' + formattedY + rawYValue + '<br>' + formattedDate + '</span>';
      }
    });
    var hoverDetail = new Rickshaw.Graph.HoverDetail(args);

    /**
     * This function is a copy of Rickshaw.Graph.HoverDetail.update
     * This change is two fixes from https://github.com/shutterstock/rickshaw/issues/78
     * as well as a fix of my own to use >= in a comparison to allow us to see values
     * of 0. This mostly works, though it's something we might continue to play with,
     * and it's something where what we decide to do with the y-axis setting matters.
     */
    hoverDetail.update = function(e) {
      e = e || this.lastEvent;
      if (!e) {
        return;
      }
      this.lastEvent = e;

      if (!e.target.nodeName.match(/^(path|svg|rect)$/)) {
        return;
      }

      var graph = this.graph;

      var eventX = e.offsetX || e.layerX;
      var eventY = e.offsetY || e.layerY;

      var domainX = graph.x.invert(eventX);
      var stackedData = graph.stackedData;

      var topSeriesData = stackedData.slice(-1).shift();

      var domainIndexScale = d3.scale.linear()
        .domain([topSeriesData[0].x, topSeriesData.slice(-1).shift().x])
        .range([0, topSeriesData.length]);

      var approximateIndex = Math.floor(domainIndexScale(domainX));
      var dataIndex = Math.min(approximateIndex || 0, stackedData[0].length - 1);

      var i = approximateIndex;
      while (i < stackedData[0].length - 1) {

        if (!stackedData[0][i] || !stackedData[0][i + 1]) {
          break;
        }

        if (stackedData[0][i].x <= domainX && stackedData[0][i + 1].x > domainX) {
          dataIndex = i;
          break;
        }

        if (stackedData[0][i + 1] <= domainX) {
          i += 1;
        } else {
          i -= 1;
        }
      }

      domainX = stackedData[0][dataIndex].x;
      var graphX = graph.x(domainX);
      var order = 0;

      var detail = graph.series.active().map(function(s) {
        return {
          order: order++,
          series: s,
          name: s.name,
          value: s.stack[dataIndex]
        };
      }).filter(function(s) {
        return (s.value.type !== "fake");
      });

      var activeItem;

      var sortFn = function(a, b) {
        return (a.value.y0 + a.value.y) - (b.value.y0 + b.value.y);
      };

      var graphMin = graph.min;
      if (graphMin === undefined) {
        graphMin = 0;
      }
      var domainMouseY = graph.y.magnitude.invert(graph.element.offsetHeight - eventY) + graphMin;

      detail.sort(sortFn).forEach( function(d) {

        d.formattedYValue = (this.yFormatter.constructor === Array) ?
          this.yFormatter[detail.indexOf(d)](d.value.y) :
          this.yFormatter(d.value.y);

        d.graphX = graphX;
        d.graphY = graph.y(d.value.y0 + d.value.y);

        if (domainMouseY >= graphMin && domainMouseY <= d.value.y0 + d.value.y && !activeItem) {
          activeItem = d;
          d.active = true;
        }

      }, this );

      this.element.innerHTML = '';
      this.element.style.left = graph.x(domainX) + 'px';

      if (this.visible && detail.length > 0) {
        this.render( {
          detail: detail,
          domainX: domainX,
          // Don't show anything for the X tooltip.
          formattedXValue: '',
          mouseX: eventX,
          mouseY: eventY
        } );
      }
    };
    return hoverDetail;
  };
});
