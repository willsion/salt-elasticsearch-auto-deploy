// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/wizard/hosts/JoinClusterStep'
], function(JoinClusterStep) {
  describe("JoinClusterStep Tests", function() {
    var module, id = "joinClusterStep";

    beforeEach(function() {
      $("<div>").attr("id", id).appendTo(document.body);
      jasmine.Ajax.useMock();
      clearAjaxRequests();
    });

    afterEach(function() {
      $("#" + id).remove();
    });

    it("should join and leave the hosts to a cluster only once", function() {
      var options = {
        id: id,
        clusterId: "2",
        url: "dontcare",
        hosts: function() {
          return ["h1", "h2"];
        }
      };
      var module = new JoinClusterStep(options);
      var called = false;
      var callback = function() {
        called = true;
      };

      spyOn(module, "joinCluster").andCallThrough();
      module.onEnter(callback, true);

      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify({
          message: "OK"
        })
      });
      expect(module.joined).toBeTruthy();
      expect(module.joinCluster.callCount).toEqual(1);
      expect(called).toBeTruthy();

      module.onEnter(callback, true);
      // Expect joinCluster was not called again.
      expect(module.joinCluster.callCount).toEqual(1);

      spyOn(module, "leaveCluster").andCallThrough();
      called = false;
      module.onEnter(callback, false);

      request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify({
          message: "OK"
        })
      });
      expect(module.joined).toBeFalsy();
      expect(module.leaveCluster.callCount).toEqual(1);
      expect(called).toBeTruthy();

      module.onEnter(callback, false);
      expect(module.leaveCluster.callCount).toEqual(1);
    });
  });
});
