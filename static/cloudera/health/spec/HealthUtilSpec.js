// (c) Copyright 2012 Cloudera, Inc. All rights reserved.

// Provide the /cmf/healthChecks/shortNameTranslations.json so that we don't
// hit the server. This block is duplicated in HealthHistorySpec.js. We
// probably don't want to do this long-term and should instead stub
// the json! plugin somehow.
// Duplicated in HealthHistorySpec.js to cover dependency in HealthUtils.js.
define('json!/cmf/resources/healthChecks/shortNameTranslations.json', function() {
  return {
    'DATA_NODE_HOST_HEALTH': 'test.data.node.host.health'
  };
});

define([
  'cloudera/health/HealthUtil',
  'cloudera/health/spec/HealthTestUtil',
  'underscore'
], function(HealthUtil, HealthTestUtil, _) {

  // This utility class makes heavy use of I18ned resources that are
  // generated dynamically by the server. We don't want to depend on
  // the server generating those resources, so we depend on

  describe('HealthUtil', function() {
    it('maintains a list of magic status strings', function() {
      // Since the values are meant to be opaque, no need to test what
      // the values are here... just that they're present.
      expect(HealthUtil.statusStrings).toBeDefined();
      expect(_.size(HealthUtil.statusStrings)).toEqual(5);
    });

    it('maintains a list of valid statuses', function() {
      expect(HealthUtil.healthCheckStatuses).toBeDefined();
      expect(HealthUtil.healthCheckStatuses.length).toEqual(_.size(HealthUtil.statusStrings));
    });

    it('maintains a list of valid severities', function() {
      expect(HealthUtil.severityStrings).toBeDefined();
      expect(HealthUtil.severityDisplayOrder).toBeDefined();
      // We generally don't show HISTORY_NOT_AVAIL anywhere, so don't
      // worry about its display order relative to everything else.
      expect(_.size(HealthUtil.severityStrings)).toEqual(HealthUtil.severityDisplayOrder.length + 1);
    });

    it('maintains a map of enum values to severity', function() {
      expect(HealthUtil.severityEnumValues).toBeDefined();
    });

    it('converts health check name into I18ned name', function() {
      var actual = HealthUtil.getHealthCheckShortName('DATA_NODE_HOST_HEALTH');
      expect(actual).toEqual('test.data.node.host.health');
    });

    it('converts health status into I18ned status', function() {
      var actual = HealthUtil.getHealthStatusText('bad');
      expect(actual).toEqual('ui.health.bad');

      actual = HealthUtil.getHealthStatusText('BAD');
      expect(actual).toEqual('ui.health.bad');

      actual = HealthUtil.getHealthStatusText('concerning');
      expect(actual).toEqual('ui.health.concerning');
    });

    it('can get health status from event codes', function() {
      expect(HealthUtil.getHealthStatusFromEventCode('EV_ROLE_HEALTH_CHECK_BAD')).toEqual('bad');
      expect(HealthUtil.getHealthStatusFromEventCode('EV_HOST_HEALTH_CHECK_CONCERNING')).toEqual('concerning');
    });

    it('can return health change numbers', function() {
      expect(HealthUtil.formatHealthChanges('bad', 3)).toEqual('health.changes.red');
      expect(HealthUtil.formatHealthChanges('catpants', 42)).toEqual('health.changes.not_avail');
      // Ignores case.
      expect(HealthUtil.formatHealthChanges('BAD', 3)).toEqual('health.changes.red');
    });

    it('maintains health-related event codes', function() {
      expect(HealthUtil.eventCodeMap).toBeDefined();
      expect(_.size(HealthUtil.eventCodeMap)).toEqual(15);
    });
  });
});
