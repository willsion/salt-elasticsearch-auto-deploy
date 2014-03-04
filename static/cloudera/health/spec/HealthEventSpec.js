// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/health/spec/HealthTestUtil',
  'cloudera/health/HealthEvent'
], function(TestUtil, HealthEvent) {
  describe('HealthEvent', function() {
    it('exists', function() {
      expect(HealthEvent).toBeDefined();
    });

    it('must be passed param to ctor', function() {
      expect(function() {
        var event = new HealthEvent();
      }).toThrow();
    });

    it('only accepts health checks', function() {
      var serverEvent = TestUtil.makeFakeServerEvent(0);
      serverEvent.attributes.CATEGORY = ['LOG_MESSAGE'];
      expect(function() {
        var event = new HealthEvent(serverEvent);
      }).toThrow();
    });

    it('has basic attributes', function() {
      var fakeEvent = TestUtil.makeFakeHealthEvent(0);
      var e = new HealthEvent(fakeEvent);
      expect(e.content).toEqual(fakeEvent.content);
      expect(e.timestamp).toEqual(new Date(fakeEvent.timestamp));
      expect(e.id).toEqual(fakeEvent.attributes.__uuid[0]);
    });

    describe('test results', function() {
      var serverHealthEvent;

      var set = function(name, value) {
        serverHealthEvent.attributes[name] = [value];
      };

      beforeEach(function() {
        serverHealthEvent = TestUtil.makeFakeHealthEvent(0);
      });

      it('counts test results from the attributes', function() {
        set('GOOD_TEST_RESULTS', '1');
        set('BAD_TEST_RESULTS', '2');
        set('CONCERNING_TEST_RESULTS', '3');
        set('DISABLED_TEST_RESULTS', '4');
        set('UNKNOWN_TEST_RESULTS', '5');
        var healthEvent = new HealthEvent(serverHealthEvent);
        expect(healthEvent.statusCounts.good).toEqual(1);
        expect(healthEvent.statusCounts.bad).toEqual(2);
        expect(healthEvent.statusCounts.concerning).toEqual(3);
        expect(healthEvent.statusCounts.disabled).toEqual(4);
        expect(healthEvent.statusCounts.unknown).toEqual(5);
      });

      it('sets health to good when there are good results', function() {
        set('GOOD_TEST_RESULTS', '1');
        var healthEvent = new HealthEvent(serverHealthEvent);
        expect(healthEvent.health).toEqual('good');
      });

      it('sets health to concerning when there are concerning results', function() {
        set('GOOD_TEST_RESULTS', '1');
        set('CONCERNING_TEST_RESULTS', '2');
        var healthEvent = new HealthEvent(serverHealthEvent);
        expect(healthEvent.health).toEqual('concerning');
      });

      it('sets health to bad when there are bad results', function() {
        set('GOOD_TEST_RESULTS', '1');
        set('CONCERNING_TEST_RESULTS', '2');
        set('BAD_TEST_RESULTS', '3');
        var healthEvent = new HealthEvent(serverHealthEvent);
        expect(healthEvent.health).toEqual('bad');
      });

      it('sets health to unknown when there are only unknown results', function() {
        set('UNKNOWN_TEST_RESULTS', '2');
        var healthEvent = new HealthEvent(serverHealthEvent);
        expect(healthEvent.health).toEqual('unknown');
      });

      it('sets health to disabled when there are only disabled results', function() {
        set('DISABLED_TEST_RESULTS', '2');
        var healthEvent = new HealthEvent(serverHealthEvent);
        expect(healthEvent.health).toEqual('disabled');
      });

      it('sets health to unknown when there are only unknown results', function() {
        set('UNKNOWN_TEST_RESULTS', '2');
        var healthEvent = new HealthEvent(serverHealthEvent);
        expect(healthEvent.health).toEqual('unknown');
      });

      it('sets health to good when there are unknown and good results', function() {
        set('UNKNOWN_TEST_RESULTS', '2');
        set('GOOD_TEST_RESULTS', '1');
        var healthEvent = new HealthEvent(serverHealthEvent);
        expect(healthEvent.health).toEqual('good');
      });

      it('sets health to good when there are disabled and good results', function() {
        set('DISABLED_TEST_RESULTS', '2');
        set('GOOD_TEST_RESULTS', '1');
        var healthEvent = new HealthEvent(serverHealthEvent);
        expect(healthEvent.health).toEqual('good');
      });

      it('sets health to unknown when there are disabled and unknown results', function() {
        set('UNKNOWN_TEST_RESULTS', '2');
        set('DISABLED_TEST_RESULTS', '1');
        var healthEvent = new HealthEvent(serverHealthEvent);
        expect(healthEvent.health).toEqual('unknown');
      });
    });

    it('parses out the health test results from the server', function() {
      var fakeEvent = TestUtil.makeFakeHealthEvent(0);
      var e = new HealthEvent(fakeEvent);
      expect(e.healthTestResults).toBeDefined();
      expect(e.healthTestResults.length).toEqual(1);
    });
  });
});
