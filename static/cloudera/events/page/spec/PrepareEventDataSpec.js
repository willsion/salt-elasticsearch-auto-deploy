// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'cloudera/events/page/PrepareEventData',
  'underscore'
], function(prepareEventData, _) {
  describe('prepareEventData', function() {
    
    var inputData = {
      errors: [],
      events: [{
          timestamp: 1348703185220,
          attributes: []
        }, {
          timestamp: 1348703217137,
          attributes: []
        }]
      };
    var data;

    beforeEach(function() {
      data = prepareEventData(inputData);
      expect(data.length).toEqual(2);
    });

    it('handles missing events array', function() {
      data = prepareEventData({});
      expect(data.length).toEqual(0);
    });

    it('has detailsExpanded and toggleDetailsExpanded', function() {
      var datum = data[0];
      expect(datum.detailsExpanded()).toBeFalsy();
      expect(_.isFunction(datum.toggleDetailsExpanded)).toBeTruthy();
      datum.toggleDetailsExpanded();
      expect(datum.detailsExpanded()).toBeTruthy();
    });

    it('has hasAttribute, getAttributeList, and getAttribute', function() {
      var datum = data[0];
      expect(_.isFunction(datum.hasAttribute)).toBeTruthy();
      expect(_.isFunction(datum.getAttributeList)).toBeTruthy();
      expect(_.isFunction(datum.getAttribute)).toBeTruthy();

      // Check what happens if attribute is not there.
      delete datum.attributes;
      expect(datum.hasAttribute('thing', 'catpants')).toBeFalsy();
      expect(datum.getAttributeList('thing').length).toEqual(0);
      expect(datum.getAttribute('thing')).toEqual('');
      expect(datum.getAttribute('thing')).toBeFalsy();

      // Set attribute.
      datum.attributes = {
        thing: ['catpants', 'doggyhat']
      };
      expect(datum.hasAttribute('thing', 'catpants')).toBeTruthy();
      expect(datum.hasAttribute('thing', 'horsepoo')).toBeFalsy();
      expect(datum.getAttributeList('thing').length).toEqual(2);
      expect(datum.getAttribute('thing')).toEqual('catpants');
      expect(datum.getAttribute('thing', 0)).toEqual('catpants');
      expect(datum.getAttribute('thing', 1)).toEqual('doggyhat');
    });

    it('expands health checks', function() {
      inputData.events[0].attributes = {
        CATEGORY: ['HEALTH_CHECK'],
        HEALTH_TEST_RESULTS: [
          JSON.stringify({
            name: 'healthCheck1',
            severity: 'CRITICAL'
          }),
          JSON.stringify({
            name: 'healthCheck2',
            severity: 'INFORMATIONAL'
          })
        ]
      };
      data = prepareEventData(inputData);
      var datum = data[0];
      expect(datum.healthCheckSeverities).toBeDefined();
      expect(datum.healthChecks).toBeDefined();
      expect(datum.healthCheckSeverities.length).toEqual(2);
      expect(datum.healthChecks.CRITICAL).toBeDefined();
      expect(datum.healthChecks.CRITICAL.length).toEqual(1);
      expect(datum.healthChecks.INFORMATIONAL).toBeDefined();
      expect(datum.healthChecks.INFORMATIONAL.length).toEqual(1);
      // Check the values
      expect(datum.healthCheckSeverities[0]).toEqual('CRITICAL');
      expect(datum.healthCheckSeverities[1]).toEqual('INFORMATIONAL');
      expect(datum.healthChecks.CRITICAL[0].name).toEqual('healthCheck1');
      expect(datum.healthChecks.INFORMATIONAL[0].name).toEqual('healthCheck2');
    });

    it('sorts attribute names', function() {
      inputData.events[0].attributes = {
        CATPANTS: [],
        DOGGYHAT: [],
        HORSEPOO: []
      };
      data = prepareEventData(inputData);
      var serverEvent = data[0];
      expect(serverEvent.sortedAttributeNames).toBeDefined();
      expect(serverEvent.sortedAttributeNames.length).toEqual(3);
      expect(serverEvent.sortedAttributeNames[0]).toEqual('CATPANTS');
      expect(serverEvent.sortedAttributeNames[1]).toEqual('DOGGYHAT');
      expect(serverEvent.sortedAttributeNames[2]).toEqual('HORSEPOO');
    });

    it('does not blowup if there are no attributes on events', function() {
      // If this test passes despite this "event" not having the
      // attributes property, then it is doing its job.
      var testData = {
        errors: [],
        events: [{
          timestamp: 1000
        }]
      };
      data = prepareEventData(testData);
      expect(data).toBeDefined();
      expect(data[0].sortedAttributeNames).toBeDefined();
      expect(data[0].sortedAttributeNames.length).toEqual(0);
    });

    it('filters disallowed attributes', function() {
      var testData = {
        events: [{
          timestamp: 10000,
          attributes: {
            ALERT: ['false'],
            ALERT_SUPPRESSED: ['false'],
            EVENTCODE: ['fakeEventCode']
          }
        }]
      };
      data = prepareEventData(testData);
      expect(data).toBeDefined();
      expect(data[0].sortedAttributeNames).toBeDefined();
      expect(data[0].sortedAttributeNames.length).toEqual(1);
      expect(data[0].sortedAttributeNames[0]).toEqual('EVENTCODE');
    });

    it('bad health checks don\'t make things blow up', function() {
      inputData.events[0].attributes = {
        CATEGORY: ['HEALTH_CHECK'],
        HEALTH_TEST_RESULTS: [
          JSON.stringify({
            name: 'healthCheck1',
            severity: 'CRITICAL'
          }),
          JSON.stringify({
            name: 'healthCheck2',
            severity: 'INFORMATIONAL'
          })
        ]
      };
      // Muahaha! Evil data!
      inputData.events[0].attributes.HEALTH_TEST_RESULTS[0] = 
        inputData.events[0].attributes.HEALTH_TEST_RESULTS[0].replace('healthCheck1', 'cat"pants');
      // If this doesn't blow up, then things went fine.
      data = prepareEventData(inputData);
    });

    describe('attribute filtering', function() {
      it('handles HOSTS and HOST_IDS', function() {
        // Filter out HOST_IDS if same as HOSTS
        var testData = {
          events: [{
            timestamp: 10000,
            attributes: {
              HOSTS: ['host1'],
              HOST_IDS: ['host1']
            }
          }]
        };
        var serverEvent = prepareEventData(testData)[0];
        expect(serverEvent.hasAttribute('HOSTS', 'host1')).toBeTruthy();
        expect(serverEvent.hasOwnProperty('HOST_IDS')).toBeFalsy();

        // If they're different, keep both.
        testData.events = [{
          timestamp: 10000,
          attributes: {
            HOSTS: ['host1'],
            HOST_IDS: ['host1.id']
          }
        }];
        serverEvent = prepareEventData(testData)[0];
        expect(serverEvent.hasAttribute('HOSTS', 'host1')).toBeTruthy();
        expect(serverEvent.hasAttribute('HOST_IDS', 'host1.id')).toBeTruthy();
      });

      it('handles ROLE and ROLE_DISPLAY_NAME', function() {
        // ROLE should equal ROLE_DISPLAY_NAME.
        var testData = {
          events: [{
            timestamp: 10000,
            attributes: {
              ROLE: ['role1'],
              ROLE_DISPLAY_NAME: ['role display name']
            }
          }]
        };
        var serverEvent = prepareEventData(testData)[0];
        expect(serverEvent.hasAttribute('ROLE', 'role1')).toBeFalsy();
        expect(serverEvent.hasAttribute('ROLE', 'role display name')).toBeTruthy();
        expect(serverEvent.hasOwnProperty('ROLE_DISPLAY_NAME')).toBeFalsy();
      });

      it('handles SERVICE and SERVICE_DISPLAY_NAME', function() {
        // SERVICE should equal SERVICE_DISPLAY_NAME.
        var testData = {
          events: [{
            timestamp: 10000,
            attributes: {
              SERVICE: ['service1'],
              SERVICE_DISPLAY_NAME: ['service display name']
            }
          }]
        };
        var serverEvent = prepareEventData(testData)[0];
        expect(serverEvent.hasAttribute('SERVICE', 'service1')).toBeFalsy();
        expect(serverEvent.hasAttribute('SERVICE', 'service display name')).toBeTruthy();
        expect(serverEvent.hasOwnProperty('SERVICE_DISPLAY_NAME')).toBeFalsy();
      });
    });

  });
});