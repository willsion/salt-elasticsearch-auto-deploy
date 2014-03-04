// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/common/repeat'
], function() {
  describe("jQuery Repeat Plugin Test", function() {
    it('should repeatedly invoke the specified URL at the interval specified.', function() {
      jasmine.Ajax.useMock();
      jasmine.Clock.useMock();
      var response = {request: 0},
        repeater = $.getJSON('this/is/a/test', function(data) {
          response.request += 1;
        }).repeat(10 * 1000);
      repeater.start();
      mostRecentAjaxRequest().response({status: 200, responseText: JSON.stringify(response)});
      expect(repeater.invocationCount).toEqual(1);
      expect(response.request).toEqual(repeater.invocationCount);
      clearAjaxRequests();
      jasmine.Clock.tick(10 * 1000);
      mostRecentAjaxRequest().response({status: 200, responseText: JSON.stringify(response)});
      expect(repeater.invocationCount).toEqual(2);
      expect(response.request).toEqual(repeater.invocationCount);
      clearAjaxRequests();
      jasmine.Clock.tick(10 * 1000);
      mostRecentAjaxRequest().response({status: 200, responseText: JSON.stringify(response)});
      expect(repeater.invocationCount).toEqual(3);
      expect(response.request).toEqual(repeater.invocationCount);
      clearAjaxRequests();
      repeater.stop();
      jasmine.Clock.tick(10 * 1000);
      expect(mostRecentAjaxRequest()).toBeNull();
      expect(repeater.invocationCount).toEqual(3);
      expect(response.request).toEqual(repeater.invocationCount);
    });
  });
});
