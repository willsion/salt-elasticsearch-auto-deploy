// Copyright © 2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/include/ServiceStatusHealthTablePopup',
  'knockout',
  'underscore'
], function(ServiceStatusHealthTablePopup, ko, _) {
  describe('ServiceStatusHealthTablePopup tests', function() {

    var options = {
      tableId: 'serviceStatusHealthTablePopupTable',
      roles: [{
        host: {
          hostName: 'host1'
        }
      }, {
        host: {
          hostName: 'host2'
        }
      }],
      healthTestSummary: {}
    };
    
    var sshtp, $popup;

    var mockDataTable = {
      fnSort: jasmine.createSpy(),
      fnSettings: jasmine.createSpy(),
      redrawTable: jasmine.createSpy()
    };

    var HealthCheck = ServiceStatusHealthTablePopup.HealthCheck,
      HealthCheckResult = ServiceStatusHealthTablePopup.HealthCheckResult,
      filterHealthSummary = ServiceStatusHealthTablePopup.filterHealthSummary;

    // Generate data that looks kinda like what the RoleInstanceJSONGenerator will
    // make for the ServiceStatusHealthTablePopup.
    var makeTestRole = function(tag) {
      return {
        id: tag,
        name: tag
      };
    };
    
    // Generate data that looks kinda like what the RoleInstanceJSONGenerator will
    // make for the ServiceStatusHealthTablePopup.
    var makeTestHealth = function(text, tag) {
      return {
        'text': text,
        'tag': tag
      };
    };
    
    // Generate data that looks kinda like what the RoleInstanceJSONGenerator will
    // make for the ServiceStatusHealthTablePopup.
    var makeTestSummary = function(health, numRoles) {
      var fakeRoles = [], i;
      for (i = 0; i < numRoles; i++) {
        fakeRoles.push({
          name: 'Host ' + i
        });
      }
      return {
        health: makeTestHealth(health, health),
        roles: fakeRoles
      };
    };
    
    var makeTestCheck = function(name) {
      return {
        'shortDisplayName': name,
        'longDisplayName': name + ' ' + name,
        'summary': [makeTestSummary('health1', 1), makeTestSummary('health2', 2)]
      };
    };
    
    beforeEach(function() {
      // Mock up the dataTable jQuery plugin.
      spyOn($.fn, 'dataTable').andReturn(mockDataTable);
      sshtp = new ServiceStatusHealthTablePopup(options);
      $popup = $('<div id="serviceStatusHealthTablePopup"></div>').appendTo('body');
    });
    
    afterEach(function() {
      $popup.remove();
    });
    
    it('instantiates a RoleInstancesTable', function() {
      expect(sshtp.roleInstancesTable).toBeTruthy();
    });

    it('sorts by name as well as status', function() {
      // The default sort settings should be set the correct way.
      expect($.fn.dataTable).wasCalled();
      var settings = $.fn.dataTable.mostRecentCall.args[0];
      expect(settings).toBeDefined();
      expect(_.isArray(settings.aaSorting)).toBeTruthy();
      expect(settings.aaSorting.length).toEqual(2);
      var sort1 = settings.aaSorting[0];
      var sort2 = settings.aaSorting[1];
      expect(sort1.length).toEqual(2);
      expect(sort2.length).toEqual(2);
      // These values are from RoleInstancesTable.
      // 8 = ROLE_STATE_COL
      // 4 = HOST_COL
      expect(sort1[0]).toEqual(8);
      expect(sort1[1]).toEqual('asc');
      expect(sort2[0]).toEqual(4);
      expect(sort2[1]).toEqual('asc');
    });

    it('is not filtering by default', function() {
      expect(sshtp.currentHealthCheckFilter()).toBeFalsy();
    });
    
    it('applies the Knockout bindings during instantiation', function() {
      spyOn(ko, 'applyBindings');
      sshtp = new ServiceStatusHealthTablePopup(options);
      expect(ko.applyBindings).wasCalledWith(sshtp, $popup[0]);
    });

    it('does not show stats for empty summaries', function() {
      var healthCheck = new HealthCheck({
        'summary': {}
      });
      expect(healthCheck.stats).toEqual([]);
    });

    it('ignores stats for HISTORY_NOT_AVAIL', function() {
      var healthCheck = new HealthCheck({
        'summary': {
          'HISTORY_NOT_AVAIL': makeTestSummary('unknown', 0)
        }
      });
      expect(healthCheck.stats).toEqual([]);
    });
    
    it('sorts severities RED > YELLOW > NOT_AVAIL > GREEN', function() {
      var healthCheck = new HealthCheck({
        'summary': {
          'GREEN': makeTestSummary('green', 1),
          'NOT_AVAIL': makeTestSummary('notAvail', 2),
          'YELLOW': makeTestSummary('yellow', 3),
          'RED': makeTestSummary('red', 4)
        }
      });
      expect(healthCheck.stats).toBeDefined();
      expect(healthCheck.stats.length).toEqual(4);
      expect(healthCheck.stats[0].html).toEqual('<span class="redHealth">4 red</span>');
      expect(healthCheck.stats[1].html).toEqual('<span class="yellowHealth">3 yellow</span>');
      expect(healthCheck.stats[2].html).toEqual('<span class="notAvailHealth">2 notAvail</span>');
      expect(healthCheck.stats[3].html).toEqual('<span class="greenHealth">1 green</span>');
    });
    
    it('returns summaries of the health checks', function() {
      sshtp.healthSummary = {
        'SOME_CHECK1': makeTestCheck('Some Check1'),
        'SOME_CHECK2': makeTestCheck('Some Check2')
      };
      var result = sshtp.getSummary();
      expect(result.length).toEqual(2);
      expect(result[0].displayName).toEqual('Some Check1');
      expect(result[1].displayName).toEqual('Some Check2');
    });

    it('filters by health check roles when asked', function() {
      var getHostNameSpy = jasmine.createSpy().andReturn('Host 3');
      sshtp.roleInstancesTable = {
        setFilterFunc: jasmine.createSpy(),
        redrawTable: jasmine.createSpy(),
        getHostName: getHostNameSpy
      };
      var healthCheckResult = new HealthCheckResult(makeTestSummary('green', 7));
      sshtp.filterByHealthCheckRoles(healthCheckResult);
      expect(sshtp.roleInstancesTable.setFilterFunc).wasCalled();
      expect(sshtp.roleInstancesTable.redrawTable).wasCalled();
      expect(sshtp.roleInstancesTable.setFilterFunc.mostRecentCall.args.length).toEqual(1);

      // Make sure the filter callback does vaguely sane things.
      var callback = sshtp.roleInstancesTable.setFilterFunc.mostRecentCall.args[0];
      expect(callback(null)).toBeTruthy();
      expect(callback([])).toBeTruthy();

      getHostNameSpy.andReturn('Host 2');
      var mockRowData = ['0', '1', '2', 'Host 2'];
      expect(callback(mockRowData)).toBeTruthy();

      getHostNameSpy.andReturn('Host 37');
      mockRowData = ['0', '1', '2', 'Host 37'];
      expect(callback(mockRowData)).toBeFalsy();
    });

    it('correctly removes the filter once added', function() {
      sshtp.roleInstancesTable = {
        clearFilterFunc: jasmine.createSpy(),
        redrawTable: jasmine.createSpy()
      };
      spyOn(sshtp, 'currentHealthCheckFilter');
      sshtp.removeFilter();
      expect(sshtp.roleInstancesTable.clearFilterFunc).wasCalled();
      expect(sshtp.roleInstancesTable.redrawTable).wasCalled();
      expect(sshtp.currentHealthCheckFilter).wasCalledWith(null);

    });

    it('summarizes a health check correctly', function() {
      var healthCheckResult = new HealthCheckResult(makeTestSummary('green', 5));
      expect(healthCheckResult.html).toEqual('<span class="greenHealth">5 green</span>');
      expect(healthCheckResult.hostNames).toBeDefined();
      expect(healthCheckResult.hostNames.length).toEqual(5);
    });

    it('has a function called filterHealthSummary', function() {
      expect(filterHealthSummary).toBeDefined();
    });

    it('filters health checks we do not care about', function() {
      var healthSummary = {
        HEALTH_CHECK_1: {
          summary: {
            GREEN: {
              roles: [makeTestRole('h1')]
            }
          }
        },
        HEALTH_CHECK_2: {
          summary: {
            GREEN: {
              roles: [makeTestRole('h2')]
            }
          }
        }
      };
      var allowedHosts = {
        'h2': true
      };
      var filteredSummary = filterHealthSummary(healthSummary, allowedHosts);
      expect(filteredSummary.HEALTH_CHECK_1).toBeUndefined();
      expect(filteredSummary.HEALTH_CHECK_2).toBeDefined();
    });

    it('filters health check summaries we do not care about', function() {
      var healthSummary = {
        HEALTH_CHECK_1: {
          summary: {
            GREEN: {
              roles: [makeTestRole('h1')]
            },
            YELLOW: {
              roles: [makeTestRole('h2')]
            }
          }
        }
      };
      var allowedHosts = {
        'h2': true
      };
      var filteredSummary = filterHealthSummary(healthSummary, allowedHosts);
      expect(filteredSummary.HEALTH_CHECK_1).toBeDefined();
      expect(filteredSummary.HEALTH_CHECK_1.summary.GREEN).toBeUndefined();
      expect(filteredSummary.HEALTH_CHECK_1.summary.YELLOW).toBeDefined();
    });

    it('filters roles we do not care about', function() {
      var healthSummary = {
        HEALTH_CHECK_1: {
          summary: {
            GREEN: {
              roles: [makeTestRole('h1'), makeTestRole('h2'), makeTestRole('h3')]
            },
            YELLOW: {
              roles: [makeTestRole('h2'), makeTestRole('h3'), makeTestRole('h4')]
            }
          }
        },
        HEALTH_CHECK_2: {
          summary: {
            GREEN: {
              roles: [makeTestRole('h1'), makeTestRole('h2'), makeTestRole('h3')]
            },
            YELLOW: {
              roles: [makeTestRole('h2'), makeTestRole('h3'), makeTestRole('h4')]
            }
          }
        }
      };
      var allowedHosts = {
        'h2': true,
        'h3': true
      };
      var filteredSummary = filterHealthSummary(healthSummary, allowedHosts);
      var health1GreenRoles = filteredSummary.HEALTH_CHECK_1.summary.GREEN.roles;
      var health1YellowRoles = filteredSummary.HEALTH_CHECK_1.summary.YELLOW.roles;
      var health2GreenRoles = filteredSummary.HEALTH_CHECK_2.summary.GREEN.roles;
      var health2YellowRoles = filteredSummary.HEALTH_CHECK_2.summary.YELLOW.roles;
      var validate = function(roles) {
        expect(roles[0].name).toEqual('h2');
        expect(roles[1].name).toEqual('h3');
      };
      expect(health1GreenRoles.length).toEqual(2);
      validate(health1GreenRoles);
      expect(health1YellowRoles.length).toEqual(2);
      validate(health1YellowRoles);
      expect(health2GreenRoles.length).toEqual(2);
      validate(health2GreenRoles);
      expect(health2YellowRoles.length).toEqual(2);
      validate(health2YellowRoles);
    });
  });
});
