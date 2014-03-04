// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/view/ExhaustiveViewContainer',
  'cloudera/Util'
], function(ExhaustiveViewContainer, Util) {
  describe("ExhaustiveViewContainer Tests", function() {
    var id = "searchInput", module, options = {
      selectedView: {
        plots: [{
          name: "blah0",
          tsquery: "select blah0"
        }, {
          name: "blah1",
          tsquery: "select blah1"
        }, {
          name: "blah2",
          tsquery: "select blah1"
        }],
        name: "ExhaustiveViewContainer ViewName"
      },
      saveUrl: "dontcare",
      returnUrl: "dontcare",
      searchInputElement: "#" + id
    };

    beforeEach(function() {
      jasmine.Ajax.useMock();
      clearAjaxRequests();
      $("<input>").attr("type", "text").attr("id", id).appendTo(document.body);
    });

    afterEach(function() {
      module.unsubscribe();
      $("#" + id).remove();
    });

    it("should test selectPlot", function() {
      module = new ExhaustiveViewContainer(options);
      var plot = {
        name: "new plot",
        tsquery: "select new plot"
      };
      // Add it
      $.publish("selectPlot", [plot]);
      expect(module.selectedView.plots.length).toEqual(4);

      // Add again should have no effect.
      $.publish("selectPlot", [plot]);
      expect(module.selectedView.plots.length).toEqual(4);

      // Expect the last plot to be the newly added plot.
      expect(module.selectedView.plots[3]).toEqual(plot);
    });

    it("should test unselectPlot", function() {
      module = new ExhaustiveViewContainer(options);
      var plot = {
        name: "new plot",
        tsquery: "select new plot"
      };
      $.publish("selectPlot", [plot]);
      $.publish("selectPlot", [plot]);
      $.publish("unselectPlot", [plot]);
      expect(module.selectedView.plots.length).toEqual(3);
    });

    it("should test save and succeed", function() {
      spyOn(Util, "setWindowLocation");
      module = new ExhaustiveViewContainer(options);
      module.save();
      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify({
          message: "OK"
        })
      });
      expect(Util.setWindowLocation).wasCalledWith(options.returnUrl);
    });

    it("should test save and fail", function() {
      spyOn($, "publish");
      module = new ExhaustiveViewContainer(options);
      module.save();
      var request = mostRecentAjaxRequest();
      var errorMessage = "Some Failed Message.";
      request.response({
        status: 200,
        responseText: JSON.stringify({
          message: errorMessage
        })
      });
      expect($.publish).wasCalledWith("showError", [errorMessage]);
    });

    it("should test onSearchChanged", function() {
      module = new ExhaustiveViewContainer(options);
      $("#" + id).val("Hello World");
      spyOn($, "publish");

      module.onSearchChanged();

      var waited = false;
      waitsFor(function() {
        var result = waited;
        waited = true;
        return result;
      }, 100);

      runs(function() {
        expect($.publish).wasCalledWith("searchChanged", ["Hello World"]);
      });
    });
  });
});
