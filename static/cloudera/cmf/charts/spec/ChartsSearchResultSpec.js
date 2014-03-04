// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/Util',
  'cloudera/chart/TimeRange',
  'cloudera/cmf/charts/ChartsSearchResult',
  'cloudera/common/UrlParams'

], function(Util, TimeRange, ChartsSearchResult, UrlParams) {
  describe("ChartsSearchResult Tests", function() {
    var module,
      request,
      resultId = "chartsResultContainer",
      typeSelectorId = "chartTypeSelector", options = {
      container: "#" + resultId,
      timeRange: new TimeRange(new Date(1), new Date(2)),
      addPlotUri: "dontcare",
      plot: {
        title: "Original Title"
      }
    };

    beforeEach(function() {
      jasmine.Ajax.useMock();
      clearAjaxRequests();
      $('<div id="' + resultId + '">').appendTo(document.body);
      $('<div class="plot-title">').appendTo($("#" + resultId));
      $('<div class="saved-view-link-container" style="display:none"><span class="user-defined">Saved To View: <a href="#"></a></span><span class="system-defined">Saved To View.</span></div>').appendTo($("#" + resultId));
      $('<div id="' + typeSelectorId + '" class="chart-type-selector"></div>').appendTo($("#" + resultId));
    });

    afterEach(function() {
      $("#" + resultId).remove();
      module.unsubscribe();
    });

    it("should render something", function() {
      module = new ChartsSearchResult(options);
      spyOn(module.plotContainer, "render");

      module.render("SOME QUERY");
      request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify([ {
          tsquery: "SOME QUERY",
          data: [{x: 1, y: 1}],
          metadata: {
            attributes: {}
          }
        } ])
      });

      expect(module.plotContainer.render).wasCalled();
    });

    it("should add to view", function() {
      module = new ChartsSearchResult(options);

      $.publish("addToView", ["Some View"]);
      spyOn($, "publish");

      var view = {
        name: "Some View",
        userCreated: true
      };

      request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify({
          message: "OK",
          data: view
        })
      });

      expect($.publish).wasCalledWith("viewAdded", ["Some View", view]);
      var $userDefined = $("#" + resultId).find(".saved-view-link-container .user-defined");
      var $systemDefined = $("#" + resultId).find(".saved-view-link-container .system-defined");

      expect($userDefined.is(":visible")).toBeTruthy();
      expect($systemDefined.is(":visible")).toBeFalsy();

      var $savedLink = $userDefined.find("a");
      expect($savedLink.attr("href")).toEqual("view?viewName=Some+View");
      expect($savedLink.text()).toEqual("Some View");
    });

    it("should add to view but because it is not user defined, don't show it anywhere", function() {
      module = new ChartsSearchResult(options);

      $.publish("addToView", ["Some View"]);
      spyOn($, "publish");

      var view = {
        name: "Some View",
        userCreated: false
      };

      request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify({
          message: "OK",
          data: view
        })
      });

      expect($.publish).wasNotCalled();
      var $userDefined = $("#" + resultId).find(".saved-view-link-container .user-defined");
      var $systemDefined = $("#" + resultId).find(".saved-view-link-container .system-defined");

      expect($userDefined.is(":visible")).toBeFalsy();
      expect($systemDefined.is(":visible")).toBeTruthy();
    });

    it("should add to view but fail", function() {
      module = new ChartsSearchResult(options);

      $.publish("addToView", ["SomeView"]);
      spyOn($, "publish");

      request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify({
          message: "failed"
        })
      });

      expect($.publish).wasCalledWith("showError", ["failed"]);
    });

    it("should change the tsquery", function() {
      module = new ChartsSearchResult(options);

      spyOn(module, "render");
      $.publish("tsqueryChanged", ["NEW QUERY"]);

      expect(module.render).wasCalledWith("NEW QUERY", /*skipTitleUpdate=*/false);
    });

    it("should change the chartType", function() {
      module = new ChartsSearchResult(options);

      spyOn(module.plotContainer, "setChartType");
      $.publish("chartTypeChanged", ["stackarea"]);

      expect(module.plotContainer.setChartType).wasCalledWith("stackarea");
    });

    it("should test savePlot", function() {
      var newOptions = $.extend({}, {
        viewName : "myViewName",
        returnUrl : "dontcare"
      }, options);
      module = new ChartsSearchResult(newOptions);

      spyOn($, "post").andCallThrough();

      module.savePlot({
        tsquery: "New Query"
      });

      var params = $.post.mostRecentCall.args[1];
      expect(params.viewName).toEqual(newOptions.viewName);
      expect(params.oldPlotJson).toEqual('{"title":"Original Title"}');
      expect(params.newPlotJson).toEqual('{"tsquery":"New Query"}');

      spyOn(Util, "setWindowLocation");

      request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify({
          message: "OK"
        })
      });

      expect(Util.setWindowLocation).wasCalled();
    });

    it("should test skipTitleUpdate=true", function() {
      module = new ChartsSearchResult(options);

      module.render("Some Query", /*skipTitleUpdate=*/true);
      expect($(options.container).find(".plot-title").val()).toEqual("");
    });

    it("should test skipTitleUpdate=false", function() {
      module = new ChartsSearchResult(options);

      module.render("Some Query", /*skipTitleUpdate=*/false);
      expect($(options.container).find(".plot-title").val()).toEqual("Some Query");
    });

    it("should test skipTitleUpdate=false", function() {
      module = new ChartsSearchResult(options);

      module.render("Some Query");
      expect($(options.container).find(".plot-title").val()).toEqual("Some Query");
    });

    it("should test skipTitleUpdate=false but in edit mode", function() {
      module = new ChartsSearchResult($.extend({}, options, {
        mode: "edit"
      }));

      module.render("Some Query");
      expect($(options.container).find(".plot-title").val()).toEqual("Original Title");
    });

    it("should update the url when tsquery changes", function() {
      module = new ChartsSearchResult(options);
      spyOn(UrlParams, "set");
      $.publish("tsqueryChanged", ["NEW QUERY"]);
      expect(UrlParams.set).wasCalledWith("tsquery", "NEW QUERY");
    });

    it("should update the url when chart type changes", function() {
      module = new ChartsSearchResult(options);
      spyOn(UrlParams, "set");
      $.publish("chartTypeChanged", ["bar"]);
      expect(UrlParams.set).wasCalledWith("chartType", "bar");
    });

    it("should update the url when range changes", function() {
      module = new ChartsSearchResult(options);
      spyOn(UrlParams, "set");
      $.publish("chartRangeChanged", ["100", "200"]);
      expect(UrlParams.set).wasCalledWith({ymin:"100", ymax:"200"});
    });

  });
});
