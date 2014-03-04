// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.

// Provide the /cmf/healthChecks/shortNameTranslations.json so that we don't
// hit the server. This block is duplicated in HealthHistorySpec.js. We
// probably don't want to do this long-term and should instead stub
// the json! plugin somehow.
// Duplicated in HealthUtilSpec.js to cover dependency in HealthUtils.js.
define('json!/cmf/resources/healthChecks/shortNameTranslations.json', function() {
  return {
    'DATA_NODE_HOST_HEALTH': 'test.data.node.host.health'
  };
});

define([
  'cloudera/health/spec/HealthTestUtil',
  'cloudera/health/HealthHistory',
  'cloudera/chart/TimeRange',
  'knockout',
  'underscore'
], function(TestUtil, HealthHistory, TimeRange, ko, _) {
  describe('HealthHistory', function() {
    var options = null, hh;

    beforeEach(function() {
      jasmine.Ajax.useMock();
      options = {
        id: 'hhId',
        eventSearchUrl: 'eventSearchUrl',
        startTime: new Date(20),
        endTime: new Date(2000)
      };
      hh = new HealthHistory(options);
    });

    afterEach(function() {
      hh.unsubscribe();
    });

    it('defines itself correctly', function() {
      expect(hh.id).toEqual(options.id);
      expect(hh.eventSearchUrl).toEqual(options.eventSearchUrl);
      expect(hh.viewModel).toBeDefined();
    });

    it('gets new events when the TC updates', function() {
      // Once we call start, hh.onMarkerDateChanged is going to bound.
      // If we lose the spy instance, we can't check on it later, so save
      // it here.
      var onMarkerDateChangedSpy = spyOn(hh, 'onMarkerDateChanged');
      hh.applyBindings();
      $.publish('markerDateChanged', [new Date()]);
      expect(onMarkerDateChangedSpy).wasCalled();
    });

    it('sets query options on marker date changed', function() {
      hh.viewModel.query = {};
      spyOn(hh.viewModel, 'getEvents');
      hh.onMarkerDateChanged(new Date(1984));
      expect(hh.viewModel.query.endTime).toEqual(new Date(1984));
      expect(hh.viewModel.query.offset).toEqual(0);
      expect(hh.viewModel.query.limit).toEqual(20);
      expect(hh.viewModel.getEvents).wasCalled();
    });

    describe('event search query options', function() {
      var verifyCategoryFilter = function(catFilter) {
        expect(catFilter.propertyName).toEqual('CATEGORY');
        expect(catFilter.compareType).toEqual('EQ_WITH_OR');
        expect(catFilter.values).toEqual(['HEALTH_CHECK']);
      };

      var verifyEntityFilter = function(entFilter, entity, value) {
        expect(entFilter.propertyName).toEqual(entity);
        expect(entFilter.compareType).toEqual('EQ_WITH_OR');
        expect(entFilter.values).toEqual([value]);
      };

      var verifyEventCodeFilter = function(ecFilter, entityType) {
        // Makes some assumptions about the event code filter: it
        // includes five event codes and each one contains the type
        // of the entity with some special formatting.
        expect(ecFilter.propertyName).toEqual('EVENTCODE');
        expect(ecFilter.compareType).toEqual('EQ_WITH_OR');
        expect(ecFilter.values.length).toEqual(5);
        var formattedEntityType = '_' + entityType.toUpperCase() + '_HEALTH_CHECK_';
        _.each(ecFilter.values, function(value) {
          expect(value.indexOf(formattedEntityType) !== -1).toBeTruthy();
        });
      };

      it('works when service is set', function() {
        options.service = 'service';
        hh = new HealthHistory(options);
        var viewModel = hh.viewModel;
        expect(viewModel.query.filters.length).toEqual(3);
        verifyCategoryFilter(viewModel.query.filters[0]);
        verifyEntityFilter(viewModel.query.filters[1], 'SERVICE', options.service);
        verifyEventCodeFilter(viewModel.query.filters[2], 'SERVICE');
      });

      it('works when role is set', function() {
        options.role = 'role';
        hh = new HealthHistory(options);
        var viewModel = hh.viewModel;
        expect(viewModel.query.filters.length).toEqual(3);
        verifyCategoryFilter(viewModel.query.filters[0]);
        verifyEntityFilter(viewModel.query.filters[1], 'ROLE', options.role);
        verifyEventCodeFilter(viewModel.query.filters[2], 'ROLE');
      });

      it('works when host is set', function() {
        options.host = 'host';
        hh = new HealthHistory(options);
        var viewModel = hh.viewModel;
        expect(viewModel.query.filters.length).toEqual(3);
        verifyCategoryFilter(viewModel.query.filters[0]);
        verifyEntityFilter(viewModel.query.filters[1], 'HOSTS', options.host);
        verifyEventCodeFilter(viewModel.query.filters[2], 'HOST');
      });
    });

    it('only applies bindings when applyBindings is called', function() {
      spyOn(ko, 'applyBindings');
      hh.applyBindings();
      expect(ko.applyBindings).wasCalled();
    });
  });

  describe('HealthHistoryViewModel', function() {
    var HealthHistoryViewModel = HealthHistory.HealthHistoryViewModel;
    var fakeServerEvents, options;

    beforeEach(function() {
      jasmine.Ajax.useMock();
      fakeServerEvents = _.map(_.range(10), TestUtil.makeFakeHealthEvent);
      options = {
        eventSearchUrl: '/path/to/event/search',
        filters: [],
        endTime: new Date(2000)
      };
    });

    it('exists', function() {
      expect(HealthHistoryViewModel).toBeDefined();
    });

    it('sets good defaults for the event search query', function() {
      var viewModel = new HealthHistoryViewModel(options);
      expect(viewModel.query.startTime).toEqual(new Date(0));
      expect(viewModel.query.endTime).toEqual(options.endTime);
      expect(viewModel.query.offset).toEqual(0);
      expect(viewModel.query.limit).toEqual(20);
    });

    it('makes an events array based on server response', function() {
      var viewModel = new HealthHistoryViewModel(options);
      expect(viewModel.events().length).toEqual(0);
      viewModel.onDataReceived(fakeServerEvents);
      expect(viewModel.events().length).toEqual(10);
    });

    it('updates events from the server correctly', function() {
      fakeServerEvents = _.map(_.range(5, 15), TestUtil.makeFakeHealthEvent);
      var viewModel = new HealthHistoryViewModel(options);
      viewModel.onDataReceived(fakeServerEvents);

      expect(viewModel.events()[0].id).toEqual(fakeServerEvents[0].attributes.__uuid[0]);
      var moreServerEvents = _.map(_.range(0, 10), TestUtil.makeFakeHealthEvent);
      viewModel.onDataReceived(moreServerEvents);
      // Should have replaced what was there.
      expect(viewModel.events().length).toEqual(10);
      _.each(_.range(10), function(num) {
        expect(viewModel.events()[num].id).toEqual(moreServerEvents[num].attributes.__uuid[0]);
      });
    });

    it('discards new events when timerange is smaller than previous', function() {
      fakeServerEvents = _.map(_.range(0, 10), TestUtil.makeFakeHealthEvent);
      var viewModel = new HealthHistoryViewModel(options);
      viewModel.onDataReceived(fakeServerEvents);

      expect(viewModel.events()[0].id).toEqual(fakeServerEvents[0].attributes.__uuid[0]);
      var moreServerEvents = _.map(_.range(3, 7), TestUtil.makeFakeHealthEvent);
      viewModel.onDataReceived(moreServerEvents, new Date(moreServerEvents[3].timestamp),
        new Date(moreServerEvents[0].timestamp));
      expect(viewModel.events().length).toEqual(4);
      _.each(viewModel.events(), function(event, index) {
        expect(event.id).toEqual(moreServerEvents[index].attributes.__uuid[0]);
      });
    });

    it('aborts in-flight queries when asked to get events again', function() {
      var viewModel = new HealthHistoryViewModel(options);
      spyOn(viewModel.query, 'isInflight').andReturn(true);
      spyOn(viewModel.query, 'abort');

      viewModel.getEvents();
      expect(viewModel.query.abort).wasCalled();
    });

    it('sets loading correctly as requests are made and completed', function() {
      var viewModel = new HealthHistoryViewModel(options);
      viewModel.getEvents();
      expect(viewModel.loading()).toBeTruthy();
      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: ''
      });
      expect(viewModel.loading()).toBeFalsy();
    });

    it('sets error correctly when errors received from server', function() {
      var viewModel = new HealthHistoryViewModel(options);
      viewModel.getEvents();
      var errors = viewModel.errors();
      expect(errors.length).toEqual(0);
      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify({
          errors: ['Connection refused']
        })
      });
      errors = viewModel.errors();
      expect(errors.length).toEqual(1);
      expect(errors[0]).toEqual('Connection refused');
    });

    it('sets error correctly when 500 received from server', function() {
      var viewModel = new HealthHistoryViewModel(options);
      spyOn(viewModel, 'onDataReceived');
      viewModel.getEvents();
      var errors = viewModel.errors();
      expect(errors.length).toEqual(0);
      var request = mostRecentAjaxRequest();
      request.response({
        status: 500,
        responseText: null
      });
      errors = viewModel.errors();
      expect(errors.length).toEqual(1);
      expect(errors[0]).toEqual('ui.healthHistoryError');
      expect(viewModel.onDataReceived).wasNotCalled();
    });

    describe('HealthEvent property additions', function() {

      var singleEvent;
      var healthHistoryViewModel;

      beforeEach(function() {
        fakeServerEvents = _.map(_.range(10), TestUtil.makeFakeHealthEvent);
        _.each(fakeServerEvents, function(event) {
          // Set up each event as having multiple test results.
          event.attributes.GOOD_TEST_RESULTS = [1];
          event.attributes.BAD_TEST_RESULTS = [2];
          event.attributes.CONCERNING_TEST_RESULTS = [3];
          event.attributes.DISABLED_TEST_RESULTS = [4];
          event.attributes.UNKNOWN_TEST_RESULTS = [5];
        });
        healthHistoryViewModel = new HealthHistoryViewModel(options);
        healthHistoryViewModel.onDataReceived(fakeServerEvents);
        singleEvent = healthHistoryViewModel.events()[0];
      });

      it('has formattedTimestamp', function() {
        expect(singleEvent.formattedTimestamp).toBeDefined();
      });

      it('appends seconds if the previous event was within 60 seconds', function() {
        var eventCount = 10,
            processedEvents = 0,
            testedEvents = 0,
            fakeProcessedEvents,
            currentTimestamp;
        fakeServerEvents = _.map(_.range(eventCount), TestUtil.makeFakeHealthEvent);
        currentTimestamp = fakeServerEvents[0].timestamp;
        _.each(fakeServerEvents, function(event) {
          // Set up each event as having multiple test results.
          event.attributes.GOOD_TEST_RESULTS = [1];
          event.attributes.BAD_TEST_RESULTS = [2];
          event.attributes.CONCERNING_TEST_RESULTS = [3];
          event.attributes.DISABLED_TEST_RESULTS = [4];
          event.attributes.UNKNOWN_TEST_RESULTS = [5];
          if (processedEvents++ < 4) {
            event.timestamp = currentTimestamp;
            currentTimestamp -= 50000;
          }
        });
        healthHistoryViewModel = new HealthHistoryViewModel(fakeServerEvents);
        fakeProcessedEvents = healthHistoryViewModel.events();
        _.each(fakeProcessedEvents, function(fakeProcessedEvent) {
          expect(fakeProcessedEvent.formattedTimestamp)
              .toMatch(testedEvents++ >= 4 ? /(?:^| )\d{1,2}:\d{1,2} (?:A|P)M$/ : /(?:^| )(?:\d{1,2}:){2}\d{1,2} (?:A|P)M$/);
        });
      });

      it('tracks expansion and toggles', function() {
        expect(singleEvent.expanded()).toBeFalsy();
        singleEvent.toggleExpansion();
        expect(singleEvent.expanded()).toBeTruthy();
      });

      it('formats health text using I18n', function() {
        expect(singleEvent.healthText).toEqual('ui.health.bad');
      });

      it('has formatted status counts by status', function() {
        var formattedStatusCounts = singleEvent.formattedStatusCounts;
        expect(formattedStatusCounts.good).toEqual('health.changes.green');
        expect(formattedStatusCounts.bad).toEqual('health.changes.red');
        expect(formattedStatusCounts.concerning).toEqual('health.changes.yellow');
        expect(formattedStatusCounts.disabled).toEqual('health.changes.disabled');
        expect(formattedStatusCounts.unknown).toEqual('health.changes.not_avail');
      });

      it('breaks out health tests results as custom objects', function() {
        expect(singleEvent.healthTests).toBeDefined();
        expect(singleEvent.healthTests.length).toEqual(1);
        var healthTest = singleEvent.healthTests[0];
        expect(healthTest.shortName).toEqual('test.data.node.host.health');
        expect(healthTest.status).toEqual('concerning');
        expect(healthTest.content).toEqual('The health test result for DATA_NODE_HOST_HEALTH has become concerning: The health of this role\'s host is concerning.  The following health checks are concerning: agent status.');
      });

      it('animates the marker when clicking the show event link', function() {
        spyOn($, 'publish');
        singleEvent.showEvent();
        expect($.publish).wasCalled();
        var args = $.publish.mostRecentCall.args;
        expect(args[0]).toEqual('changeMarkerTime');
        expect(args[1][0]).toEqual(new Date(singleEvent.timestamp));
        expect(args[1][1]).toEqual(true);
      });
    });
  });
});
