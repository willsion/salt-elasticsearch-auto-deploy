/* Copyright (c) 2012 Cloudera, Inc. All rights reserved. */

define([
    'knockout',
    'komapping',
    'underscore',
    'cloudera/common/MagicStrings',
    'cloudera/Util',
    'cloudera/common/TimeUtil'
    ], function(ko, komapping, _, magicStrings, Util, TimeUtil){
  return function($dialog, persistSchedule, options, loadSchedules) {
    var self = this;

    /**
     * This property contains all of the replication source services available.
     */
    self.sources = ko.observableArray();
    self.sourcesLoaded = ko.observable(false);

    self.databases = ko.observableArray();

    self.addDatabase = function() {
      if (self.schedule()) {
        self.schedule().hiveArguments.tableFilters.push({
          database: ko.observable(),
          tableName: ko.observable()
        });
      }
    };

    self.removeDatabase = function() {
      if (self.schedule()) {
        self.schedule().hiveArguments.tableFilters.remove(this);
      }
    };

    /**
     * This property provides the service reference for the current service.
     */
    self.destinationService = ko.observable(options.serviceRef);

    self.displaySource = options.displaySource;

    self.initialPopulation = ko.observable(true);

    self.originalSchedule = ko.observable();

    self.schedule = ko.computed({
      read: function() {
        return self.originalSchedule();
      },
      write: function(newSchedule) {
        var isHdfs = options.serviceType === 'HDFS',
            newValue,
            sourceService,
            defaults;
        if (ko.isObservable(newSchedule.interval)) {
          // Cloning and creating new observables for the schedule so that if the user cancels, the UI won't contain stale data.
          newValue = _.clone(newSchedule);
          defaults = self.generateDefaultSchedule();
          // Remove history before we convert to JS so that we don't have to process it.
          delete newValue.history;

          sourceService = isHdfs ? newValue.hdfsArguments.sourceService : newValue.hiveArguments.sourceService;

          newValue = komapping.toJS(newValue);

          // Ensuring that all values needed for binding are present in the model.
          _.defaults(newValue, defaults);
          if (isHdfs) {
            _.defaults(newValue.hdfsArguments, defaults.hdfsArguments);
          } else {
            _.defaults(newValue.hiveArguments, defaults.hiveArguments);
            _.defaults(newValue.hiveArguments.hdfsArguments, defaults.hiveArguments.hdfsArguments);
          }
        } else {
          newValue = newSchedule;
        }

        newValue = komapping.fromJS(newValue);

        // This is to ensure equality when initially selecting the source service.
        if (sourceService) {
          if (isHdfs) {
            newValue.hdfsArguments.sourceService = sourceService;
          } else {
            newValue.hiveArguments.sourceService = sourceService;
          }
        }

        if (newValue) {
          self.initialPopulation(true);
          if (newValue.interval && newValue.interval()) {
            self.type(magicStrings.scheduleTypes.recurring);
          } else if (newValue.startTime && newValue.startTime()) {
            self.type(magicStrings.scheduleTypes.once);
          } else {
            self.type(magicStrings.scheduleTypes.immediate);
          }
          self.initialPopulation(false);
        }
        self.originalSchedule(newValue);
      },
      owner: self
    });

    /**
     * If this property is set, the contained message will be displayed to the user.
     */
    self.alert = ko.observable(false);

    /**
     * This property identifies that the contents of this object literal is an existing schedule.
     */
    self.update = ko.observable(false);

    /**
     * This property identifies that the all arguments should be shown.
     */
    self.showMore = ko.observable(false);

    /**
     * This property contains all of the MapReduce services managed by the current CM instance.
     */
    self.mapreduceServices = ko.observableArray();
    self.mapreduceServices.subscribe(function(newValue) {
      var schedule = self.schedule(), hdfsArguments = schedule.hdfsArguments || (schedule.hiveArguments && schedule.hiveArguments.hdfsArguments);
      if (hdfsArguments) {
        hdfsArguments.mapreduceServiceName(newValue.length ? newValue[0].name : null);
      }
    });

    /**
     * This property contains the schedule type.
     */
    self.type = ko.observable();

    /**
     * Submits the form when the enter key is pressed.
     */
    self.keypressSubmit = function(data, event) {
      if (event.which && event.which === 13) {
        $dialog.find('#saveSchedule').click();
        return false;
      }
      return true;
    };

    /**
     * This function will save the currently active schedule.
     */
    self.saveSchedule = function(event) {
      var form = document.getElementById('addReplicationForm'),
          $currentTarget = $(event.currentTarget);
      if ($currentTarget.hasClass('disabled')) {
        return;
      }

      if (form.checkValidity && !form.checkValidity()) {
        // Enable the button so that the user can resubmit.
        $dialog.find('#saveSchedule').removeClass('disabled');
        return;
      }

      $currentTarget.addClass('disabled');

      persistSchedule(options, self.schedule(), self.update(), function() {
        loadSchedules();
        self.hide();
      }, function(jqXhr) {
        var message = jqXhr.responseText;
        if (message) {
          try {
            self.alert(JSON.parse(message).message);
          } catch (e) {
            self.alert(message);
          }
        }

        $currentTarget.removeClass('disabled');
      });
    };

    /**
     * This function will reset the active schedule to its initial state.
     */
    self.reset = function() {
      self.alert(false);
      self.update(false);
      self.initialPopulation(true);
      self.schedule(self.generateDefaultSchedule());
      self.initialPopulation(false);
      self.showMore(false);
      $dialog.find('#saveSchedule').removeClass('disabled');
      $dialog
        .removeClass('update')
        .removeData('update');
    };

    self.generateDefaultSchedule = function() {
      var defaultSchedule = {
            startTime: '',
            endTime: '',
            interval: 0,
            intervalUnit: null,
            paused: null,
            alertOnAbort: false,
            alertOnFail: false,
            alertOnStart: false,
            alertOnSuccess: false
          },
          hdfsArguments = {
            sourceService: null,
            sourcePath: null,
            destinationPath: null,
            mapreduceServiceName: self.mapreduceServices().length ?
                self.mapreduceServices()[0].name : null,
            schedulerPoolName: null,
            userName: null,
            logPath: null,
            numMaps: null,
            bandwidthPerMap: null,
            abortOnError: false,
            removeMissingFiles: false,
            preserveReplicationCount: true,
            preserveBlockSize: true,
            preservePermissions: true,
            skipChecksumChecks: false
          };

      if (options.serviceType === "HDFS") {
        defaultSchedule.hdfsArguments = hdfsArguments;
      } else {
        defaultSchedule.hiveArguments = {
          sourceService: null,
          exportDir: null,
          tableFilters: [],
          replicateData: true,
          force: false,
          hdfsArguments: hdfsArguments
        };
      }

      return defaultSchedule;
    };

    self.show = function() {
      $dialog.modal('show');
    };

    self.hide = function() {
      $dialog.modal('hide');
    };

    self.type.subscribe(function(newValue) {
      var now = Util.dateToIsoString(TimeUtil.getServerNow()),
        schedule = self.schedule();
      if (schedule && !self.initialPopulation()) {
        // This should fall through, but JSList won't allow it.
        // Changing the order in which these are set can cause fields to be set incorrectly.
        switch(newValue) {
        case magicStrings.scheduleTypes.recurring:
          schedule.endTime('');
          schedule.startTime(now);
          schedule.interval(1);
          schedule.intervalUnit('DAY');
          break;
        case magicStrings.scheduleTypes.once:
          schedule.endTime('');
          schedule.startTime(now);
          schedule.interval(0);
          schedule.intervalUnit('DAY');
          break;
        default:
          schedule.endTime('');
          schedule.startTime('');
          schedule.interval(0);
          schedule.intervalUnit('DAY');
          break;
        }

        schedule.paused(false);
      }
    });

    // The dialog chrome is outside of the KO bind to avoid collision with the bootstrap modal dialog,
    // so we need to manually bind the click event.
    $dialog
      .on('hidden', function() {
        self.reset();
      })
      .on('shown', function() {
        $('#sourcePath').focus();
      })
      .find('#saveSchedule')
      .click(self.saveSchedule);

    self.reset();
  };
});
