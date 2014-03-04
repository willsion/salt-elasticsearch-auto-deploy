/* Copyright (c) 2012 Cloudera, Inc. All rights reserved. */

define([
  'knockout',
  'underscore',
  'cloudera/common/Humanize',
  'cloudera/common/I18n',
  'cloudera/common/TimeUtil',
  'cloudera/Util'], function(ko, _, Humanize, I18n, TimeUtil, Util) {
  var commandState = { details: 0, listing: 1, notCopied: 2, failed: 3, tables: 4 };

  /**
   * This will add properties to the command needed for displaying the listing and status log data.
   * It needs to be removed before persisting or it will fail to deserialize on the server.
   */
  function prepareCommandForDisplay(scheduleId, command, context) {
    var listingLimit = context.options.listingLimit;
    command.loadingListing = ko.observable(false);
    command.listing = ko.observableArray();
    command.loadingNotCopied = ko.observable(false);
    command.notCopied = ko.observableArray();
    command.loadingErrors = ko.observable(false);
    command.errors = ko.observableArray();
    command.loadingTables = ko.observable(false);
    command.tables = ko.observableArray();

    /**
     * This handler function responds to the ko.infinitescroll event fired when the end of the error containers
     * scrollable bound is reached.
     */
    command.infiniteScrollErrors = function(scrollState) {
      if (!command.hiveResult || !command.hiveResult.errorCount) {
        scrollState.complete = true;
        return;
      }

      command.loadingErrors(true);
      // Format a URL that includes the current offset and limit.
      $.getJSON(context.options.replicationErrorsUri
        .replace('{scheduleId}', scheduleId)
        .replace('{commandId}', command.id)
        .replace('{offset}', scrollState.offset)
        .replace('{limit}', listingLimit), function(data) {
        // Update the errors observable with the value returned from the server.
        command.errors(data);
        command.loadingErrors(false);
        // Update the offset with the additional results returned from the server.
        scrollState.offset = scrollState.offset + data.length;
        // If the server returns less results than we requested, the use has reached the end of the results.
        if (data.length < listingLimit) {
          scrollState.complete = true;
        }
      });
    };

    /**
     * This handler function responds to the ko.infinitescroll event fired when the end of the tables containers
     * scrollable bound is reached.
     */
    command.infiniteScrollTables = function(scrollState) {
      if (!command.hiveResult || !command.hiveResult.tableCount) {
        scrollState.complete = true;
        return;
      }

      command.loadingTables(true);
      // Format a URL that includes the current offset and limit.
      $.getJSON(context.options.replicationTablesUri
        .replace('{scheduleId}', scheduleId)
        .replace('{commandId}', command.id)
        .replace('{offset}', scrollState.offset)
        .replace('{limit}', listingLimit), function(data) {
        // Update the tables observable with the value returned from the server.
        command.tables(data);
        command.loadingTables(false);
        // Update the offset with the additional results returned from the server.
        scrollState.offset = scrollState.offset + data.length;
        // If the server returns less results than we requested, the use has reached the end of the results.
        if (data.length < listingLimit) {
          scrollState.complete = true;
        }
      });
    };

    /**
     * This handler function responds to the ko.infinitescroll event fired when the end of the listing containers
     * scrollable bound is reached.
     */
    command.infiniteScrollListing = function(scrollState) {
      var hdfsResult = command.hdfsResult || 
              (command.hiveResult && command.hiveResult.dataReplicationResult);
      // If the command doesn't have and hdfsResult property, the listing log won't have been written.
      if (!hdfsResult) {
        scrollState.complete = true;
        return;
      }
      command.loadingListing(true);
      // Format a URL that includes the current offset and limit.
      $.getJSON(context.options.replicationListingUri
          .replace('{commandId}', command.id)
          .replace('{offset}', scrollState.offset)
          .replace('{limit}', listingLimit), function(data) {
        // Update the listing observable with the value returned from the server.
        command.listing(data);
        command.loadingListing(false);
        // Update the offset with the additional results returned from the server.
        scrollState.offset = scrollState.offset + data.length;
        // If the server returns less results than we requested, the use has reached the end of the results.
        if (data.length < listingLimit) {
          scrollState.complete = true;
        }
      });
    };

    /**
     * This handler function responds to the ko.infinitescroll event fired when the end of the notCopied containers
     * scrollable bound is reached.
     */
    command.infiniteScrollNotCopied = function(scrollState) {
      var hdfsResult = command.hdfsResult || (command.hiveResult && command.hiveResult.dataReplicationResult);
      // If the command doesn't have an hdfsResult property or all files were successfully
      // copied, the status log won't have been written.
      if (!hdfsResult ||
          (hdfsResult.numFilesCopyFailed === 0 && hdfsResult.numFilesSkipped === 0)) {
        scrollState.complete = true;
        return;
      }
      command.loadingNotCopied(true);
      //Format a URL that includes the current offset and limit.
      $.getJSON(context.options.replicationStatusUri
          .replace('{commandId}', command.id)
          .replace('{offset}', scrollState.offset)
          .replace('{limit}', listingLimit), function(data) {
        // Update the notCopied observable with the value returned from the server.
        command.notCopied(data);
        command.loadingNotCopied(false);
        // Update the offset with the additional results returned from the server.
        scrollState.offset = scrollState.offset + data.length;
        // If the server returns less results than we requested, the use has reached the end of the results.
        if (data.length < listingLimit) {
          scrollState.complete = true;
        }
      });
    };
  }

  return function(context) {
    var self = this;
    /**
     * If the user lacks permissions required to modify the replication jobs, this can be used to hide
     * elements in the UI.
     */
    self.readOnly = context.options.readOnly;
    
    self.contentLoaded = ko.observable(false);

    /**
     * Identifies whether or not the sources have been loaded.
     */
    self.sourcesLoaded = ko.observable(false);

    /**
     * This observable contains all of the DistCP source services available.
     */
    self.sources = ko.observableArray();
    
    /**
     * This observable is set to the schedule that should be expanded in the UI/
     */
    self.expandedSchedule = ko.observable();

    /**
     * This observable provides a list of all replication schedules.
     */
    self.replicationSchedules = ko.observableArray();

    self.commandToScheduleMap = {};

    self.replicationSchedules.subscribe(function(sources) {
      self.commandToScheduleMap = {};
      _.each(sources, function(source) {
        _.each(source[1], function(schedule) {
          _.each(schedule.history, function(command) {
            self.commandToScheduleMap[command.id] = schedule.id();
          });
        });
      });
    });
    
    /**
     * This observable is set to the command that should be expanded in the UI.
     */
    self.focusedCommand = ko.observable();
    
    /**
     * This observable contains a valued from {commandState} that identifies the which state the UI should present.
     */
    self.focusedCommandState = ko.observable();
    
    self.commandState = commandState;
    
    self.pathTemplate = context.options.pathTemplate;

    self.scheduleToDelete = ko.observable();

    self.prepareCommandForDisplay =  prepareCommandForDisplay;

    /**
     * A helper function retrieve the HdfsResults for a given command.
     * @param command A command for which to retrieve the HdfsResults.
     * @return object
     */
    self.retrieveHdfsResults = function(command) {
      return command.hdfsResult || (command.hiveResult && command.hiveResult.dataReplicationResult);
    };

    function hasCmdCompleted(command) {
      // Not using command.active here since we overwrite this on the client side when replication
      // progress reaches 100%. Instead checking the endTime to determine that the command has
      // really completed.
      return !!command.endTime;
    }

    /**
     * A helper function to identify whether or not a listing log is available for a given command.
     * @param command A command for which to evaluate availability of a listing.
     * @return Truthy / Falsy
     */
    self.commandListingAvailable = function(command) {
      var hdfsResult;
      if (hasCmdCompleted(command)) {
        hdfsResult = self.retrieveHdfsResults(command);
        return hdfsResult && _.isEmpty(hdfsResult.setupError);
      }
      return false;
    };

    /**
     * A helper function to identify whether or not a given command has associated errors.
     * @param command A command for which to evaluate availability of a listing.
     * @return Truthy / Falsy
     */
    self.commandErrorsAvailable = function(command) {
      var hdfsResult = self.retrieveHdfsResults(command);
      return (hdfsResult && hdfsResult.setupError) || (command.hiveResult && command.hiveResult.errorCount);
    };

    /**
     * A helper function to identify whether or not a given command has associated tables.
     * @param command A command for which to evaluate availability of a listing.
     * @return Truthy / Falsy
     */
    self.commandTablesAvailable = function(command) {
      return command.hiveResult && command.hiveResult.tableCount;
    };

    /**
     * A helper function to identify whether or not a status log is available for a given command.
     * @param command A command for which to evaluate availability of a listing.
     * @return Truthy / Falsy
     */
    self.commandStatusAvailable = function(command) {
      var hdfsResult;
      if (hasCmdCompleted(command)) {
        hdfsResult = self.retrieveHdfsResults(command);
        if (hdfsResult) {
          return hdfsResult.numFilesCopyFailed ||
              hdfsResult.numFilesSkipped;
        }
      }
      return false;
    };

    self.setupErrorToLines = function(setupError) {
      if (setupError) {
        return setupError.split('\n');
      }
    };

    self.wasDryRun = function(command) {
      var hdfsResults = self.retrieveHdfsResults(command);
      return hdfsResults && hdfsResults.dryRun;
    };

    self.commandFailed = function(command) {
      return command && !command.active && !command.success;
    };

    /**
     * Retrieves the number of files not copied to the destination.
     *
     * @param command The command for which to retrieve the number.
     * @returns {Number} The number of files or undefined.
     */
    self.commandFilesNotCopied = function(command) {
      var hdfsResult = self.retrieveHdfsResults(command);
      return hdfsResult && (hdfsResult.numFilesCopyFailed + hdfsResult.numFilesSkipped);
    };

    /**
     * Formatter for the display status of a command.
     * @param command The command for which the status should be formatted.
     * @returns {*} The formatted status.
     */
    self.formatDisplayStatus = function(command) {
      var args = command.hdfsResult || command.hiveResult,
        dryRun = args && args.dryRun,
        result;

      if (command.active) {
        if (command.hdfsResult) {
          result = self.formatHdfsDisplayStatus(command, command.hdfsResult, dryRun);
        } else if (command.hiveResult) {
          result = self.formatHiveDisplayStatus(command, command.hiveResult, dryRun);
        } else {
          result = I18n.t('ui.initializing');
        }
      } else {
        result = command.resultMessage || I18n.t('ui.complete');
      }

      if (dryRun) {
        result += I18n.t('ui.replication.dryRunSuffix');
      }
      
      return result;
    };

    /**
     * Exposed for testing.
     *
     * Formats the HDFS specific status
     * @param command The HDFS command for which the status should be formatted.
     * @param args The hdfsResult object to format.
     * @param dryRun A boolean value indicating whether or not command was a dry run.
     * @returns {string} The formatted status.
     */
    self.formatHdfsDisplayStatus = function(command, args, dryRun) {
      var result = '';

      if (!args || args.progress === undefined) {
        result = I18n.t('ui.initializing');
      } else if (dryRun) {
        result = args.progress + '%';
      } else {
        var processed = args.numFilesCopied + args.numFilesSkipped + args.numFilesCopyFailed;
        result = I18n.t('ui.replication.ofProcessed',
          processed,
          args.numFilesExpected);
      }

      return result;
    };

    /**
     * Exposed for testing.
     *
     * Formats the Hive specific status
     * @param command The Hive command for which the status should be formatted.
     * @param args The hiveResult object to format.
     * @param dryRun A boolean value indicating whether or not command was a dry run.
     * @returns {string} The formatted status.
     */
    self.formatHiveDisplayStatus = function(command, args, dryRun) {
      var result = '';

      if (!args || !args.phase) {
        result = I18n.t('ui.initializing');
      } else {
        switch (args.phase) {
        case 'EXPORT':
          result = I18n.t('ui.replication.exporting');
          break;
        case 'DATA':
          result = self.formatHdfsDisplayStatus(command, args.dataReplicationResult, dryRun);
          break;
        case 'IMPORT':
          result = I18n.t('ui.replication.importing');
          break;
        }
      }

      return result;
    };

    /**
     * Formats a display string for the status of a schedule based on the peer's status and the last ran command.
     *
     * @param schedule The schedule to format the message for.
     * @return {string} The formatted string to display for the schedule.
     */
    self.formatScheduleStatus = function(schedule) {
      var lastRun = schedule.lastRun(),
          result;
      if (schedule.invalid()) {
        var args = (schedule.hdfsArguments || schedule.hiveArguments);
        result = I18n.t(args.sourceService.peerName ? "ui.invalidPeerSourceService" : "ui.invalidSourceService",
            context.formatReference(args.sourceService));
      // This is a hack: When the schedule is create we immediately request the list of schedules, in some edge cases
      // a schedule that should run for the first time immediately hasn't started. This results in a 15 sec delay before
      // we report initializing.
      } else if ((!lastRun || !lastRun.active) &&
              schedule.nextRun() &&
              (moment(schedule.nextRun()) - TimeUtil.getServerNow()) < 5000) {
        result = I18n.t("ui.initializing");
      } else if (lastRun) {
        if (lastRun.active) {
          result = self.formatDisplayStatus(lastRun);
        } else {
          result = self.formatCommandResult(lastRun);
        }
      }
      return result || '';
    };
    
    /**
     * This function will identify the right status message for a given command.
     * command: A command that the display string should be formatted for.
     */
    self.formatCommandResult = function(command) {
      var result;
      if(command.active || !command.resultMessage) {
        result = '';
      } else if (command.success) {
        if (command.hdfsResult) {
          result = self.formatHdfsCommandResult(command);
        } else if (command.hiveResult) {
          result = self.formatHiveCommandResult(command);
        }
      } else {
        result = command.resultMessage;
      }
      return result;
    };

    self.formatHdfsCommandResult = function(command) {
      var result = '';

      var hdfsResult = command.hdfsResult,
        numFilesSkipped = hdfsResult && hdfsResult.numFilesSkipped,
        numFilesCopied = hdfsResult && hdfsResult.numFilesCopied,
        numFilesDryRun = hdfsResult && hdfsResult.numFilesDryRun;
      if (hdfsResult && hdfsResult.dryRun) {
        result = I18n.t('ui.replication.availableFor', numFilesDryRun);
      } else if (numFilesCopied !== undefined && numFilesSkipped !== undefined) {
        result = I18n.t('ui.replication.filesCopied', numFilesCopied, numFilesSkipped);
      } else {
        result = command.resultMessage || I18n.t('label.resultUnavailable');
      }

      return result;
    };

    self.formatHiveCommandResult = function(command) {
      var result = '',
        hiveResult = command.hiveResult;

      if (hiveResult) {
        if (hiveResult.dryRun) {
          result = I18n.t('ui.replication.tablesAvailableFor', hiveResult.tableCount);
        } else {
          result = I18n.t('ui.replication.tablesCopied', hiveResult.tableCount);
        }
      } else {
        result = command.resultMessage || I18n.t('label.resultUnavailable');
      }

      return result;
    };

    self.showCommand = function(command) {
      Util.setWindowLocation(context.options.commandDetailsUri.replace('{commandId}', command.id));
    };

    self.selectSource = function() {
      var schedule = context
        .editViewModel
        .schedule();

      (schedule.hdfsArguments || schedule.hiveArguments).sourceService(this.value);
    };

    /**
     * This function will toggle the paused state of a schedule.
     */
    self.toggleSchedule = function() {
      this.paused(!this.paused());
      context.persistSchedule(context.options, this, true, function() {
        context.loadSchedules();
      });
    };

    /**
     * This function will delete a schedule.
     */
    self.deleteSchedule = function() {
      $.ajax(context.options.replicationUri + encodeURIComponent(self.scheduleToDelete().id()), {
        type : 'DELETE',
        dataType : 'json',
        success : function() {
          context.loadSchedules();
        }
      });
      $('#deleteWarningModal').modal('hide');
    };

    self.initDeleteSchedule = function() {
      self.scheduleToDelete(this);
      $('#deleteWarningModal').modal('show');
    };

    self.editSchedule = function() {
      context.editViewModel.update(true);
      context.editViewModel.schedule(this);
      context.editViewModel.show();
    };

    /**
     * This function will initiate an immediate replication and record the 
     * command to the schedules history.
     */
    self.runReplication = function() {
      context.triggerReplication(this.id());
    };

    /**
     * This function will initiate an immediate replication in "Dry Run" mode 
     * and record the command to the schedules history.
     */
    self.dryRunReplication = function() {
      context.triggerReplication(this.id(), true);
    };

    /**
     * This will display the history of the associated replication schedule, or 
     * if the first command is active, it will show that command.
     */
    self.displayCommandOrHistory = function() {
      var lastCommand = this.history && this.history.length && this.history[0];
      if (lastCommand.active) {
        self.displayCommand.call(lastCommand);
      } else {
        self.toggleHistory.call(this);
      }
    };
    
    self.toggleHistory = function() {
      if (this.id() !== self.expandedSchedule()) {
        self.expandedSchedule(this.id());
        self.focusedCommand(undefined);
      } else {
        self.expandedSchedule(undefined);
        self.focusedCommand(undefined);
      }
    };

    /**
     * This will display the active command for the associated replication schedule.
     */
    self.displayCommand = function() {
      Util.setWindowLocation(context.options.commandDetailsUri.replace('{commandId}', this.id));
    };
    
    self.blurCommand = function() {
      self.focusedCommand(undefined);
    };
    
    /**
     * Focuses or blurs a command/state based on the command and state passed.
     * command: The command to focus or blur.
     * state: The {commandState} to focus or blur. 
     */
    self.toggleCommandState = function(command, state) {
      if (command.id !== (self.focusedCommand() && self.focusedCommand().id)) {
        if (!command.loadingListing) {
          prepareCommandForDisplay(self.commandToScheduleMap[command.id], command, context);
        }
        self.focusedCommand(command);
        self.focusedCommandState(state);
      } else if (self.focusedCommandState() !== state) {
        self.focusedCommandState(state);
      } else {
        self.focusedCommand(undefined);
      }
    };
    
    self.toggleCommandDetails = function() {
      self.toggleCommandState(this, commandState.details);
    };
    
    self.toggleCommandListing = function() {
      self.toggleCommandState(this, commandState.listing);
    };

    self.toggleCommandNotCopied = function() {
      self.toggleCommandState(this, commandState.notCopied);
    };

    self.toggleCommandTables = function() {
      self.toggleCommandState(this, commandState.tables);
    };
    
    self.toggleCommandError = function() {
      self.toggleCommandState(this, commandState.failed);
    };
  };
});
