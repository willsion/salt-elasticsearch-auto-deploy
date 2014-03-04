// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/wizard/hosts/RepositorySelectionStep'
], function(RepositorySelectionStep) {
  describe("RepositorySelectionStep Tests", function() {
    var module, id = "repositorySelectionStep";

    beforeEach(function() {
      $("<div>").attr("id", id).appendTo(document.body);
      jasmine.Ajax.useMock();
      clearAjaxRequests();
    });

    afterEach(function() {
      $("#" + id).remove();
    });

    it("should initialize a RepositorySelectionStep", function() {
      var options = {
        id: id,
        listUrl: "dontcare",
        addCustomRepoUrl: "dontcare",
        enableParcelSelection: true
      };
      var module = new RepositorySelectionStep(options);

      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify({
          message: "OK",
          data: [ {
            "product": "CDH",
            "version": "3.0"
          }, {
            "product": "CDH",
            "version": "4.0"
          }, {
            "product": "Impala",
            "version": "1.0"
          }]
        })
      });
      var pvs = module.availableProductVersions();
      expect(pvs.length).toEqual(2);
      expect(pvs[0].product()).toEqual("CDH");
      expect(pvs[0].availableVersions().length).toEqual(2);
      expect(pvs[0].chosenVersion()).toEqual("4.0");

      expect(pvs[1].product()).toEqual("Impala");
      // +1 because this product is optional.
      expect(pvs[1].availableVersions().length).toEqual(1+1);
      expect(pvs[1].chosenVersion()).toEqual("1.0");
    });

    it("should call refreshCustomRepo", function() {
      var options = {
        id: id,
        listUrl: "dontcare",
        addCustomRepoUrl: "dontcare",
        enableParcelSelection: true
      };
      var module = new RepositorySelectionStep(options);

      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify({
          message: "OK",
          data: [ {
            "product": "CDH",
            "version": "4.1"
          }, {
            "product": "Informatica",
            "version": "1.1"
          }, {
            "product": "Informatica",
            "version": "1.0"
          }]
        })
      });
      var pvs = module.availableProductVersions();
      expect(pvs.length).toEqual(2);
      expect(pvs[0].product()).toEqual("CDH");
      expect(pvs[0].availableVersions().length).toEqual(1);
      expect(pvs[0].chosenVersion()).toEqual("4.1");

      expect(pvs[1].product()).toEqual("Informatica");
      expect(pvs[1].availableVersions().length).toEqual(3);
      expect(pvs[1].chosenVersion()).toEqual("1.1");

      var chosenParcels = module.chosenParcels();
      expect(chosenParcels.length).toEqual(2);
      expect(chosenParcels[0].product).toEqual("CDH");
      expect(chosenParcels[0].version).toEqual("4.1");
      expect(chosenParcels[1].product).toEqual("Informatica");
      expect(chosenParcels[1].version).toEqual("1.1");
    });

    it("should call refreshCustomRepo handle the failure case", function() {
      var options = {
        id: id,
        listUrl: "dontcare",
        addCustomRepoUrl: "dontcare",
        enableParcelSelection: true
      };

      spyOn($, "publish");
      var module = new RepositorySelectionStep(options);
      module.refreshCustomRepo();

      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify({
          message: "Failed"
        })
      });
      expect($.publish).wasCalledWith("showError", ["Failed"]);
    });

    it("should call handleUpdateParcelsResponse when listUrl is specified", function() {
      var options = {
        id: id,
        listUrl: "dontcare",
        addCustomRepoUrl: "dontcare",
        enableParcelSelection: true
      };

      spyOn($, "post");
      var module = new RepositorySelectionStep(options);
      expect($.post).wasCalled();
    });

    it("should not call handleUpdateParcelsResponse when listUrl is not specified", function() {
      var options = {
        id: id,
        listUrl: "dontcare",
        addCustomRepoUrl: "dontcare",
        enableParcelSelection: false
      };

      spyOn($, "post");
      var module = new RepositorySelectionStep(options);
      expect($.post).wasNotCalled();
    });

    it("should ensure Continue is not enabled if impala is older than 1.2.", function() {
      var options = {
        id: id,
        listUrl: "dontcare",
        addCustomRepoUrl: "dontcare",
        enableParcelSelection: true
      };

      var module = new RepositorySelectionStep(options);
      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify({
          message: "OK",
          data: [ {
            product: "IMPALA",
            version: "1.1.0"
          }, {
            product: "CDH",
            version: "4.2.0"
          }]
        })
      });
      expect(module.isImpalaVersionOK()).toBeFalsy();
      expect(module.enableContinue()).toBeFalsy();
    });

    it("should ensure Continue is enabled if impala is version 1.2", function() {
      var options = {
        id: id,
        listUrl: "dontcare",
        addCustomRepoUrl: "dontcare",
        enableParcelSelection: true
      };

      var module = new RepositorySelectionStep(options);
      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify({
          message: "OK",
          data: [ {
            product: "IMPALA",
            version: "1.2.0"
          }, {
            product: "CDH",
            version: "4.2.0"
          }]
        })
      });
      expect(module.isImpalaVersionOK()).toBeTruthy();
      expect(module.enableContinue()).toBeTruthy();
    });
  });
});
