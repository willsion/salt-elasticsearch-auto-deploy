// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/cloud/AddCloudHostsWizardMainBase'
], function(AddCloudHostsWizardMainBase) {
  
  describe('AddCloudHostsWizardMainBase Tests', function() {
    
    var objToTest;
    var id = "addCloudHostWizardModule";
    
    beforeEach(function() {
      var options = {
        maxNodes : 50, 
        messages : {},
        // In the AddCloudHostsWizardMainBase function initParams(), 
        // a statement like options.amisMap[self.selectedOs()]
        // [self.selectedRegion()] exists. self.selectedOs() and 
        // self.selectedRegion() will both be "" in the test 
        // environment.
        amisMap : {"" : {"" : ""}}
      };
      $("<div>").attr("id", id).appendTo(document.body);
      $("#" + id).append('<input type="text" name="identity"/>');
      $("#" + id).append('<input type="text" name="credential"/>');
      $("#" + id).append('<span id="testCredentialsText"></span>');
      jasmine.Ajax.useMock();
      clearAjaxRequests();
      objToTest = new AddCloudHostsWizardMainBase(options);
    });

    afterEach(function() {
      $("#" + id).remove();
    });
    
    it('should properly validate number of instances', function() {
      // Each entry in tests is [# of instances, expected return value 
      // of checkInvalidNumInstances()].
      var tests = [[-10, false], [0, false], [25, true], [50000, false]]; 
      var currentTestIdx = 0;
      spyOn(objToTest, 'numInstances').andCallFake(function() {
        return tests[currentTestIdx][0];
      });
      spyOn(objToTest, 'numInstancesError').andCallFake(function(value) {});
      var i;
      for (i = 0; i < tests.length; i++) {
        currentTestIdx = i;
        expect(objToTest.checkInvalidNumInstances()) 
          .toEqual(tests[currentTestIdx][1]);
      }
    });
    
    it('should properly validate custom group string', function() {
      // Each entry in tests is [custom group string, expected return value 
      // of checkInvalidCustomGroup()].
      var tests = [['*ab', false], ['ab', false], ['abc', true], ['Abc', false],
                   ['aBc', false],
                   // 63 characters
                   ['a--------------------------------------------------------------', true],
                   // 64 characters
                   ['a---------------------------------------------------------------', false],
                   ['ab_ -', true], ['1ab', true], ['_ab', false], [' ab', false]]; 
      var currentTestIdx = 0;
      spyOn(objToTest, 'customGroup').andCallFake(function() {
        return tests[currentTestIdx][0];
      });
      spyOn(objToTest, 'customGroupError').andCallFake(function(value) {});
      var i;
      for (i = 0; i < tests.length; i++) {
        currentTestIdx = i;
        expect(objToTest.checkInvalidCustomGroup()) 
          .toEqual(tests[currentTestIdx][1]);
      }
    });

    it('should properly update the test credentials text on success', function() {
      spyOn(objToTest, 'testCredentialsText').andCallFake(function(text) {
        $("#testCredentialsText").text(text);
      });

      objToTest.testCredentials();

      var response = {"message": "OK", "data": {"status": "success", "text": "works fine"}};
      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        contentType: "json",
        responseText: JSON.stringify(response)
      });

      expect($("#testCredentialsText").text()).toEqual("works fine");
      expect(objToTest.credentialsValid).toBeTruthy();
    });

    it('should properly update the test credentials text on error', function() {
      spyOn(objToTest, 'testCredentialsText').andCallFake(function(text) {
        $("#testCredentialsText").text(text);
      });

      objToTest.testCredentials();

      var response = {"message": "OK", "data": {"status": "error", "text": "authorization failure"}};
      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        contentType: "json",
        responseText: JSON.stringify(response)
      });

      expect($("#testCredentialsText").text()).toEqual("authorization failure");
      expect(objToTest.credentialsValid).toBeFalsy();
    });

    it('should continue to the next page after credentials test if triggered by continue button', function() {
      objToTest.credentialsValid = false;
      objToTest.checkCredsPage();

      spyOn(objToTest, 'continueClicked');

      var response = {"message": "OK", "data": {"status": "success", "text": "unimportant"}};
      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        contentType: "json",
        responseText: JSON.stringify(response)
      });

      expect(objToTest.continueClicked).wasCalled();
    });
  });
});
