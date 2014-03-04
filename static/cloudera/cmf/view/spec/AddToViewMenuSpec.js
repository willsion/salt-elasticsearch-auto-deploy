// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/view/AddToViewMenu',
  'underscore'
], function(AddToViewMenu, _) {
  describe("AddToViewMenu Tests", function() {
    var module, options = {
      userCreatedViewNames: ["View 1", "View 2", "View 3"],
      systemViewNames: {"HDFS_4_STATUS_VIEW" : "HDFS Status View"},
      newViewDialog: "#newDialog",
      selectViewDialog: "#selectDialog"
    };

    beforeEach(function() {
      $('<div id="viewMenuContainer"><div id="newDialog"><input type="text" name="viewName"/></div><div id="selectDialog"></div></div>').appendTo("body");
    });

    afterEach(function() {
      module.unsubscribe();
      $("#viewMenuContainer").remove();
    });

    it("should render a view menu", function() {
      module = new AddToViewMenu(options);

      expect(module.list.topNViews().length).toEqual(options.userCreatedViewNames.length + 1);
      expect(module.selectViewDialog.list.allViews().length).toEqual(options.userCreatedViewNames.length + 1);
      expect(module.list.hasMore()).toBeFalsy();

      var lastItem = module.list.topNViews()[module.list.topNViews().length - 1];
      expect(lastItem.name).toEqual("HDFS_4_STATUS_VIEW");
      expect(lastItem.label).toEqual("HDFS Status View");
    });

    it("should render a view menu with a More option", function() {
      options.userCreatedViewNames = _.map(_.range(12), function(d) { return "View " + d; });
      options.showTopN = 10;
      module = new AddToViewMenu(options);
      expect(module.list.topNViews().length).toEqual(options.showTopN);
      expect(module.selectViewDialog.list.allViews().length).toEqual(options.userCreatedViewNames.length + 1);
      expect(module.list.hasMore()).toBeTruthy();
    });

    it("should show a new view dialog", function() {
      module = new AddToViewMenu(options);

      spyOn(module.newViewDialog, 'show');
      // simulate a click on the New View menu.
      module.showNewView();
      expect(module.newViewDialog.show).wasCalled();

      // simulate a value entered
      module.newViewDialog.getViewNameInput().val("NewView");

      spyOn($, "publish");
      module.newViewDialog.createNewView();
      expect($.publish).wasCalled();
      expect($.publish.mostRecentCall.args[0]).toEqual("addToView");
      expect($.publish.mostRecentCall.args[1][0]).toEqual("NewView");
    });

    it("should show a new view dialog, but do not enter anything should not close the dialog", function() {
      module = new AddToViewMenu(options);

      spyOn(module.newViewDialog, 'show');
      // simulate a click on the New View menu.
      module.showNewView();
      expect(module.newViewDialog.show).wasCalled();

      // simulate a value entered
      module.newViewDialog.getViewNameInput().val("");

      spyOn($, "publish");
      module.newViewDialog.createNewView();
      expect($.publish).wasNotCalled();
    });

    it("should show a select view dialog", function() {
      options.userCreatedViewNames = ["View 1"];
      module = new AddToViewMenu(options);

      spyOn(module.selectViewDialog, 'show');
      // simulate a click on the More menu.
      module.showMore();
      expect(module.selectViewDialog.show).wasCalled();

      spyOn($, "publish");
      module.selectViewDialog.chosenView("View 1");
      module.selectViewDialog.addToView();
      expect($.publish.mostRecentCall.args[0]).toEqual("addToView");
      expect($.publish.mostRecentCall.args[1][0]).toEqual("View 1");
    });

    it("should add to the selected view", function() {
      options.userCreatedViewNames = ["View 1"];
      module = new AddToViewMenu(options);

      spyOn($, "publish");
      module.list.allViews()[0].select();
      expect($.publish.mostRecentCall.args[0]).toEqual("addToView");
      expect($.publish.mostRecentCall.args[1][0]).toEqual("View 1");
    });

    it("should show the view sorted", function() {
      var newOptions = $.extend({}, options, {
        userCreatedViewNames: [],
        systemViewNames: {
          "HDFS_4_STATUS_VIEW" : "CDH4 HDFS Status View",
          "MAPREDUCE_3_STATUS_VIEW": "CDH3 MapReduce Status View"
        }
      });
      module = new AddToViewMenu(newOptions);

      spyOn($, "publish");
      module.list.allViews()[0].select();
      expect($.publish.mostRecentCall.args[0]).toEqual("addToView");
      // This one should appear as the first entry.
      expect($.publish.mostRecentCall.args[1][0]).toEqual("MAPREDUCE_3_STATUS_VIEW");
    });
  });
});
