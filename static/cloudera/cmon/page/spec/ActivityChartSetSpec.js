// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/Util",
  "cloudera/chart/TimeRange",
  "cloudera/cmf/view/ViewContainer",
  "cloudera/cmon/page/ActivityChartSet"
], function(Util, TimeRange, ViewContainer, ActivityChartSet) {

  describe("ActivityChartSet Tests", function() {

    var module,
      id = "activityChartSet", viewContainer,
      viewContainerId = "viewContainer",
      baseOptions = {
        container: "#" + id,
        serviceName: "myServiceName",
        viewContainer: viewContainer
      };

    beforeEach(function() {
      jasmine.Ajax.useMock();
      clearAjaxRequests();
      $("<div>").attr("id", id).appendTo(document.body);
      $("<div>").attr("id", viewContainerId).appendTo(document.body);
      viewContainer = new ViewContainer({
        container: "#" + viewContainerId,
        timeRange: new TimeRange(new Date(1), new Date(2)),
        view: {
          plots: [ {
            tsquery: "foo"
          } ]
        },
        enableFacets: false
      });
    });

    afterEach(function() {
      module.unsubscribe();
      viewContainer.unsubscribe();
      $("#" + id).remove();
      $("#" + viewContainerId).remove();
    });

    it("should initialize the ActivityChartSet object", function() {
      var options = $.extend({
        viewContainer: viewContainer
      }, baseOptions);
      module = new ActivityChartSet(options);
      // Initially, parentSelected should be true, no activityContexts.
      expect(module.parentSelected()).toEqual(true);
      expect(module.activityContexts().length).toEqual(0);
    });

    it("should respond to the parentSelected change", function() {
      var options = $.extend({
        viewContainer: viewContainer
      }, baseOptions);
      module = new ActivityChartSet(options);
      spyOn(viewContainer, "render").andCallThrough();

      expect(module.parentSelected()).toBeTruthy();

      module.parentSelected(false);
      expect(module.parentSelected()).toBeFalsy();
      expect(viewContainer.render.callCount).toEqual(1);
      expect(viewContainer.plotContainers[0].getViewModel().tsquery()).toEqual('{"activityIds":[],"activityMetricIds":[]}');

      module.parentSelected(true);
      expect(module.parentSelected()).toBeTruthy();
      expect(viewContainer.render.callCount).toEqual(2);
      expect(viewContainer.plotContainers[0].getViewModel().tsquery()).toEqual('{"activityIds":[],"activityMetricIds":[],"serviceName":"myServiceName","clusterMetricIds":[]}');
    });

    it("should respond to the event setChartDescriptors", function() {
      // Only Cluster level metrics.
      var options = $.extend({
        viewContainer: viewContainer
      }, baseOptions);
      module = new ActivityChartSet(options);

      var chartDescriptors = [ {
        metric: {
          context: "ACTIVITY",
          id: 33,
          name: "Foo",
          activityType: "MR"
        },
        chart: {
          id: "Foo Chart",
          name: "Foo Chart Title"
        }
      }, {
        metric: {
          context: "CLUSTER",
          id: 55,
          name: "Bar",
          activityType: "Oozie"
        },
        chart: {
          id: "Bar Chart",
          name: "Bar Chart Title"
        }
      } ];

      $.publish("setChartDescriptors", [chartDescriptors]);
      var expected = '{"activityIds":[],"activityMetricIds":[33],"serviceName":"myServiceName","clusterMetricIds":[]}';
      expect(viewContainer.plotContainers[0].getViewModel().tsquery()).toEqual(expected);
      expected = '{"activityIds":[],"activityMetricIds":[],"serviceName":"myServiceName","clusterMetricIds":[55]}';
      expect(viewContainer.plotContainers[1].getViewModel().tsquery()).toEqual(expected);
    });

    it("should respond to the event addContext", function() {
      var options = $.extend({
        viewContainer: viewContainer
      }, baseOptions);
      module = new ActivityChartSet(options);
      spyOn(module, "refreshCharts").andCallThrough();

      var context = {
        context: "ACTIVITY",
        id: "FooBar Metric",
        name: "FooBar",
        activityType: "Pig"
      };
      $.publish("addContext", [context]);
      expect(module.refreshCharts).wasCalled();
      expect(module.refreshCharts.callCount).toEqual(1);
      expect(module.activityContexts().length).toEqual(1);

      // Add again and this time refreshCharts should not be called again
      // so the callCount should remain to be 1.
      $.publish("addContext", [context]);
      expect(module.refreshCharts.callCount).toEqual(1);

      // Now remove the context, this should trigger refreshCharts
      // so the callCount should be 2.
      module.activityContexts()[0].remove();
      expect(module.activityContexts().length).toEqual(0);
      expect(module.refreshCharts.callCount).toEqual(2);
    });

    it("should respond to the event layoutResized", function() {
      var options = $.extend({
        viewContainer: viewContainer
      }, baseOptions);
      module = new ActivityChartSet(options);
      spyOn(viewContainer, "setDimension");

      $.publish("layoutResized", ["east", $("#" + id)]);
      expect(viewContainer.setDimension).wasCalled();
    });

    it("should compute the tsquery when there is a parentId", function() {
      var options = $.extend({
        viewContainer: viewContainer,
        "parentId": "123"
      }, baseOptions);
      module = new ActivityChartSet(options);

      var chartDescriptors = [ {
        metric: {
          context: "ACTIVITY",
          id: "Foo Metric",
          name: "Foo",
          activityType: "MR"
        },
        chart: {
          id: "Foo Chart",
          title: "Foo Chart Title"
        }
      }, {
        metric: {
          context: "CLUSTER",
          id: "Bar Metric",
          name: "Bar",
          activityType: "Oozie"
        },
        chart: {
          id: "Bar Chart",
          title: "Bar Chart Title"
        }
      } ];

      $.publish("setChartDescriptors", [chartDescriptors]);
      expect(viewContainer.plotContainers[0].getViewModel().tsquery()).toEqual('{"activityIds":["123"],"activityMetricIds":["Foo Metric"]}');
    });
  });
});
