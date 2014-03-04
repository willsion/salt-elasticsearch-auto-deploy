// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/view/ViewManage',
  'underscore'
], function(ViewManage, _) {
  describe("ViewManage Tests", function() {
    var module, request, options = {
      container: "#viewManage",
      viewsByName: {
        "View 1" : {
          name: "View 1",
          owner: "admin",
          plots: []
        }, "View 2": {
          name: "View 2",
          owner: "admin",
          plots: []
        }, "View 3": {
          name: "View 3",
          owner: "user",
          plots: []
        }
      },
      viewPageUri: "someViewPageUri",
      removeUri: "someRemoveUri"
    };

    beforeEach(function() {
      jasmine.Ajax.useMock();
      clearAjaxRequests();
      $('<div id="viewManage"/>').appendTo(document.body);
    });

    afterEach(function() {
      module.unsubscribe();
      $("#viewManage").remove();
    });

    it("should render a list of views", function() {
      module = new ViewManage(options);
      expect(module.list.allViews().length).toEqual(_.keys(options.viewsByName).length);
      expect(module.list.allViews()[0].href).toEqual("someViewPageUri?viewName=View%201");
    });

    it("should remove a view", function() {
      module = new ViewManage(options);

      spyOn($, "publish");
      module.list.allViews()[0].remove();

      request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify({
          message: "OK"
        })
      });
      expect($.publish).wasCalledWith("viewRemoved", ["View 1"]);
    });

    it("should not remove a view when failed", function() {
      module = new ViewManage(options);

      spyOn($, "publish");
      module.list.allViews()[0].remove();

      request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify({
          message: "Remove Failed"
        })
      });
      expect($.publish).wasCalledWith("showError", ["Remove Failed"]);
    });

    it("should disable the submit button when the viewName is not entered", function() {
      module = new ViewManage(options);

      expect(module.submitButtonEnabled()).toBeFalsy();

      module.viewName("Hello World");
      module.viewData("");
      expect(module.submitButtonEnabled()).toBeFalsy();

      module.viewName("");
      module.viewData("Blah");
      expect(module.submitButtonEnabled()).toBeFalsy();

      module.viewName("Hello World");
      module.viewData("Blah");
      expect(module.submitButtonEnabled()).toBeTruthy();
    });
  });
});
