// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/view/ViewList',
  'cloudera/chart/TimeRange'
], function(ViewList, TimeRange) {
  describe("ViewList Tests", function() {
    function View(viewName) {
      this.viewName = viewName;
    }

    var module, baseOptions = {
      viewNames: ["View 1", "View 2", "View 3"],
      viewFactory: function(viewName) {
        return new View(viewName);
      }
    };

    beforeEach(function() {
    });

    afterEach(function() {
      module.unsubscribe();
    });

    it("should render a list of views", function() {
      var options = $.extend({}, baseOptions);
      module = new ViewList(options);

      expect(module.allViews().length).toEqual(options.viewNames.length);
      expect(module.allViews()[0].viewName).toEqual(options.viewNames[0]);
    });

    it("should detect when a view is added", function() {
      var options = $.extend({
        showTopN: 2
      }, baseOptions);
      module = new ViewList(options);

      $.publish("viewAdded", ["My New View"]);
      expect(module.topNViews().length).toEqual(2);
      expect(module.allViews().length).toEqual(options.viewNames.length + 1);
      expect(module.topNViews()[0].viewName).toEqual("My New View");
      expect(module.allViews()[0].viewName).toEqual("My New View");
    });

    it("should detect when a view is removed", function() {
      var options = $.extend({
        showTopN: 1
      }, baseOptions);
      module = new ViewList(options);

      $.publish("viewRemoved", ["View 1"]);
      expect(module.topNViews().length).toEqual(1);
      expect(module.topNViews()[0].viewName).toEqual("View 2");
      expect(module.allViews()[0].viewName).toEqual("View 2");
    });

    it("should ignore when a duplicate view is added", function() {
      var options = $.extend({
        showTopN: 2
      }, baseOptions);

      module = new ViewList(options);

      $.publish("viewAdded", ["View 1"]);
      expect(module.topNViews().length).toEqual(2);
      expect(module.allViews().length).toEqual(options.viewNames.length);
    });

    it("should ignore when an unknown view is removed", function() {
      var options = $.extend({
        showTopN: 2
      }, baseOptions);

      module = new ViewList(options);

      $.publish("viewRemoved", ["Some Other View"]);
      expect(module.topNViews().length).toEqual(2);
      expect(module.allViews().length).toEqual(options.viewNames.length);
    });


    it("should render the top 2 views with a More option", function() {
      var options = $.extend({
        showTopN: 2
      }, baseOptions);
      module = new ViewList(options);

      expect(module.topNViews().length).toEqual(2);
      expect(module.allViews().length).toEqual(options.viewNames.length);
      expect(module.hasMore()).toBeTruthy();
    });
  });
});
