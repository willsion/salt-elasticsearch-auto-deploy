// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/page/ServiceHealthCheckTable',
  'cloudera/health/HealthUtil',
  'knockout',
  'underscore'
], function(ServiceHealthCheckTable, HealthUtil, ko, _) {

  describe('ServiceHealthCheckTable', function() {

    var shct;
    var $testTable;
    var options = {
      id: 'testTableId',
      urlParams: {
        key: 'key',
        timestamp: 1,
        currentMode: 'true'
      },
      // These are dummy URLs that aren't supposed to go anywhere. Code in the
      // beforeEach should prevent live requests from happening.
      healthCheckTableAjaxURL: 'http://localhost/healthCheckTableAjaxURL',
      advicePopupBaseUrl: 'http://localhost/advicePopupBaseUrl'
    };
    var HealthCheckGroup = ServiceHealthCheckTable.HealthCheckGroup,
      HealthCheck = ServiceHealthCheckTable.HealthCheck;

    // Define I18n messages here as a stopgap until tests can fetch the real
    // messages or until we figure out a better solution.
    if (!window.resources) {
      window.resources = {};
    }
    if (!window.resources.ui) {
      window.resources.ui = {};
    }
    window.resources.ui['ui.status.badChecks'] = '{0} bad.';
    window.resources.ui['ui.status.concerningChecks'] = '{0} concerning.';
    window.resources.ui['ui.status.goodChecks'] = '{0} good.';
    window.resources.ui['ui.status.unknownChecks'] = '{0} unknown.';
    window.resources.ui['ui.status.disabledChecks'] = '{0} disabled.';

    var unsubscribe = function() {
      if (shct) {
        shct.unsubscribe();
      }
    };

    beforeEach(function() {
      // Don't let the test make server calls.
      jasmine.Ajax.useMock();
      $testTable = $('<table></table>')
        .attr('id', options.id)
        .appendTo($('body'));
      shct = new ServiceHealthCheckTable(options);
    });

    afterEach(function() {
      $testTable.remove();
      unsubscribe();
    });

    it('initializes itself on construction', function() {
      spyOn(ko, "applyBindings");
      // Unsubscribe the existing instance from marker date
      // changed events.
      unsubscribe();
      shct = new ServiceHealthCheckTable(options);
      expect(ko.applyBindings).wasCalled();
      // bad, concerning, good, unknown, disabled
      expect(shct.healthCheckGroups().length).toEqual(5);
      expect(shct.healthIsAvailable()).toBeTruthy();
      unsubscribe();
    });

    it('creates intelligent defaults for the expanded states of health check groups', function() {
      expect(HealthCheckGroup).toBeDefined();
      var badGroup = new HealthCheckGroup('bad');
      expect(badGroup.summary).toEqual('bad');
      expect(badGroup.checks().length).toEqual(0);
      expect(badGroup.expanded()).toBeTruthy();

      var concerningGroup = new HealthCheckGroup('concerning');
      expect(concerningGroup.summary).toEqual('concerning');
      expect(concerningGroup.checks().length).toEqual(0);
      expect(concerningGroup.expanded()).toBeTruthy();

      var goodGroup = new HealthCheckGroup('good');
      expect(goodGroup.summary).toEqual('good');
      expect(goodGroup.checks().length).toEqual(0);
      expect(goodGroup.expanded()).toBeFalsy();
    });

    it('does not let group with single check collapse', function() {
      expect(HealthCheck).toBeDefined();
      var args = {
        name: 'name',
        description: 'description',
        health: 'good'
      };
      var check = new HealthCheck(args);
      expect(HealthCheckGroup).toBeDefined();
      var goodGroup = new HealthCheckGroup('good');
      expect(goodGroup.expanded()).toBeFalsy();
      goodGroup.checks([check]);
      expect(goodGroup.expanded()).toBeTruthy();
      goodGroup.toggleExpansion();
      expect(goodGroup.expanded()).toBeTruthy();
    });

    it('can toggle group expansion', function() {
      var goodGroup = new HealthCheckGroup('good');
      expect(goodGroup.expanded()).toBeFalsy();
      goodGroup.toggleExpansion();
      expect(goodGroup.expanded()).toBeTruthy();
    });

    it('knows how to instantiate HealthChecks', function() {
      expect(HealthCheck).toBeDefined();
      var args = {
        name: 'name',
        description: 'description',
        health: 'bad'
      };
      var check = new HealthCheck(args);
      expect(check.name).toEqual('name');
      expect(check.description).toEqual('description');
      expect(check.health).toEqual('bad');
      expect(check.hasTimeSeriesVisualizer).toBeDefined();
      expect(check.hasTimeSeriesVisualizer).toBeFalsy();
      expect(check.hasHeatmapChartDescriptors).toBeDefined();
      expect(check.hasHeatmapChartDescriptors).toBeFalsy();
    });

    it('knows how to describe capabilities on health checks', function() {
      expect(HealthCheck).toBeDefined();
      var caps = {
        hasTimeSeriesVisualizer: true,
        hasHeatmapChartDescriptors: true
      }, args = {
        name: 'name',
        description: 'description',
        health: 'bad',
        caps: caps
      };
      var check = new HealthCheck(args);
      expect(check.hasTimeSeriesVisualizer).toBeTruthy();
      expect(check.hasHeatmapChartDescriptors).toBeTruthy();
    });

    it('adds health check groups correctly', function() {
      var mockGroup = {
        checks: ko.observableArray()
      };
      var numGroups = shct.healthCheckGroups().length;
      shct.addGroupedCheck(mockGroup);
      expect(shct.healthCheckGroups().length).toEqual(numGroups + 1);
    });

    it('sets allExpanded if all groups are empty', function() {
      var allExpanded = _.all(shct.healthCheckGroups(), function(g) { return g.expanded(); });
      // The groups are currently not all expanded.
      expect(allExpanded).toBeFalsy();
      var allHaveNoChecks = _.all(shct.healthCheckGroups(), function(g) { return g.checks().length === 0; });
      // None of the groups have any checks yet.
      expect(allHaveNoChecks).toBeTruthy();
      // Therefore, they can be said to be "expanded".
      expect(shct.allExpanded()).toBeTruthy();      
    });

    it('tracks all expanded correctly when some groups have checks', function() {
      var allExpanded = _.all(shct.healthCheckGroups(), function(g) { return g.expanded(); });
      expect(allExpanded).toBeFalsy();
      // Add a check to the bad group.
      var badArgs = {
        name: 'bad check',
        description: 'bad description',
        health: 'bad'
      };
      var badCheck = new HealthCheck(badArgs);
      shct.onChecksChanged([badCheck]);
      expect(shct.allExpanded()).toBeTruthy();
      var goodArgs = {
        name: 'good check',
        description: 'good description',
        health: 'good'
      };
      var goodCheck1 = new HealthCheck(goodArgs);
      var goodCheck2 = new HealthCheck(goodArgs);
      shct.onChecksChanged([badCheck, goodCheck1, goodCheck2]);
      expect(shct.allExpanded()).toBeFalsy();
      shct.toggleAllExpansion();
      expect(shct.allExpanded()).toBeTruthy();
    });

    it('tracks each groups expansion directly', function() {
      var badArgs = {
        name: 'bad check',
        description: 'bad description',
        health: 'bad'
      };
      var badCheck1 = new HealthCheck(badArgs);
      var badCheck2 = new HealthCheck(badArgs);
      shct.onChecksChanged([badCheck1, badCheck2]);
      expect(shct.allExpanded()).toBeTruthy();
      var badGroup = shct.healthCheckGroups()[0];
      badGroup.toggleExpansion();
      expect(shct.allExpanded()).toBeFalsy();
    });

    it('categorizes checks as they are added and maintains correct state', function() {
      var healthCheckSummary = ['bad', 'concerning', 'good', 'disabled', 'unknown'], i;
      var makeHealthCheck = function(index) {
        var name = 'health_check_' + index;
        var description = 'Description for health check ' + index;
        var health = healthCheckSummary[index % healthCheckSummary.length];
        var args = {
          name: name,
          description: description,
          health: health
        };
        return new HealthCheck(args);
      };

      var checks = [];
      for (i = 0; i < healthCheckSummary.length; i++) {
        checks.push(makeHealthCheck(i));
      }

      var healthCheckGroups = shct.healthCheckGroups();
      _.each(healthCheckGroups, function(group) {
        expect(group.checks().length).toEqual(0);
      });
      shct.onChecksChanged(checks);
      _.each(healthCheckGroups, function(group) {
        expect(group.checks().length).toEqual(1);
      });
    });

    it('makes an initial server request on instantiation', function() {
      // Instantiated in beforeEach.
      expect(shct.madeInitialRequest).toBeTruthy();
    });

    it('will not make a TC-based server request if the time did not change', function() {
      clearAjaxRequests();
      var d = new Date();
      shct.updateForTimeControl(d, false);
      var mockRequest1 = mostRecentAjaxRequest();
      // readyState === 2 means this request was sent.
      expect(mockRequest1.readyState).toEqual(2);
      shct.updateForTimeControl(d, false);
      var mockRequest2 = mostRecentAjaxRequest();
      // The most recent request is the same as the last because
      // no new request has been made.
      expect(mockRequest1).toEqual(mockRequest2);
    });

    it('handles responses from the server', function() {
      var response = {
        data: {
          healthReport: {
            testResults: [
            {
              explanation: 'Test check 1.',
              summary: 2, // Good
              testName: 'someTestName'
            }
            ]
          },
          statusCapabilitiesMap: {
            'someTestName': {
              hasTimeSeriesVisualizer: true,
              hasHeatmapChartDescriptors: true
            }
          }
        }
      };
      spyOn(shct, 'onChecksChanged');
      spyOn(shct, 'createHealthCheckFactory').andCallThrough();
      shct.handleResponseFromServer(JSON.stringify(response));
      expect(shct.onChecksChanged).wasCalled();
      expect(shct.onChecksChanged.callCount).toEqual(1);
      var args = shct.onChecksChanged.argsForCall[0];
      expect(args.length).toEqual(1);
      var checks = args[0];
      expect(checks.length).toEqual(1);
      var check = checks[0];
      expect(check.name).toEqual('someTestName');
      expect(check.description).toEqual('Test check 1.');
      expect(check.health).toEqual('good');
      expect(check.hasTimeSeriesVisualizer).toBeTruthy();
      expect(check.hasHeatmapChartDescriptors).toBeTruthy();
    });

    it('handles not available health check responses from the server', function() {
      var response = {
        data: {
          healthReport: null
        }
      };
      spyOn(shct, 'onChecksChanged');
      shct.handleResponseFromServer(JSON.stringify(response));
      expect(shct.onChecksChanged).wasNotCalled();
      expect(shct.healthIsAvailable()).toBeFalsy();
    });

    it('knows how to create a HealthCheck from the server response', function() {
      var capabilitiesMap = {
        'someTestName': {
          hasTimeSeriesVisualizer: true,
          hasHeatmapChartDescriptors: true
        }
      };
      var serverHealthCheck = {
        explanation: 'Test check 1.',
        summary: 2, // Good
        testName: 'someTestName'
      };
      var factory = shct.createHealthCheckFactory(capabilitiesMap);
      var healthCheck = factory(serverHealthCheck);
      expect(healthCheck.name).toEqual(serverHealthCheck.testName);
      expect(healthCheck.description).toEqual(serverHealthCheck.explanation);
      expect(healthCheck.health).toEqual('good');
      expect(healthCheck.hasTimeSeriesVisualizer).toEqual(capabilitiesMap.someTestName.hasTimeSeriesVisualizer);
      expect(healthCheck.hasHeatmapChartDescriptors).toEqual(capabilitiesMap.someTestName.hasHeatmapChartDescriptors);
      expect(healthCheck.advicePopupUrl).toBeDefined();
      expect(healthCheck.advicePopupUrl.indexOf('http://localhost/advicePopupBaseUrl?') === 0).toBeTruthy();
    });
  });
});
