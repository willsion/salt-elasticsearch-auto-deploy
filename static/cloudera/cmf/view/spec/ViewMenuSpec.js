// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/view/ViewMenu',
  'underscore'
], function(ViewMenu, _) {
  describe("ViewMenu Tests", function() {
    var module, options = {
      container: "#viewMenu",
      viewNames: ["View 1", "View 2", "View 3"],
      viewPageUri: "someViewPageUri"
    };

    beforeEach(function() {
      $('<div id="viewMenu"/>').appendTo(document.body);
    });

    afterEach(function() {
      module.unsubscribe();
      $("#viewMenu").remove();
    });

    it("should render a list of views", function() {
      module = new ViewMenu(options);
      expect(module.list.allViews().length).toEqual(options.viewNames.length);
      expect(module.list.allViews()[0].href).toEqual("someViewPageUri?viewName=View%201");
      expect(module.list.allViews()[0].name).toEqual("View 1");
    });

    it("should render the top 20 views", function() {
      options.viewNames = _.map(_.range(22), function(d) { return "View " + d; });

      module = new ViewMenu(options);
      expect(module.list.allViews().length).toEqual(22);
      expect(module.list.topNViews().length).toEqual(20);
    });
  });
});
