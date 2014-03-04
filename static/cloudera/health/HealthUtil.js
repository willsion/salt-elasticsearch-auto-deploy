// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/common/I18n',
  'json!/cmf/resources/healthChecks/shortNameTranslations.json'
], function(I18n, shortNameTranslationsMap) {

  var magicStatusStrings = {
    bad: 'bad',
    concerning: 'concerning',
    good: 'good',
    disabled: 'disabled',
    unknown: 'unknown'
  };

  var magicSeverityStrings = {
    red: 'RED',
    yellow: 'YELLOW',
    green: 'GREEN',
    disabled: 'DISABLED',
    unknown: 'NOT_AVAIL',
    historyNotAvailable: 'HISTORY_NOT_AVAIL'
  };

  // Sync from com.cloudera.cmf.event.EventCode.
  var healthEventCodes = {
    EV_ROLE_HEALTH_CHECK_BAD: 'EV_ROLE_HEALTH_CHECK_BAD',
    EV_ROLE_HEALTH_CHECK_CONCERNING: 'EV_ROLE_HEALTH_CHECK_CONCERNING',
    EV_ROLE_HEALTH_CHECK_DISABLED: 'EV_ROLE_HEALTH_CHECK_DISABLED',
    EV_ROLE_HEALTH_CHECK_GOOD: 'EV_ROLE_HEALTH_CHECK_GOOD',
    EV_ROLE_HEALTH_CHECK_UNKNOWN: 'EV_ROLE_HEALTH_CHECK_UNKNOWN',

    EV_SERVICE_HEALTH_CHECK_BAD: 'EV_SERVICE_HEALTH_CHECK_BAD',
    EV_SERVICE_HEALTH_CHECK_CONCERNING: 'EV_SERVICE_HEALTH_CHECK_CONCERNING',
    EV_SERVICE_HEALTH_CHECK_DISABLED: 'EV_SERVICE_HEALTH_CHECK_DISABLED',
    EV_SERVICE_HEALTH_CHECK_GOOD: 'EV_SERVICE_HEALTH_CHECK_GOOD',
    EV_SERVICE_HEALTH_CHECK_UNKNOWN: 'EV_SERVICE_HEALTH_CHECK_UNKNOWN',

    EV_HOST_HEALTH_CHECK_BAD: 'EV_HOST_HEALTH_CHECK_BAD',
    EV_HOST_HEALTH_CHECK_CONCERNING: 'EV_HOST_HEALTH_CHECK_CONCERNING',
    EV_HOST_HEALTH_CHECK_DISABLED: 'EV_HOST_HEALTH_CHECK_DISABLED',
    EV_HOST_HEALTH_CHECK_GOOD: 'EV_HOST_HEALTH_CHECK_GOOD',
    EV_HOST_HEALTH_CHECK_UNKNOWN: 'EV_HOST_HEALTH_CHECK_UNKNOWN'
  };

  // Keep this in sync with com.cloudera.cmon.kaiser.HealthTestResult.Summary.
  var magicSeverityEnumValues = {};
  magicSeverityEnumValues[magicSeverityStrings.disabled] = 0;
  magicSeverityEnumValues[magicSeverityStrings.unknown] = 1;
  magicSeverityEnumValues[magicSeverityStrings.green] = 2;
  magicSeverityEnumValues[magicSeverityStrings.yellow] = 3;
  magicSeverityEnumValues[magicSeverityStrings.red] = 4;
  magicSeverityEnumValues[magicSeverityStrings.historyNotAvailable] = 5;

  var healthChangesStatusToColorMap = {};
  healthChangesStatusToColorMap[magicStatusStrings.bad] = magicSeverityStrings.red;
  healthChangesStatusToColorMap[magicStatusStrings.concerning] = magicSeverityStrings.yellow;
  healthChangesStatusToColorMap[magicStatusStrings.good] = magicSeverityStrings.green;
  healthChangesStatusToColorMap[magicStatusStrings.disabled] = magicSeverityStrings.disabled;
  healthChangesStatusToColorMap[magicStatusStrings.unknown] = magicSeverityStrings.unknown;

  return {
    // The magic strings corresponding to our statuses.
    statusStrings: magicStatusStrings,

    // The magic strings corresponding to our severities.
    // This should stay in sync with the
    // com.cloudera.cmon.kaiser.HealthTestResult.Summary enum.
    severityStrings: magicSeverityStrings,

    // Enum values from the server.
    // Keep this in sync with com.cloudera.cmon.kaiser.HealthTestResult.Summary.
    severityEnumValues: magicSeverityEnumValues,

    // Enum values from the server.
    // Keep this in sync with com.cloudera.cmf.event.EventCode.
    eventCodeMap: healthEventCodes,

    // The order we display our severities in.
    severityDisplayOrder: [magicSeverityStrings.red, magicSeverityStrings.yellow,
      magicSeverityStrings.unknown, magicSeverityStrings.green,
      magicSeverityStrings.disabled],

    // The order of these strings correspond to the HealthTestResult.Summary
    // enum defined by the server.
    healthCheckStatuses: [magicStatusStrings.disabled, magicStatusStrings.unknown,
      magicStatusStrings.good, magicStatusStrings.concerning, magicStatusStrings.bad],

    // Indices into this.healthCheckStatuses array. Display health checks
    // in this order.
    statusDisplayOrder: [4, 3, 1, 2, 0],

    // Given a health check name like DATA_NODE_HOST_HEALTH,
    // return the I18n'ed short name.
    getHealthCheckShortName: function(healthCheckName) {
      return I18n.t(shortNameTranslationsMap[healthCheckName]);
    },

    // Given health status like 'bad' or 'concerning', return the
    // corresponding I18n'ed text.
    getHealthStatusText: function(status) {
      return I18n.t('ui.health.' + status.toLowerCase());
    },

    // Given an event code, return the corresponding status.
    getHealthStatusFromEventCode: function(eventCode) {
      var result = 'good';
      if (eventCode) {
        var tokens = eventCode.split('_');
        if (tokens) {
          result = tokens.pop().toLowerCase();
        }
      }
      return result;
    },

    // Returns the I18n'ed text for "3 Bad".
    // Health is one of 'bad', 'concerning', etc.
    formatHealthChanges: function(status, num) {
      status = status.toLowerCase();
      var color = healthChangesStatusToColorMap[magicStatusStrings.unknown];
      if (healthChangesStatusToColorMap.hasOwnProperty(status)) {
        color = healthChangesStatusToColorMap[status];
      }
      return I18n.t('health.changes.' + color.toLowerCase(), num);
    }
  };
});
