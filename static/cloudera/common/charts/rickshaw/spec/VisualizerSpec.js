// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/common/charts/rickshaw/FormatUtils',
  'cloudera/common/charts/rickshaw/Visualizer',
  'underscore'
], function(FormatUtils, Visualizer, _) {

  describe("Visualizer Tests", function() {
    var groupTs = [ {
      data: [{x: 1, y: 1}, {x: 2, y: 2}],
      metadata: {
        label: "Foo"
      }
    }, {
      data: [{x: 2, y: 2}, {x: 3, y: 3}],
      metadata: {
        label: "Bar"
      }
    } ];

    var groupTsWithSameValues = function(v) {
      return [ {
        data: [{x: 1, y: v}, {x: 2, y: v}],
        metadata: {
          label: "Bar"
        }
      }, {
        data: [{x: 2, y: v}, {x: 3, y: v}],
        metadata: {
          label: "Foo"
        }
      } ];
    };

    var options = {
      container: "#chartContainer",
      width: 100,
      height: 60
    };
    var config;

    var dummyGraph = {
      render: function() {},
      configure: function(c) {
        config = c;
      },
      onUpdate: function() {},
      append: function() {}
    };

    var dummyAxisX = {
      render: function() {}
    };

    var dummyAxisY = {
      render: function() {},
      element: {}
    };

    beforeEach(function() {
      $('<div id="chartContainer"><div class="chart"></div></div>').appendTo(document.body);
    });

    afterEach(function() {
      $("#chartContainer").remove();
    });

    it("should call graph.render", function() {
      var viz = new Visualizer(options);
      // mock a dummy graph.
      spyOn(viz, "createGraph").andReturn(dummyGraph);
      spyOn(viz, "createAxisX").andReturn(dummyAxisX);
      spyOn(viz, "createAxisY").andReturn(dummyAxisY);

      spyOn(dummyGraph, "render");

      viz.render(groupTs);
      expect(viz.createGraph).wasCalled();
      expect(dummyGraph.render).wasCalled();
    });

    it("should not show the Y axis", function() {
      var viz = new Visualizer($.extend({}, options, {showYAxis: false}));
      viz.render(groupTs);
      expect(viz.yAxis).toBeUndefined();
    });

    it("should not show the legend by default", function() {
      var viz = new Visualizer(options);
      viz.render(groupTs);
      expect(viz.legend).toBeUndefined();
      expect(viz.legendToggle).toBeUndefined();
      expect(viz.legendHighlight).toBeUndefined();
    });

    it("should show the legend", function() {
      $("#chartContainer").append($('<div class="legend"/>'));
      var viz = new Visualizer($.extend({}, options, {showLegend: true}));
      viz.render(groupTs);
      expect(viz.legend).toBeDefined();
      expect(viz.legendToggle).toBeDefined();
      expect(viz.legendHighlight).toBeDefined();
      $(".legend").remove();
    });

    it("should show the Y-axis with units set", function() {
      var viz = new Visualizer(_.defaults(options, {showYAxis: true}));
      spyOn(viz, 'createAxisY').andReturn(dummyAxisY);
      dummyAxisY.setUnits = jasmine.createSpy('setUnits');
      spyOn(FormatUtils, 'getDistinctUnitsList').andReturn([{
        numerators: ['cats'],
        denominators: ['pants']
      }]);
      viz.render(groupTs);
      expect(dummyAxisY.setUnits).wasCalled();
    });

    it("should call configure", function() {
      var viz = new Visualizer(options);
      spyOn(viz, "createGraph").andReturn(dummyGraph);
      spyOn(viz, "createAxisX").andReturn(dummyAxisX);
      spyOn(viz, "createAxisY").andReturn(dummyAxisY);

      spyOn(dummyGraph, "configure");
      spyOn(dummyGraph, "render");

      viz.render(groupTs);

      viz.update({
        width: 60,
        height: 50
      });

      expect(dummyGraph.configure).wasCalled();
      expect(dummyGraph.render).wasCalled();
    });

    it("should test setting min and max value", function() {
      var newOptions = $.extend({}, options, {
        min: 10,
        max: 20
      });
      var viz = new Visualizer(newOptions);
      spyOn(viz, "createGraph").andReturn(dummyGraph);
      spyOn(viz, "createAxisX").andReturn(dummyAxisX);
      spyOn(viz, "createAxisY").andReturn(dummyAxisY);

      spyOn(dummyGraph, "configure").andCallThrough();
      spyOn(dummyGraph, "render");

      viz.render(groupTs);

      viz.update({
        ymin: 30,
        ymax: 40
      });
      expect(config.min).toEqual(30);
      expect(config.max).toEqual(40);

      viz.update({
        ymin: undefined,
        ymax: 40
      });
      expect(config.min).toEqual(10);
      expect(config.max).toEqual(40);

      viz.update({
        ymin: 15,
        ymax: undefined
      });
      expect(config.min).toEqual(15);
      expect(config.max).toEqual(20);

      viz.update({
        ymin: undefined,
        ymax: undefined
      });
      expect(config.min).toEqual(10);
      expect(config.max).toEqual(20);
    });


    it("should test Y range setting when all the values are identical", function() {
      var viz = new Visualizer(options);
      spyOn(viz, "createGraph").andReturn(dummyGraph);
      spyOn(viz, "createAxisX").andReturn(dummyAxisX);
      spyOn(viz, "createAxisY").andReturn(dummyAxisY);

      spyOn(dummyGraph, "configure");
      spyOn(dummyGraph, "render");

      viz.render(groupTsWithSameValues(0));

      var args = viz.createGraph.mostRecentCall.args[0];
      expect(args.min).toEqual(0);
      expect(args.max).toEqual(1);
    });

    it("should test Y range setting when all the values are not identical", function() {
      var viz = new Visualizer(options);
      spyOn(viz, "createGraph").andReturn(dummyGraph);
      spyOn(viz, "createAxisX").andReturn(dummyAxisX);
      spyOn(viz, "createAxisY").andReturn(dummyAxisY);

      spyOn(dummyGraph, "configure");
      spyOn(dummyGraph, "render");

      viz.render(groupTs);

      var args = viz.createGraph.mostRecentCall.args[0];
      expect(args.min).toBeUndefined();
      expect(args.max).toBeUndefined();
    });

    it("should test Y range setting when ymin, ymax are supplied", function() {
      var newOptions = $.extend({}, options, {
        ymin: 10,
        ymax: 20
      });
      var viz = new Visualizer(newOptions);
      spyOn(viz, "createGraph").andReturn(dummyGraph);
      spyOn(viz, "createAxisX").andReturn(dummyAxisX);
      spyOn(viz, "createAxisY").andReturn(dummyAxisY);

      spyOn(dummyGraph, "configure");
      spyOn(dummyGraph, "render");

      viz.render(groupTsWithSameValues(10));

      var args = viz.createGraph.mostRecentCall.args[0];
      expect(args.min).toEqual(10);
      expect(args.max).toEqual(20);
    });

    it("should test Y range setting for stacked area", function() {
      // use dynamic range
      var newOptions = $.extend({}, options, {
        min: 10,
        max: 20,
        offset: "zero",
        renderer: "area"
      });
      var viz = new Visualizer(newOptions);
      spyOn(viz, "createGraph").andReturn(dummyGraph);
      spyOn(viz, "createAxisX").andReturn(dummyAxisX);
      spyOn(viz, "createAxisY").andReturn(dummyAxisY);

      spyOn(dummyGraph, "configure");
      spyOn(dummyGraph, "render");

      viz.render(groupTsWithSameValues(10));

      var args = viz.createGraph.mostRecentCall.args[0];
      expect(args.min).toEqual(0);
      expect(args.max).toEqual(20);
    });

    it("should test Y range setting for a collapsed dynamic range", function() {
      var newOptions = $.extend({}, options, {
        min: 10,
        max: 10
      });
      var viz = new Visualizer(newOptions);
      spyOn(viz, "createGraph").andReturn(dummyGraph);
      spyOn(viz, "createAxisX").andReturn(dummyAxisX);
      spyOn(viz, "createAxisY").andReturn(dummyAxisY);

      spyOn(dummyGraph, "configure");
      spyOn(dummyGraph, "render");

      viz.render(groupTsWithSameValues(10));

      var args = viz.createGraph.mostRecentCall.args[0];
      expect(args.min).toEqual(0);
      expect(args.max).toEqual(10);
    });

    it("should test Y range setting for bar charts", function() {
      // use dynamic range
      var newOptions = $.extend({}, options, {
        min: 1,
        max: 2,
        offset: "zero",
        renderer: "bar"
      });
      var viz = new Visualizer(newOptions);
      spyOn(viz, "createGraph").andReturn(dummyGraph);
      spyOn(viz, "createAxisX").andReturn(dummyAxisX);
      spyOn(viz, "createAxisY").andReturn(dummyAxisY);

      spyOn(dummyGraph, "configure");
      spyOn(dummyGraph, "render");

      viz.render(groupTs);

      var args = viz.createGraph.mostRecentCall.args[0];
      expect(args.min).toEqual(0);
      expect(args.max).toEqual(2);
    });

    it("should test renderPlaceholder", function() {
      var viz = new Visualizer(options);
      viz.renderPlaceholder();
      expect(viz.$container.find(".chart").children().length).toEqual(0);
      expect(viz.isRendered()).toBeFalsy();
    });

    it("should test render and ensure isRendered returns true", function() {
      var viz = new Visualizer(options);
      // mock a dummy graph.
      spyOn(viz, "createGraph").andReturn(dummyGraph);
      spyOn(viz, "createAxisX").andReturn(dummyAxisX);
      spyOn(viz, "createAxisY").andReturn(dummyAxisY);
      spyOn(dummyGraph, "render");

      expect(viz.isRendered()).toBeFalsy();
      viz.render(groupTs);
      expect(viz.isRendered()).toBeTruthy();
    });
  });
});
