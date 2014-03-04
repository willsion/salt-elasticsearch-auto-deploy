

/**
 * A page module for handling interactions related to replication scheduling.
 */
define([
    'cloudera/Analytics',
    'cloudera/cmf/replication/ViewModel',
    'cloudera/cmf/replication/EditViewModel',
    'cloudera/common/MagicStrings',
    'underscore',
    'knockout',
    'komapping',
    'cloudera/Util',
    'cloudera/common/repeat',
    'ko.datetimepicker',
    'cloudera/form/DisableAfterClickOnce',
    'cloudera/knockout/ko.infinitescroll',
    'cloudera/knockout/ko.formattedDate',
    'cloudera/knockout/ko.formattedBytes'
    ], function(analytics, ViewModel, EditViewModel, magicStrings, _, ko, komapping, Util) {
    /**
    * This provides all of the functionality required for display and editing of replications and schedules.
    *
    * container: The element that contains the UI components.
    * dialog: The element that contains the replication editing dialog.
    * listingLimit: The maximum number of result to retrieve in each batch of replication logs.
    * pathTemplate: The element that contains the template for path display strings.
    * serviceType: The type of service this replication instance is applicable to. (HDFS, HIVE)
    * serviceUri: The URI template for the service.
    * serviceRef: The reference object for the service.
    * commandDetailsUri: The URI template for the history command details.
    * replicationListingUri: The URI template for the replication listing log.
    * replicationStatusUri: The URI template for the replication status log.
    * readOnly: A boolean value indicating editablity of the replication data.
    */
  var Replication = function(options) {
      var $container = $(options.container),
        $dialog = $(options.dialog);

      if (!options.replicationUri) {
        options.replicationUri = options.serviceUri + 'replications/';
      }

      options.displaySource = this.formatReference(options.serviceRef);

      this.options = options;

      this.viewModel = new ViewModel(this);
      ko.applyBindings(this.viewModel, $container[0]);

      if (!options.readOnly) {
        this.editViewModel = new EditViewModel($dialog, _.bind(this.persistSchedule, this), options, _.bind(this.loadSchedules, this));
        ko.applyBindings(this.editViewModel, $dialog.find('.modal-body')[0]);
        this.loadSources();
        this.loadServices();
      }

      this.loadSchedules();

      $("[data-disable-after-click-once=true]").DisableAfterClickOnce();
    };

  Replication.prototype.monitors = [];
  Replication.prototype.monitorCommand = function(schedule, command) {
    if (_.find(this.monitors, function(monitor) { return command.id === monitor.commandId; })) {
      return;
    }

    var self = this,
      monitor = function() {
        $.getJSON(command.resultDataUrl, function (current) {
          command.active = current.progress < 100;

          command.hdfsResult = current;

          if (current.progress >= 100) {
            var intervalIndex = self.monitors.indexOf(monitor);
            if (intervalIndex > -1) {
              clearInterval(monitor.intervalId);
              self.monitors.splice(intervalIndex, 1);
              self.loadSchedules();
            }
          }
        });
      };
    monitor.intervalId = setInterval(monitor, 5 * 1000);
    monitor.commandId = command.id;
    self.monitors.push(monitor);
  };

  Replication.prototype.persistSchedule = function(options, schedule, update, successCallback, errorCallback) {
    var data = komapping.toJS(schedule),
      hiveArguments = data.hiveArguments,
      hdfsArguments = data.hdfsArguments || (hiveArguments && hiveArguments.hdfsArguments),
      uri,
      method;

    // This is to resolve an issue with endTime never being mapped in Chrome.
    data.endTime = schedule.endTime();

    if (data.endTime && _.isDate(data.endTime)) {
      data.endTime = Util.dateToIsoString(data.endTime);
    } else if (_.isEmpty(data.endTime)) {
      data.endTime = null;
    }

    if (data.startTime && _.isDate(data.startTime)) {
      data.startTime = Util.dateToIsoString(data.startTime);
    } else if (_.isEmpty(data.startTime)) {
      data.startTime = null;
    }

    // Removing expandos that I've added for binding purposes.
    delete (hiveArguments || hdfsArguments).displaySource;
    delete data.history;

    // If the user empties any of the following values, we should send a null to the server to reset it to the default value.
    if (hiveArguments) {
      if (_.isEmpty(hiveArguments.exportDir)) {
        data.hiveArguments.exportDir = null;
      }

      if (_.isEmpty(hdfsArguments.destinationPath)) {
        hdfsArguments.destinationPath = null;
      }
    }

    if(hdfsArguments) {
      if (_.isEmpty(hdfsArguments.schedulerPoolName)) {
        hdfsArguments.schedulerPoolName = null;
      }

      if (_.isEmpty(hdfsArguments.userName)) {
        hdfsArguments.userName = null;
      }

      if (_.isEmpty(hdfsArguments.logPath)) {
        hdfsArguments.logPath = null;
      }

      if (!_.isNumber(hdfsArguments.numMaps) && _.isEmpty(hdfsArguments.numMaps)) {
        hdfsArguments.numMaps = null;
      }

      if (!_.isNumber(hdfsArguments.bandwidthPerMap) && _.isEmpty(hdfsArguments.bandwidthPerMap)) {
        hdfsArguments.bandwidthPerMap = null;
      }
    }

    if (update) {
      uri = options.replicationUri + encodeURIComponent(data.id);
      method = 'PUT';
    } else {
      uri = options.replicationUri;
      data = {items: [data]};
      method = 'POST';
      analytics.trackEvent('Replication', 'Created', options.serviceType);

    }
    $.ajax(uri, {
      data: komapping.toJSON(data),
      type: method,
      dataType : 'json',
      contentType : 'application/json',
      success : successCallback,
      error: errorCallback
    });
  };

  Replication.prototype.triggerReplication = function(replicationId, dryRun) {
    var self = this;
    $.ajax(self.options.replicationUri + replicationId + '/run?dryRun=' + (dryRun ? 'true' : 'false'), {
      type: 'POST',
      dataType : 'json',
      contentType : 'application/json',
      success : function() {
        self.loadSchedules();
      }
    });
  };

  /**
   * This function will retrieve all registered HDFS and MapReduce services and populate the destinations and
   * mapreduceServices properties with the results.
   */
  Replication.prototype.loadServices = function() {
    var self = this, clusterName = this.options.serviceRef.clusterName;
    $.getJSON('/api/v2/clusters?view=export', function(data) {
      var cluster = _.find(data.items, function(cluster) {
        return cluster.name === clusterName;
      });

      if (cluster) {
        self.editViewModel.mapreduceServices(_.filter(cluster.services, function(service) {
          return service.type === magicStrings.serviceTypes.mapreduce;
        }));
      }
    });
  };

  Replication.prototype.pairSchedulesToSources = function() {
    _.each(this.viewModel.replicationSchedules(), function(sourceSchedules) {
      var sourceServiceDisplay = sourceSchedules[0],
          scheduleArray = sourceSchedules[1],
          sourceService = _.find(this.viewModel.sources(), function(source) {
            return source.displayName === sourceServiceDisplay;
          });

      _.each(scheduleArray, function(schedule) {
        if (sourceService) {
          (schedule.hdfsArguments || schedule.hiveArguments).sourceService = sourceService.value;
        }
        schedule.invalid(!sourceService);
      });
    }, this);

    this.viewModel.replicationSchedules.valueHasMutated();
  };

  /**
   * This function will retrieve all registered replication schedules and populate
   * the replicationSchedules property with the results.
   */
  Replication.prototype.loadSchedules = function() {
    var self = this,
      monitorIndex = self.monitors && self.monitors.length;

    while (monitorIndex) {
      clearInterval(self.monitors[monitorIndex -= 1].intervalId);
    }
    self.monitors = [];

    if (this.scheduleRepeater) {
      this.scheduleRepeater.stop();
    }

    this.scheduleRepeater = $.getJSON(this.options.replicationUri + '?view=SUMMARY', function(data) {
      var schedules = [],
        /*
         * This will sort the scheduled replications to the top, followed by the
         * replications that are not scheduled to run again and then finally the
         * replications that are paused.
         */
        sortedItems = _.sortBy(data.items, function(schedule) {
          var value = 0;
          if (schedule.paused) {
            value = 2;
          } else if (!schedule.nextRun) {
            value = 1;
          }
          return value;
        });

      _.each(sortedItems, function(schedule) {
        var args = schedule.hdfsArguments || schedule.hiveArguments,
          sourceServiceDisplay = self.formatReference(args.sourceService);

        args.displaySource = self.formatReference(args.sourceService, args.sourcePath);

        // Ensuring that if the export path is excluded and there is still an observable for use during editing.
        if (schedule.hiveArguments &&
            !schedule.hiveArguments.exportDir) {
          schedule.hiveArguments.exportDir = null;
        }

        var history = schedule.history;

        delete schedule.history;

        var mappedSchedule = komapping.fromJS(schedule),
          latestRun;

        mappedSchedule.history = history;

        if (!mappedSchedule.startTime) {
          mappedSchedule.startTime = ko.observable();
        }
        if (!mappedSchedule.endTime) {
          mappedSchedule.endTime = ko.observable();
        }

        latestRun = history.length && history[0];
        // if (schedule.hdfsArguments && latestRun && latestRun.active && latestRun.resultDataUrl) {
          // self.monitorCommand(schedule, latestRun);
        // }

        mappedSchedule.invalid = ko.observable(false);

        mappedSchedule.lastRun = ko.observable(latestRun);

        mappedSchedule.lastSuccess = ko.observable(_.find(history, function(command){
          return command.success;
        }));

        var scheduleArray = schedules[sourceServiceDisplay];
        if (scheduleArray) {
          scheduleArray.push(mappedSchedule);
        } else {
          scheduleArray = [mappedSchedule];
          schedules[sourceServiceDisplay] = scheduleArray;
        }
      });

      schedules = _.pairs(schedules);
      self.viewModel.replicationSchedules(schedules);
      if (!self.options.readOnly && self.viewModel.sourcesLoaded()) {
        self.pairSchedulesToSources();
      }

      self.viewModel.contentLoaded(true);

    }).repeat(15 * 1000);
    this.scheduleRepeater.start();
  };

  /**
   * This function will retrieve all HDFS services registered with a peer and populate the sources
   * property with the results.
   */
  Replication.prototype.loadSources = function() {
    var self = this,
      serviceContextDisplayName = self.formatReference(this.options.serviceRef);
    $.getJSON(window.location.pathname + '/sources?serviceType=' + self.options.serviceType, function(data) {
      var sources = [];
      _.each(data, function(service) {
        var displayName = self.formatReference(service);
        if (self.options.serviceType === "HIVE" && displayName === serviceContextDisplayName) {
          return;
        }
        sources.push({
          value: service,
          displayName: self.formatReference(service)
        });
      });
      self.viewModel.sources(sources);
      self.viewModel.sourcesLoaded(true);
      self.editViewModel.sources(sources);
      self.editViewModel.sourcesLoaded(true);
      if (self.viewModel.replicationSchedules().length) {
        self.pairSchedulesToSources();
      }
    });
  };

  /**
   * Formats a service reference for display, appending a path if necessary.
   *
   * @param ref The service reference to format.
   * @param path The path to append to the formatted service name.
   * @return {string} The formatted service reference.
   */
  Replication.prototype.formatReference = function(ref, path) {
    var result,
        cleanRef;
    if (ko.isObservable(ref) || ko.isObservable(ref.serviceName)) {
      cleanRef = komapping.toJS(ref);
    } else {
      cleanRef = ref;
    }

    result = cleanRef.serviceName
      + (path ? ':/' + path : '')
      + ' ('
      + cleanRef.clusterName
      + (cleanRef.peerName ? ' @ ' + cleanRef.peerName : '')
      + ')';

    return result;
  };

  return Replication;
});
