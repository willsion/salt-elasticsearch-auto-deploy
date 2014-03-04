// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/health/HealthUtil',
  'underscore'
], function(HealthUtil, _) {

  // Based on the status counts (how many bad checks? How many good?),
  // determine the overall health represented by this health event.
  var determineHealth = function(statusCounts) {
    if (statusCounts.bad) {
      return HealthUtil.statusStrings.bad;
    } else if (statusCounts.concerning) {
      return HealthUtil.statusStrings.concerning;
    } else if (!statusCounts.good) {
      if (statusCounts.unknown) {
        return HealthUtil.statusStrings.unknown;
      } else if (statusCounts.disabled) {
        return HealthUtil.statusStrings.disabled;
      }
    }
    return HealthUtil.statusStrings.good;
  };

  // A wrapper around a health event received from the server.
  var HealthEvent = function(event) {
    if (!event) {
      throw new Error('Must pass server health event as ctor param');
    }
    // Utility method for getting attributes known to have single values.
    // Most of the useful values for the "name" param come from
    // EventAttribute.java. Case matters!
    var get = function(name, defaultValue) {
      if (event.attributes && event.attributes[name]) {
        return event.attributes[name][0];
      }
      return defaultValue;
    };
    // Make sure this is a health event.
    if (get('CATEGORY') !== 'HEALTH_CHECK') {
      throw new Error('Can only instantiate on health events');
    }
    this.timestamp = new Date(event.timestamp);
    this.content = event.content;
    this.statusCounts = {
      good: parseInt(get('GOOD_TEST_RESULTS', '0'), 10),
      bad: parseInt(get('BAD_TEST_RESULTS', '0'), 10),
      concerning: parseInt(get('CONCERNING_TEST_RESULTS', '0'), 10),
      disabled: parseInt(get('DISABLED_TEST_RESULTS', '0'), 10),
      unknown: parseInt(get('UNKNOWN_TEST_RESULTS', '0'), 10)
    };
    // HEALTH_TEST_RESULTS is an array of strings. Each string is a
    // JSON-encoded object representing the health checks associated
    // with this event.
    this.healthTestResults = _.map(event.attributes.HEALTH_TEST_RESULTS, function(result) {
      return JSON.parse(result);
    });
    this.health = determineHealth(this.statusCounts);
    this.id = get('__uuid');
    this.url = get('URL');
  };

  return HealthEvent;
});
