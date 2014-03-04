// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/common/TimeUtil",
  "cloudera/common/Humanize",
  "underscore",
  "d3"
], function(TimeUtil, Humanize, _, d3) {
  return function(args) {
    var self = this;
    var DATE_WIDTH = 80;

    this.graph = args.graph;
    this.elements = [];
    this.ticksTreatment = args.ticksTreatment || 'plain';

    /**
     * Convert localTime into the timezone that we want
     * to display, which could be server timezone,
     * or browser timezone, or something else.
     */
    var toDisplayDateDomain = function(localTime) {
      return +(Humanize.toDisplayDate(new Date(localTime)));
    };

    this.renderTickTextAt = function(tickText, tickPosition) {
      var element = document.createElement('div');
      element.style.left = tickPosition + 'px';
      element.classList.add('x_tick');
      element.classList.add(self.ticksTreatment);

      var title = document.createElement('div');
      title.classList.add('title');
      title.innerHTML = tickText;
      element.appendChild(title);

      self.graph.element.appendChild(element);
      self.elements.push(element);
    };

    this.render = function() {
      this.elements.forEach( function(e) {
        e.parentNode.removeChild(e);
      } );

      this.elements = [];

      // The number of ticks that we can fit without getting
      // too crowded.
      var maxTickCount = Math.floor(this.graph.width / DATE_WIDTH);

      // A scale that calculates the ticks on the x-axis.
      // The domain of the scale is time shifted to the display timezone.
      // The range of the scale is the pixel offset.
      //
      // Suppose a particular timestamp is 9PM PST on the browser.
      // but the display timezone is in EST, this scale will likely place a
      // tick here because it is midnight.
      var xScale = d3.time.scale()
        .domain(_.map(this.getXDomain(), toDisplayDateDomain))
        .range(this.getXRange());

      // ticks is an array of dates where we want to place ticks.
      var ticks = xScale.ticks(maxTickCount);

      // tickFormat is a function that operates on a date object.
      // The input to xScale.tickFormat must match the input for xScale.ticks.
      var tickFormat = xScale.tickFormat(maxTickCount);

      _.each(ticks, function(tick) {
        self.renderTickTextAt(tickFormat(tick), xScale(tick));
      });
    };

    this.graph.onUpdate(function() {
      self.render();
    } );

    this.getXDomain = function() {
      return this.graph.x.domain();
    };

    this.getXRange = function() {
      return this.graph.x.range();
    };
  };
});
