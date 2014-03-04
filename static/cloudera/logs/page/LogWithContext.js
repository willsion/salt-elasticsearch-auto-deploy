// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "knockout",
  "cloudera/Util",
  "cloudera/common/Humanize",
  "cloudera/common/I18n"
], function(ko, Util, Humanize, I18n) {
  
  var MAIN_TABLE_CONTAINER = '#mainTableContainer';
  
  // The number of pixels offset from the top or bottom that will trigger an infinite scroll.
  var SCROLL_THRESHOLD = 200;

  /*
  options = {
    'logEventUrl': ...,
    'downloadUrl': ...,
    'hostUrlPrefix': ...,
    ['maxEvents': ...,]
  */
  function LogWithContextViewModel(options) {
    var self = this;
    var maxEvents = options.maxEvents || 1000;

    self.firstAccess = true;
    self.tableCollapsed = ko.observable(false);
    self.events = ko.observableArray();
    self.firstEvent = ko.observable();
    self.lastEvent = ko.observable();
    
    self.firstOffset = ko.computed(function() {
      if (self.firstEvent()) {
        return self.firstEvent().offset;
      }
      return 0;
    });
    
    self.lastOffset = ko.computed(function() {
      if (self.lastEvent()) {
        return self.lastEvent().offset;
      }
      return 0;
    });
    
    self.formattedFirstDate = ko.computed(function() {
      if (self.firstEvent() && self.firstEvent().time > 0) {
        var firstDate = new Date(self.firstEvent().time);
        return Humanize.humanizeDateTimeMedium(firstDate);
      }
      return '';
    });
    
    self.formattedLastDate = ko.computed(function() {
      if (self.lastEvent() && self.lastEvent().time > 0) {
        var lastDate = new Date(self.lastEvent().time);
        return Humanize.humanizeDateTimeMedium(lastDate);
      }
      return '';
    });

    self.selectedEventIndex = ko.observable();
    
    self.$mainTableContainer = $(MAIN_TABLE_CONTAINER);
    self.$mainTable = $(MAIN_TABLE_CONTAINER + ' table');
    self.$firstRow = null;
    self.$lastRow = null;
    self.$spinner = $('.IconSpinner16x16');
    self.requestInFlight = false;

    self.params = ko.observable({
      path: "",
      roleId: "",
      host: "",
      port: "",
      offset: ""
    });
    
    self.onFirstEventChanged = function(newValue) {
      self.$firstRow = self.$mainTable.find('tbody tr:first-child');
    };
    
    self.onLastEventChanged = function(newValue) {
      self.$lastRow = self.$mainTable.find('tbody tr:last-child');
    };

    self.onSelectedEventIndexChanged = function(newValue) {
      var index = newValue;
      if (index === -1 && self.events().length > 0 && self.params().offset === undefined) {
        // Scroll to the bottom since this is a tail view of the log.
        index = self.events().length - 1;
      }
      self.scrollToIndex(index);
    };
    
    // Don't call this function synchronously from within an onscroll handler!
    // It makes relatively loooong server calls and will disrupt the user experience!
    self.onTableScroll = function() {
      var $table = self.$mainTableContainer.find('table');
      var scrollPastTop = self.$mainTableContainer.scrollTop() < SCROLL_THRESHOLD;
      var scrollPastBottom = ($table.height() - (self.$mainTableContainer.scrollTop() + self.$mainTableContainer.height())) < SCROLL_THRESHOLD;
      if (!scrollPastTop && !scrollPastBottom) {
        // Save on cycles by not unparam-ing the URL params if we haven't
        // exceeded our thresholds.
        return;
      }
      var urlParams = Util.unparam(window.location.search.substring(1));
      urlParams.num = 100;
      if (scrollPastTop) {
        urlParams.offset = self.firstOffset();
        urlParams.direction = 'previous';
        self.makeRequest(urlParams, self.prependEvents);
      } else if (scrollPastBottom) {
        urlParams.offset = self.lastOffset();
        urlParams.direction = 'next';
        self.makeRequest(urlParams, self.appendEvents);
      }
    };
    
    self.showError = function(message) {
      jQuery.publish('showError', [message]);
    };

    self.onLogResponse = function(callback) {
      return function(response) {
        var i, data = Util.filterError(response);
        if (!$.isArray(data.events) || !data.success) {
          var message = "<p>" + I18n.t("ui.serverCommunicationError") + "</p><pre>" + data.message + "</pre>";
          self.showError(message);
          return;
        }
        data.events = data.events.sort(function(a, b) {
          return Util.compare(a.offset, b.offset);
        });
        var len = data.events.length;
        for (i = 0; i < len; i += 1) {
          var event = data.events[i];
          if ($.isNumeric(event.time)) {
            var eventTime = new Date(event.time);
            event.formattedTime = Humanize.humanizeTimeShortAndMS(eventTime);
          }
          event.highlighted = false;
        }
        callback(data);
      };
    };

    self.onInitialResponse = function(data) {
      var events = data.events;
      var i = 0, selectedIndex = -1, len = events.length;
      var offset = parseInt(data.pivotOffset, 10);
      self.events.removeAll();
      var underlyingArray = self.events();
      // Add the events.
      for (i = 0; i < len; i++) {
        var event = events[i];
        if (self.firstAccess && parseInt(event.offset, 10) === offset) {
          selectedIndex = i;
          event.highlighted = true;
        }
        underlyingArray.push(event);
      }
      self.events.valueHasMutated();
      self.firstEvent(events[0]);
      self.lastEvent(events[events.length - 1]);
      self.selectedEventIndex(selectedIndex);
      self.firstAccess = false;
    };
    
    self.mergeEvents = function(events1, events2) {
      var counter1 = 0, counter2 = 0, result = [];
      if (events1.length === 0) {
        return events2;
      } else if (events2.length === 0) {
        return events1;
      }
      while (counter1 < events1.length || counter2 < events2.length) {
        var event1 = events1[counter1], event2 = events2[counter2];
        if (event1 && event2) {
          if (event1.offset <= event2.offset) {
            result.push(event1);
            counter1 += 1;
            // Handle the duplicate case.
            if (event1.offset === event2.offset) {
              counter2 += 1;
            }
          } else {
            result.push(event2);
            counter2 += 1;
          }
        } else if (event1) {
          result.push(event1);
          counter1 += 1;
        } else {
          result.push(event2);
          counter2 += 1;
        }
      }
      return result;
    };
    
    self.preservePosition = function() {
      var getPosition =function($row) {
        return self.$mainTableContainer.scrollTop() - $row.position().top;
      };
      // Depending on which direction we're scrolling, we need either the first or
      // the last row position.
      self.topPosition = getPosition(self.$firstRow);
      self.bottomPosition = getPosition(self.$lastRow);
      self.firstRowOffset = self.$firstRow.attr('data-offset');
      self.lastRowOffset = self.$lastRow.attr('data-offset');
    };
    
    self.restorePosition = function() {
      // When scrolling, the first or the last row may have been removed for performance
      // reasons; therefore we check both rather than have a bunch of "how are we scrolling" logic.
      // If we are scrolling to the top, we use the former first row to reposition.
      // If we are scrolling to the bottom, we use the former last row to reposition.
      var getRowByOffset = function(logOffset) {
        return self.$mainTable.find('tr[data-offset="' + logOffset + '"]');
      };
      var $oldFirstRow = getRowByOffset(self.firstRowOffset);
      // var $oldFirstRow = self.$mainTable.find('tr[data-offset="' + self.firstRowOffset + '"]');
      if ($oldFirstRow && $oldFirstRow.position()) {
        self.$mainTableContainer.scrollTop(self.topPosition + $oldFirstRow.position().top);
        return;
      }
      var $oldLastRow = getRowByOffset(self.lastRowOffset);
      if ($oldLastRow && $oldLastRow.position()) {
        self.$mainTableContainer.scrollTop(self.bottomPosition + $oldLastRow.position().top);
        return;
      }
    };
    
    // Called as a callback with information from the server, this method
    // prepends events to the list of events and maintains the user's
    // position in the scroll of events.
    self.prependEvents = function(data) {
      var events = data.events;
      var i, len = events.length;
      for (i = 0; i < len; i++) {
        var event = events[i];
        event.clazz = '';
      }
      var mergedEvents = self.mergeEvents(self.events(), events);
      // Make sure it doesn't exceed our maximum.
      if (mergedEvents.length > maxEvents) {
        mergedEvents = mergedEvents.slice(0, maxEvents);
      }
      // We need to remember where the user is in the scroll before adding a bunch
      // of new events so that we can reposition the window back here after the events
      // have been added.
      self.preservePosition();
      self.events(mergedEvents);
      self.firstEvent(mergedEvents[0]);
      self.lastEvent(mergedEvents[mergedEvents.length - 1]);
      self.restoreTableCollapsedState();
      // Scroll so the old firstRow's top position is the same.
      self.restorePosition();
    };
    
    // Called as a calback with information from the server, this method
    // appends events to the list of events and maintains the user's
    // position in the scroll of events.
    self.appendEvents = function(data) {
      var events = data.events;
      var i = 0, len = events.length;
      for (i = 0; i < len; i++) {
        var event = events[i];
        event.clazz = '';
      }
      var mergedEvents = self.mergeEvents(self.events(), events);
      // Make sure it doesn't exceed the maximum.
      if (mergedEvents.length > maxEvents) {
        mergedEvents = mergedEvents.slice(mergedEvents.length - maxEvents);
      }
      self.preservePosition();
      self.events(mergedEvents);
      self.firstEvent(mergedEvents[0]);
      self.lastEvent(mergedEvents[mergedEvents.length - 1]);
      self.restoreTableCollapsedState();
      self.restorePosition();
    };

    // Known callbacks used with this method:
    // * prependEvents
    // * appendEvents
    // * onInitialResponse
    //
    // The server sends back JSON data with this structure:
    // * events: an array of logs with this structure
    // ** loglevel
    // ** message
    // ** offset
    // ** path
    // ** roleId
    // ** source
    // ** time
    // * pivotOffset
    // * port
    // * success
    self.makeRequest = function(params, callback) {
      if (self.requestInFlight) {
        return;
      }
      self.params(params);
      self.requestInFlight = true;
      var jqxhr = $.post(options.logEventUrl, params, self.onLogResponse(callback), 'json');
      self.$spinner.removeClass('hidden');
      jqxhr.complete(function() {
        self.requestInFlight = false;
        self.$spinner.addClass('hidden');
      });
      // TODO: What happens if there's an error communicating with server here?
    };

    self.downloadUrl = ko.computed(function() {
      var params = self.params();
      if (params) {
        var qs = jQuery.param({
          path: params.path,
          roleId: params.roleId,
          host: params.host
        });

        return options.downloadUrl + "?" + qs;
      } else {
        return "#";
      }
    });

    self.hostUrl = ko.computed(function() {
      var params = self.params();
      if (params) {
        var urlParams = $.param({
          hostname: params.host
        });
        return options.hostUrlPrefix + "?" + urlParams;
      } else {
        return "#";
      }
    });

    self.scrollToIndex = function(index) {
      var $node = $(MAIN_TABLE_CONTAINER + ' tr:nth-child(' + (index + 1) + ')');
      if ($node.length === 0) {
        // No scrolling if we can't find the main container. This really only
        // happens in tests.
        return;
      }
      var top = $node.offset().top - $(MAIN_TABLE_CONTAINER).offset().top;
      $(MAIN_TABLE_CONTAINER).animate({
        scrollTop: top
      }, 1000);
    };

    self.restoreTableCollapsedState = function() {
      if (self.tableCollapsed()) {
        self.collapseColumns();
      } else {
        self.expandColumns();
      }
    };

    self.collapseColumns = function() {
      $('.nonMessageColumn').addClass('hidden');
      self.tableCollapsed(true);
      // Related to OPSAPS-7315. Nudge IE8 to get it to re-layout the table.
      if ($('html').hasClass('ie8')) {
        // Use IE's "native" objects.
        self.$mainTable[0].style.display = 'inline-table';
        setTimeout(function() {
          self.$mainTable[0].style.display = '';
        }, 0);
      }
    };
    
    self.expandColumns = function() {
      $('.nonMessageColumn').removeClass('hidden');
      self.tableCollapsed(false);
    };

    self.selectedEventIndex.subscribe(self.onSelectedEventIndexChanged);
    // Subscribe to self.firstEvent and self.lastEvent changing instead of self.events
    // because it seems that the self.events subscription here is happening before KO's own
    // subscription in the UI; thus, self.$firstRow and self.$lastRow were getting set to
    // null and blowing up in onTableScroll.
    self.firstEvent.subscribe(self.onFirstEventChanged);
    self.lastEvent.subscribe(self.onLastEventChanged);

    // Grab the URL params and start retrieving the logs. The params we are looking for here
    // should match the params passed in by CmfPath::makeLogTailUrl. That includes
    // the following:
    // * path
    // * roleId
    // * host
    // * port
    // When grabbing the URL params, get rid of the leading '?'.
    var urlParams = Util.unparam(window.location.search.substring(1));
    urlParams.num = 250;
    self.makeRequest(urlParams, self.onInitialResponse);
    
    // Start listening to the scroll event to provide for infinite scrolling.
    $(MAIN_TABLE_CONTAINER).scroll(Util.throttle(self.onTableScroll, 1000));

    self.applyBindings = function() {
      ko.applyBindings(self, $(options.container)[0]);
    };
  }

  return LogWithContextViewModel;
});
