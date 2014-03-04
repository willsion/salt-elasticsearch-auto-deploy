// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/Analytics'
], function(analytics) {
  describe('Analytics', function() {
    var queue;
    beforeEach(function() {
      queue = [];
      window._gaq = {
        push: function(command) {
          queue.push(command);
        }
      };
    });

    it('should enqueue events to be pushed to the server', function() {
      analytics.trackEvent('Test 1', 'Test 2');
      expect(queue.length).toEqual(1);
      expect(queue[0][0]).toEqual('_trackEvent');
      expect(queue[0][1]).toEqual('Test 1');
      expect(queue[0][2]).toEqual('Test 2');
      analytics.trackEvent('Test 3', 'Test 4', 'Test 5');
      expect(queue.length).toEqual(2);
      expect(queue[1][0]).toEqual('_trackEvent');
      expect(queue[1][1]).toEqual('Test 3');
      expect(queue[1][2]).toEqual('Test 4');
      expect(queue[1][3]).toEqual('Test 5');
    });

    it('should enqueue customVars to be pushed to the server', function() {
      analytics.setCustomVar(1, 'Test 1', 'Test 2', 'Test 3');
      expect(queue.length).toEqual(1);
      expect(queue[0][0]).toEqual('_setCustomVar');
      expect(queue[0][1]).toEqual(1);
      expect(queue[0][2]).toEqual('Test 1');
      expect(queue[0][3]).toEqual('Test 2');
      expect(queue[0][4]).toEqual('Test 3');
      analytics.setCustomVar(2, 'Test 4', 'Test 5', 'Test 6');
      expect(queue.length).toEqual(2);
      expect(queue[1][0]).toEqual('_setCustomVar');
      expect(queue[1][1]).toEqual(2);
      expect(queue[1][2]).toEqual('Test 4');
      expect(queue[1][3]).toEqual('Test 5');
      expect(queue[1][4]).toEqual('Test 6');
    });
  });
});
