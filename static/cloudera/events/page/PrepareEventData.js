// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'knockout',
  'underscore'
], function(ko, _) {
  // Do not display these attributes in the expandable details region.
  var DISALLOWED_ATTRIBUTES = ['ALERT', 'ALERT_SUPPRESSED'];

  var filterAttributes = function(attributes) {
    attributes = attributes || {};
    // Too many more of these and we'll need a rule engine... or, at least,
    // something more complicated than this.
    if (attributes.HOSTS && attributes.HOST_IDS &&
        _.isEqual(attributes.HOSTS, attributes.HOST_IDS)) {
      delete attributes.HOST_IDS;
    }
    if (attributes.ROLE_DISPLAY_NAME) {
      attributes.ROLE = attributes.ROLE_DISPLAY_NAME;
      delete attributes.ROLE_DISPLAY_NAME;
    }
    if (attributes.SERVICE_DISPLAY_NAME) {
      attributes.SERVICE = attributes.SERVICE_DISPLAY_NAME;
      delete attributes.SERVICE_DISPLAY_NAME;
    }
    return attributes;
  };

  // This function is meant to be called as a bound function of an
  // individual event received from the server.
  // Event attributes all come back as arrays. This function searches
  // the named array and returns true if the value is found.
  var hasAttribute = function(attributeName, value) {
    if (!this.attributes || !this.attributes.hasOwnProperty(attributeName)) {
      return false;
    }
    var index = _.indexOf(this.attributes[attributeName], value);
    return index !== -1;
  };

  // This function is meant to be called as a bound function of an
  // individual event received from the server.
  // Event attributes come back as arrays. Simply return the right
  // one of them.
  var getAttributeList = function(attributeName) {
    if (!this.attributes || !this.attributes.hasOwnProperty(attributeName)) {
      return [];
    }
    return this.attributes[attributeName];
  };

  // This function is meant to be called as a bound function of an
  // individual event received from the server.
  // Attributes from the server come back as arrays. Many of them only have
  // a single value. Provide a shortcut method for getting these attributes.
  var getAttribute = function(attributeName, index) {
    var attribute = this.getAttributeList(attributeName);
    if (!attribute || attribute.length === 0) {
      return '';
    }
    if (_.isUndefined(index)) {
      index = 0;
    }
    return attribute[index];
  };

  var toggleDetailsExpanded = function() {
    this.detailsExpanded(!this.detailsExpanded());
  };

  var decorateServerEvent = function(serverEvent) {
    // Add some attributes.
    serverEvent.detailsExpanded = ko.observable(false);
    // We do not want to display some attributes in the details
    // drop-down for events. The attributes object for an event is a
    // mapping of attribute names to arrays that usually have single
    // values (e.g. ALERT: ['true']). This bit of code grabs the keys
    // from that mapping, removes the attributes we don't want, and
    // sorts them alphabetically.
    serverEvent.attributes = filterAttributes(serverEvent.attributes);
    serverEvent.sortedAttributeNames =
      _.difference(
        _.keys(serverEvent.attributes),
        DISALLOWED_ATTRIBUTES).sort();
    // Add utility methods.
    serverEvent.hasAttribute = hasAttribute;
    serverEvent.getAttribute = getAttribute;
    serverEvent.getAttributeList = getAttributeList;
    serverEvent.toggleDetailsExpanded = toggleDetailsExpanded;
    // Event-specific stuff.
    if (serverEvent.hasAttribute('CATEGORY', 'HEALTH_CHECK')) {
      // Process the health check JSON into usable objects.
      var healthChecks = _.map(serverEvent.getAttributeList('HEALTH_TEST_RESULTS'), function(healthTestString) {
        try {
          return JSON.parse(healthTestString);
        } catch (ex) {
          // Chances are this will only happen in development.
          console.log('Malformed health test result: %s', healthTestString);
          return {};
        }
      });
      serverEvent.healthChecks = _.groupBy(healthChecks, 'severity');
      serverEvent.healthCheckSeverities = _.keys(serverEvent.healthChecks);
    }
    return serverEvent;
  };

  // Returns a function that transforms raw event data from server to make it
  // more suitable for display in the event search page. The structure this
  // function expects is an EventQueriesResponse instance.
  // This function ignores any errors that are present and just transforms
  // the event objects.
  //
  // * Provides a sorted list of attribute names.
  // * Adds some utility methods used in the template.
  // * Adds attributes if this looks like a health check event.
  return function(response) {
    return _.map(response.events || [], decorateServerEvent);
  };
});