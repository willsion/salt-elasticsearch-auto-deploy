// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/health/HealthEvent',
  'cloudera/health/HealthUtil',
  'cloudera/common/TimeBoundedQuery',
  'cloudera/Util',
  'cloudera/common/Humanize',
  'cloudera/common/MagicStrings',
  'cloudera/common/I18n',
  'knockout',
  'komapping',
  'underscore'
], function(HealthEvent, HealthUtil, TimeBoundedQuery, Util, Humanize, strings,
    I18n, ko, komapping, _) {
  var DEFAULT_OFFSET = 0;
  var DEFAULT_LIMIT = 20;

  // Create a HealthEvent instance and then decorate it with
  // health-history-specific properties. This mostly includes I18n'ed text,
  // but also includes reorganizing the associated health check data for
  // easier data binding within the template.
  var createHealthEvents = function(serverEvents) {
    var previousEvent,
        sixtySeconds = 60 * 1000;
    return _.map(serverEvents, function(serverEvent) {
      var event = new HealthEvent(serverEvent);
      // Decorate the basic HealthEvent object with some properties that
      // are health history specific: tracking row expansion, humanizing
      // its timestamp, etc.

      // If the previous event happened more than 60 seconds in the future, show seconds in the formatted time.
      if (previousEvent && (previousEvent.timestamp - event.timestamp.getTime()) < sixtySeconds) {
        if (!previousEvent.showSeconds) {
          previousEvent.formattedTimestamp =
              Humanize.humanizeDateTimeAdaptable(previousEvent.timestamp, true);
          previousEvent.showSeconds = true;
        }

        event.showSeconds = true;
      }

      event.formattedTimestamp =
          Humanize.humanizeDateTimeAdaptable(event.timestamp, event.showSeconds);

      event.expanded = ko.observable(false);
      event.toggleExpansion = function() {
        event.expanded(!event.expanded());
      };
      event.healthText = HealthUtil.getHealthStatusText(event.health);
      // For every health test, construct an object with two attributes:
      // a descriptive short name for this health check and a string that
      // gives the status of this health check (e.g. bad? good?).
      event.healthTests = _.map(event.healthTestResults, function(healthTest) {
        return {
          'shortName': HealthUtil.getHealthCheckShortName(healthTest.testName),
          'status': HealthUtil.getHealthStatusFromEventCode(healthTest.eventCode),
          'content': healthTest.content
        };
      });
      // event.statusCount has keys corresponding to status
      // (bad, good, etc). The value for a key is the number of health
      // checks with this status in this event.
      // We need to display this to the user, so iterate through the
      // status counts and I18n the counts.
      event.formattedStatusCounts = _.object(
        _.map(event.statusCounts, function(statusCount, status) {
          return [status,
            HealthUtil.formatHealthChanges(status, statusCount)];
      }));
      event.showEvent = function() {
        $.publish('changeMarkerTime', [new Date(event.timestamp), true]);
      };
      previousEvent = event;
      return event;
    });
  };

  // The view model for the health history widget.
  // Options:
  // * eventSearchUrl: the base URL to construct event searches from.
  // * filters: a list of filter instances for the event search query.
  // * endTime: a Date instance marking the end time of our query.
  var HealthHistoryViewModel = function(options) {
    var self = this;
    self.events = ko.observableArray();
    self.loading = ko.observable(false);
    self.errors = ko.observableArray();

    // The start time for our query is the beginning of time.
    this.query = new TimeBoundedQuery(new Date(0), options.endTime,
      options.filters, DEFAULT_OFFSET, DEFAULT_LIMIT);

    // The serverEvents property should be a list of Event objects sent from
    // the server.
    self.onDataReceived = function(serverEvents) {
      self.events(createHealthEvents(serverEvents));
    };

    self.onErrorsReceived = function(errors) {
      console.error("Exception retrieving health history:", errors);
      if (errors && errors.length) {
        self.errors(errors);
      } else {
        self.errors([I18n.t('ui.healthHistoryError')]);
      }
    };

    self.getEvents = function() {
      // If we already have a query in-flight, abort it.
      if (self.query.isInflight()) {
        self.query.abort();
      }
      self.errors([]);
      self.loading(true);
      self.query.execute(options.eventSearchUrl, {
        // The data received by this function is an instance of
        // EventQueriesResponse sent by the server.
        success: function(data) {
          if (data) {
            if (data.errors && data.errors.length) {
              self.onErrorsReceived(data.errors);
            } else {
              self.onDataReceived(data.events);
            }
          } else {
            console.warn('Null data received from the server.');
          }
        },
        complete: function() {
          self.loading(false);
        },
        error: function() {
          console.error('Server responded with error:', arguments);
          self.errors([I18n.t('ui.healthHistoryError')]);
        }
      });
    };
  };

  // Options:
  // * id: the ID of the HTML element with the table. For applying
  //   KO bindings.
  // * endTime: a Date object for the end of the query
  // * eventSearchUrl: the base URL to construct event searches from.
  // * service: the name of the service we want health history for.
  // * role: the name of the role we want health history for.
  // * host: the name of the host we want health history for.
  var HealthHistory = function(options) {
    this.id = options.id;
    this.eventSearchUrl = options.eventSearchUrl;

    // Build filters for event search.
    var filters = [{
      propertyName: strings.events.attributes.category,
      compareType: strings.compareTypes.equalsMultiple,
      values: [strings.events.categories.healthCheck]
    }];

    var eventCodeMap = HealthUtil.eventCodeMap;
    // Change the query based on what was passed in. Are we querying a
    // role's health history? A service? Etc.
    if (options.role) {
      filters.push({
        propertyName: strings.events.attributes.role,
        compareType: strings.compareTypes.equalsMultiple,
        values: [options.role]
      });
      filters.push({
        propertyName: strings.events.attributes.eventCode,
        compareType: strings.compareTypes.equalsMultiple,
        values:[
          eventCodeMap.EV_ROLE_HEALTH_CHECK_BAD,
          eventCodeMap.EV_ROLE_HEALTH_CHECK_CONCERNING,
          eventCodeMap.EV_ROLE_HEALTH_CHECK_DISABLED,
          eventCodeMap.EV_ROLE_HEALTH_CHECK_GOOD,
          eventCodeMap.EV_ROLE_HEALTH_CHECK_UNKNOWN]
      });
    } else if (options.service) {
      filters.push({
        propertyName: strings.events.attributes.service,
        compareType: strings.compareTypes.equalsMultiple,
        values: [options.service]
      });
      filters.push({
        propertyName: strings.events.attributes.eventCode,
        compareType: strings.compareTypes.equalsMultiple,
        values:[
          eventCodeMap.EV_SERVICE_HEALTH_CHECK_BAD,
          eventCodeMap.EV_SERVICE_HEALTH_CHECK_CONCERNING,
          eventCodeMap.EV_SERVICE_HEALTH_CHECK_DISABLED,
          eventCodeMap.EV_SERVICE_HEALTH_CHECK_GOOD,
          eventCodeMap.EV_SERVICE_HEALTH_CHECK_UNKNOWN]
      });
    } else if (options.host) {
      filters.push({
        propertyName: strings.events.attributes.hosts,
        compareType: strings.compareTypes.equalsMultiple,
        values: [options.host]
      });
      filters.push({
        propertyName: strings.events.attributes.eventCode,
        compareType: strings.compareTypes.equalsMultiple,
        values:[
          eventCodeMap.EV_HOST_HEALTH_CHECK_BAD,
          eventCodeMap.EV_HOST_HEALTH_CHECK_CONCERNING,
          eventCodeMap.EV_HOST_HEALTH_CHECK_DISABLED,
          eventCodeMap.EV_HOST_HEALTH_CHECK_GOOD,
          eventCodeMap.EV_HOST_HEALTH_CHECK_UNKNOWN]
      });
    }

    this.viewModel = new HealthHistoryViewModel({
      eventSearchUrl: options.eventSearchUrl,
      filters: filters,
      endTime: options.endTime
    });
  };

  HealthHistory.prototype.applyBindings = function() {
    // Subscribe to global events.
    this.subscribe();
    // Bind to the element we're supposed to modify.
    ko.applyBindings(this.viewModel, $('#' + this.id)[0]);
    // Fetch event data.
    this.viewModel.getEvents();
  };

  HealthHistory.prototype.onMarkerDateChanged = function(markerDate) {
    this.viewModel.query.endTime = markerDate;
    this.viewModel.query.offset = DEFAULT_OFFSET;
    this.viewModel.query.limit = DEFAULT_LIMIT;
    this.viewModel.getEvents();
  };

  HealthHistory.prototype.subscribe = function() {
    var handle1 = $.subscribe('markerDateChanged',
      this.onMarkerDateChanged.bind(this));
    this.subscriptionHandles = [handle1];
  };

  HealthHistory.prototype.unsubscribe = function() {
    Util.unsubscribe(this);
  };

  // Expose type for testing.
  HealthHistory.HealthHistoryViewModel = HealthHistoryViewModel;

  return HealthHistory;
});
