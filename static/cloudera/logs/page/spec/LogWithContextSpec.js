// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/logs/page/LogWithContext',
  'cloudera/Util',
  'cloudera/common/Humanize',
  'cloudera/common/TimeUtil',
  'cloudera/common/I18n'
], function(LogWithContext, Util, Humanize, TimeUtil, I18n) {
  
  describe('LogWithContext tests', function() {

    var lwc;
    var expectedSelectedEventIndex = 3;
    
    var makeTestEvent = function(offset, time) {
      return {
        'logLevel': 'WARN',
        'message': 'Test message',
        'offset': offset,
        'path': '/test/path.log',
        'roleId': null,
        'source': 'com.cloudera.cmf.event.publish.EventStorePublisherWIthRetry',
        'time': time
      };
    };
    
    var makeValidLogResponse = function() {
      // These offset and time values are arbitrary but slightly realistic.
      var i, events = [];
      var pivotOffset;
      for (i=0; i < 100; i++) {
        var testOffset = 9000000 - (i * 100000);
        var testTime = 1334950000000 + (i * 1000000);
        events.push(makeTestEvent(testOffset, testTime));
        if (i === expectedSelectedEventIndex) {
          pivotOffset = testOffset;
        }
      }
      return {
        'host': 'testhost',
        'pivotOffset': pivotOffset,
        'port': 9000,
        'success': true,
        'events': events
      };
    };
    
    beforeEach(function() {
      jasmine.Ajax.useMock();
      lwc = new LogWithContext({
        'logEventUrl': 'http://localhost/logEventUrl',
        'downloadUrl': 'http://localhost/downloadUrl',
        'hostUrlPrefix': 'http://localhost/hostUrlPrefix'
      });
      spyOn(TimeUtil, "getTimezoneDelta").andReturn(0);
    });
    
    it('allows non-message columns to be collapsed and expanded', function() {
      $('<div class="nonMessageColumn"></div>').appendTo('body');
      expect(lwc.tableCollapsed()).toEqual(false);
      lwc.collapseColumns();
      expect($('.nonMessageColumn').hasClass('hidden')).toEqual(true);
      expect(lwc.tableCollapsed()).toEqual(true);
      lwc.expandColumns();
      expect($('.nonMessageColumn').hasClass('hidden')).toEqual(false);
      expect(lwc.tableCollapsed()).toEqual(false);
    });
    
    it('has a hack for IE8 in there', function() {
      $('html').addClass('ie8');
      var ieSpy = {
        style: {
          display: ''
        }
      };
      lwc.$mainTable = [ieSpy];
      spyOn(window, 'setTimeout');
      lwc.collapseColumns();
      expect(ieSpy.style.display).toEqual('inline-table');
      expect(window.setTimeout).wasCalled();
    });

    it('knows how to publish error events', function() {
      spyOn(jQuery, 'publish');
      lwc.showError('An error');
      expect(jQuery.publish).wasCalledWith('showError', ['An error']);
    });
    
    it('publishes errors when receiving errors from the server', function() {
      spyOn(lwc, 'showError');
      spyOn(I18n, 't');
      var bogusData = {
        success: false,
        message: 'Another error!'
      };
      var response = lwc.onLogResponse(function() {});
      response(bogusData);
      expect(lwc.showError).wasCalled();
      expect(I18n.t).wasCalled();
    });

    it('should have a blank initial selectedEventIndex', function() {
      expect(lwc.selectedEventIndex()).toEqual(undefined);
    });

    it('should scroll when the selected event changes', function() {
      spyOn(lwc, 'scrollToIndex');
      lwc.onSelectedEventIndexChanged(0);
      expect(lwc.scrollToIndex).wasCalledWith(0);
    });
    
    it('should scroll to the bottom when first coming to the page', function() {
      var mockEvents = [1,2,3];
      spyOn(lwc, 'events').andReturn(mockEvents);
      spyOn(lwc, 'params').andReturn({});
      spyOn(lwc, 'scrollToIndex');
      lwc.onSelectedEventIndexChanged(-1);
      expect(lwc.scrollToIndex).wasCalledWith(mockEvents.length - 1);
    });
    
    it('should calculate first offset from the first event', function() {
      lwc.firstEvent({'offset': 354});
      expect(lwc.firstOffset()).toEqual(354);
    });

    it('should not have problems generating first offset if there is no first event', function() {
      lwc.firstEvent(null);
      expect(lwc.firstOffset()).toEqual(0);
    });

    it('should not have problems generating last offset if there is no last event', function() {
      lwc.lastEvent(null);
      expect(lwc.lastOffset()).toEqual(0);
    });
    
    it('should calculate last offset from the last event', function() {
      lwc.lastEvent({'offset': 123});
      expect(lwc.lastOffset()).toEqual(123);
    });
    
    it('should calculate first formatted date from first event', function() {
      lwc.firstEvent({'time': 1334251763077});
      expect(lwc.formattedFirstDate()).toEqual('April 12 2012 10:29 AM');
    });
    
    it('should calculate last formatted date from last event', function() {
      lwc.lastEvent({'time': 1334957116000});
      expect(lwc.formattedLastDate()).toEqual('April 20 2012 2:25 PM');
    });

    it('should not return a formatted date for zero first event time', function() {
      lwc.firstEvent({'time': 0});
      expect(lwc.formattedFirstDate()).toEqual('');
    });

    it('should not return a formatted date for zero last event time', function() {
      lwc.lastEvent({'time': 0});
      expect(lwc.formattedLastDate()).toEqual('');
    });

    it('should not have problems calculating first formatted date if first event is null', function() {
      lwc.firstEvent(null);
      expect(lwc.formattedFirstDate()).toEqual('');
    });

    it('should not have problems calculating last formatted date if last event is null', function() {
      lwc.lastEvent(null);
      expect(lwc.formattedLastDate()).toEqual('');
    });
    
    it('should display an error if the data is not valid', function() {
      spyOn(jQuery, 'publish');
      // The following string is meant to simulate a stacktrace coming back
      // from the server. It should make the LogWithContext JS attempt to
      // show an error using jQuery.
      lwc.onLogResponse(function() {})('<div>ExceptionReport</div>');
      expect(jQuery.publish).wasCalled();
    });
    
    it('should process events independent of what happens to them next', function() {
      var validLogResponse = makeValidLogResponse();
      this.verifyEvents = function(data) {
        var events = data.events;
        expect(events.length).toEqual(validLogResponse.events.length);
        // Pick an event an verify that the stock properties are in place.
        expect(events[0].hasOwnProperty('highlighted')).toBeTruthy();
        expect(events[0].highlighted).toBeFalsy();
        expect(data.pivotOffset).toEqual(validLogResponse.pivotOffset);
      };
      spyOn(this, 'verifyEvents').andCallThrough();
      lwc.onLogResponse(this.verifyEvents)(validLogResponse);
      expect(this.verifyEvents).wasCalled();
    });
    
    it('should display every event and set the other dependent properties efficiently', function() {
      var validEvents = Util.filterError(makeValidLogResponse());
      spyOn(lwc.events, 'push').andCallThrough();
      spyOn(lwc, 'params').andReturn({'offset': validEvents.events[3].offset});
      lwc.onInitialResponse(validEvents);
      // We didn't call push on the observable. We called it on the underlying array.
      expect(lwc.events.push.callCount).toEqual(0);
      // Our first offset test value should be in there.
      expect(lwc.events()[0].offset).toEqual(9000000);
      expect(lwc.events().length).toEqual(validEvents.events.length);
      expect(lwc.firstEvent().offset).toEqual(validEvents.events[0].offset);
      expect(lwc.lastEvent().offset).toEqual(validEvents.events[validEvents.events.length - 1].offset);
      expect(lwc.selectedEventIndex()).toEqual(expectedSelectedEventIndex);
      expect(lwc.events()[3].highlighted).toBeTruthy();
      expect(lwc.firstAccess).toEqual(false);
    });

    it('tracks the first row as a jQuery object', function() {
      spyOn(lwc.$mainTable, 'find').andReturn('row');
      lwc.firstEvent('thing');
      expect(lwc.$mainTable.find.callCount).toEqual(1);
      expect(lwc.$mainTable.find.argsForCall[0]).toEqual(['tbody tr:first-child']);
    });
    
    it('tracks the last row as a jQuery object', function() {
      spyOn(lwc.$mainTable, 'find').andReturn('row');
      lwc.lastEvent('thing2');
      expect(lwc.$mainTable.find.callCount).toEqual(1);
      expect(lwc.$mainTable.find.argsForCall[0]).toEqual(['tbody tr:last-child']);
    });
    
    it('prepends events correctly and sets dependent properties', function() {
      // Dummy events.
      var i, testEvents = [];
      for (i = 0; i < 3; i++) {
        testEvents.push(makeTestEvent(i + 2, i + 52));
      }
      lwc.events(testEvents);
      spyOn(lwc, 'firstEvent');
      // Make a test $firstRow. The value here doesn't matter
      // and is not checked in this test.
      lwc.$firstRow = $('tr');
      spyOn(lwc.$firstRow, 'position').andReturn({
        'top': 0
      });
      var firstEvent = makeTestEvent(0, 50);
      var secondEvent = makeTestEvent(1, 51);
      spyOn(lwc, 'preservePosition');
      spyOn(lwc, 'restorePosition');
      // Looks a little like the data we get back from the server.
      var data = {
        events: [firstEvent, secondEvent]
      };
      lwc.prependEvents(data);
      expect(firstEvent.clazz).toEqual('');
      expect(secondEvent.clazz).toEqual('');
      expect(lwc.firstEvent).wasCalledWith(firstEvent);
      expect(lwc.preservePosition).wasCalled();
      expect(lwc.restorePosition).wasCalled();
      var events = lwc.events();
      expect(events.length).toEqual(5);
      expect(events[0]).toEqual(firstEvent);
      expect(events[1]).toEqual(secondEvent);
      expect(events[2]).toEqual(testEvents[0]);
    });
    
    it('prepends events correctly when there are duplicates', function() {
      var events1 = [], events2 = [], i;
      for (i = 0; i < 3; i++) {
        events1.push(makeTestEvent(i, 50 + i));
        events2.push(makeTestEvent(i + 1, 51 + i));
      }
      lwc.events(events2);
      // Make a test $firstRow. The value here doesn't matter
      // and is not checked in this test.
      lwc.$firstRow = $('tr');
      spyOn(lwc.$firstRow, 'position').andReturn({
        'top': 0
      });
      spyOn(lwc, 'preservePosition');
      spyOn(lwc, 'restorePosition');
      var data = {
        events: events1
      };
      lwc.prependEvents(data);
      expect(lwc.preservePosition).wasCalled();
      expect(lwc.restorePosition).wasCalled();
      var events = lwc.events();
      expect(events.length).toEqual(4);
      for (i = 0; i < 4; i++) {
        expect(events[i].offset).toEqual(i);
      }
    });
    
    it('appends events correctly and sets dependent properties', function() {
      // Dummy events.
      var i, testEvents = [];
      for (i = 0; i < 3; i++) {
        testEvents.push(makeTestEvent(i, i + 50));
      }
      lwc.events(testEvents);
      spyOn(lwc, 'lastEvent');
      var firstEvent = makeTestEvent(3, 53);
      var secondEvent = makeTestEvent(4, 54);
      spyOn(lwc, 'preservePosition');
      spyOn(lwc, 'restorePosition');
      // Looks like the data we get back from the server.
      var data = {
        events: [firstEvent, secondEvent]
      };
      lwc.appendEvents(data);
      expect(firstEvent.clazz).toEqual('');
      expect(secondEvent.clazz).toEqual('');
      expect(lwc.preservePosition).wasCalled();
      expect(lwc.restorePosition).wasCalled();
      expect(lwc.lastEvent).wasCalledWith(secondEvent);
      var events = lwc.events();
      expect(events.length).toEqual(5);
      expect(events[2].offset).toEqual(testEvents[2].offset);
      expect(events[3]).toEqual(firstEvent);
      expect(events[4]).toEqual(secondEvent);
    });
    
    it('appends events correctly when there are duplicates', function() {
      var events1 = [], events2 = [], i;
      for (i = 0; i < 3; i++) {
        events1.push(makeTestEvent(i, 50 + i));
        events2.push(makeTestEvent(i + 1, 51 + i));
      }
      lwc.events(events1);
      spyOn(lwc, 'preservePosition');
      spyOn(lwc, 'restorePosition');
      // Looks like the data we get back from the server.
      var data = {
        events: events2
      };
      lwc.appendEvents(data);
      expect(lwc.preservePosition).wasCalled();
      expect(lwc.restorePosition).wasCalled();
      var events = lwc.events();
      expect(events.length).toEqual(4);
      for (i = 0; i < 4; i++) {
        expect(events[i].offset).toEqual(i);
      }
    });
    
    it('displays a maximum number of events when prepending', function() {
      var i, maxEvents = 4;
      // Set up a LogWithContext instance that takes max 5 events.
      lwc = new LogWithContext({
        'logEventUrl': 'http://localhost/logEventUrl',
        'downloadUrl': 'http://localhost/downloadUrl',
        'hostUrlPrefix': 'http://localhost/hostUrlPrefix',
        'maxEvents': maxEvents
      });
      // Generate three events as already existing events, as well as three
      // more events that are supposed to be earlier.
      var oldEvents = [], newEvents = [];
      for (i = 0; i < 3; i++) {
        oldEvents.push(makeTestEvent(1000 + (i * 10), 10000 + (i * 1000)));
        newEvents.push(makeTestEvent(900 + (i * 10), 5000 + (i * 1000)));
      }
      lwc.events(oldEvents);
      spyOn(lwc, 'preservePosition');
      spyOn(lwc, 'restorePosition');
      var data = {
        events: newEvents
      };
      // Try to update with three new events.
      lwc.prependEvents(data);
      // Verify expectations.
      var events = lwc.events();
      expect(events.length).toEqual(maxEvents);
      expect(events[0].offset).toEqual(900);
      expect(events[1].offset).toEqual(910);
      expect(events[2].offset).toEqual(920);
      expect(events[3].offset).toEqual(1000);
      expect(lwc.preservePosition).wasCalled();
      expect(lwc.restorePosition).wasCalled();
    });
    
    it('displays a maximum number of events when appending', function() {
      var i, maxEvents = 4;
      // Set up a LogWithContext instance that takes max 5 events.
      lwc = new LogWithContext({
        'logEventUrl': 'http://localhost/logEventUrl',
        'downloadUrl': 'http://localhost/downloadUrl',
        'hostUrlPrefix': 'http://localhost/hostUrlPrefix',
        'maxEvents': maxEvents
      });
      // Generate three events as already existing events, as well as three
      // more events that are supposed to be earlier.
      var oldEvents = [], newEvents = [];
      for (i = 0; i < 3; i++) {
        oldEvents.push(makeTestEvent(900 + (i * 10), 5000 + (i * 1000)));
        newEvents.push(makeTestEvent(1000 + (i * 10), 10000 + (i * 1000)));
      }
      lwc.events(oldEvents);
      spyOn(lwc, 'preservePosition');
      spyOn(lwc, 'restorePosition');
      var data = {
        events: newEvents
      };
      // Try to update with three new events.
      lwc.appendEvents(data);
      // Verify expectations.
      var events = lwc.events();
      expect(events.length).toEqual(maxEvents);
      expect(events[0].offset).toEqual(920);
      expect(events[1].offset).toEqual(1000);
      expect(events[2].offset).toEqual(1010);
      expect(events[3].offset).toEqual(1020);
      expect(lwc.preservePosition).wasCalled();
      expect(lwc.restorePosition).wasCalled();
    });
    
    it('will only allow one in-flight request at a time', function() {
      var mockJqxhr = jasmine.createSpy();
      mockJqxhr.complete = function() {};
      spyOn($, 'post').andReturn(mockJqxhr);
      var completeFunc = null;
      spyOn(mockJqxhr, 'complete').andCallFake(function() {
        completeFunc = mockJqxhr.complete.mostRecentCall.args[0];
      });
      lwc.requestInFlight = false;
      lwc.makeRequest({});
      expect($.post).wasCalled();
      expect(mockJqxhr.complete).wasCalled();
      expect(lwc.requestInFlight).toEqual(true);
      expect(completeFunc).not.toBeFalsy();
      // This call will do nothing since it immediately returns.
      lwc.makeRequest({});
      // After calling the completeFunc it allows requests to be made.
      completeFunc();
      expect(lwc.requestInFlight).toEqual(false);
      lwc.makeRequest({});
      expect($.post.callCount).toEqual(2);
    });
    
    it('will not make any server requests if not within a scroll threshold', function() {
      // I'm returning fake results for the jQuery object below, so it doesn't actually
      // need to be pointing at an actual table row or anything.
      var mockTable = jasmine.createSpy();
      mockTable.height = function() {};
      spyOn(lwc.$mainTableContainer, 'find').andReturn(mockTable);
      spyOn(lwc.$mainTableContainer, 'scrollTop').andReturn(500);
      spyOn(lwc.$mainTableContainer, 'height').andReturn(100);
      spyOn(mockTable, 'height').andReturn(1000);
      spyOn(lwc, 'makeRequest');
      lwc.onTableScroll();
      expect(lwc.makeRequest).wasNotCalled();
    });
    
    it('will make server requests using the top offset if within the top scroll threshold', function() {
      // I'm returning fake results for the jQuery object below, so it doesn't actually
      // need to be pointing at an actual table row or anything.
      var mockTable = jasmine.createSpy();
      mockTable.height =function() {};
      spyOn(lwc.$mainTableContainer, 'find').andReturn(mockTable);
      spyOn(lwc.$mainTableContainer, 'scrollTop').andReturn(0);
      spyOn(lwc.$mainTableContainer, 'height').andReturn(100);
      spyOn(mockTable, 'height').andReturn(1000);
      spyOn(lwc, 'makeRequest');
      lwc.onTableScroll();
      expect(lwc.makeRequest).wasCalled();
    });
    
    it('will make server requests using the bottom offset if within the bottom scroll threshold', function() {
      // I'm returning fake results for the jQuery object below, so it doesn't actually
      // need to be pointing at an actual table row or anything.
      var mockTable = jasmine.createSpy();
      mockTable.height =function() {};
      spyOn(lwc.$mainTableContainer, 'find').andReturn(mockTable);
      spyOn(lwc.$mainTableContainer, 'scrollTop').andReturn(900);
      spyOn(lwc.$mainTableContainer, 'height').andReturn(100);
      spyOn(mockTable, 'height').andReturn(1000);
      spyOn(lwc, 'makeRequest');
      lwc.onTableScroll();
      expect(lwc.makeRequest).wasCalled();
    });
    
    it('knows how to merge events when there are no new events', function() {
      var events1 = [];
      var events2 = [
        makeTestEvent(0, 1),
        makeTestEvent(2, 3),
        makeTestEvent(4, 5)
      ];
      var mergedEvents = lwc.mergeEvents(events1, events2);
      expect(mergedEvents.length).toEqual(3);
      expect(mergedEvents[0].time).toEqual(1);
      expect(mergedEvents[1].time).toEqual(3);
      expect(mergedEvents[2].time).toEqual(5);
      
      // Test the other direction, for completeness.
      mergedEvents = lwc.mergeEvents(events2, events1);
      expect(mergedEvents.length).toEqual(3);
      expect(mergedEvents[0].time).toEqual(1);
      expect(mergedEvents[1].time).toEqual(3);
      expect(mergedEvents[2].time).toEqual(5);
    });
    
    it('knows how to merge events when there is no overlap', function() {
      var events1 = [], events2 = [], i;
      for (i = 0; i < 3; i++) {
        events1.push(makeTestEvent(i, i + 50));
        events2.push(makeTestEvent(i + 3, i + 53));
      }
      var mergedEvents = lwc.mergeEvents(events1, events2);
      expect(mergedEvents.length).toEqual(6);
      expect(mergedEvents[0].time).toEqual(50);
      expect(mergedEvents[1].time).toEqual(51);
      expect(mergedEvents[2].time).toEqual(52);
      expect(mergedEvents[3].time).toEqual(53);
      expect(mergedEvents[4].time).toEqual(54);
      expect(mergedEvents[5].time).toEqual(55);
      
      // Test other direction, for completeness.
      mergedEvents = lwc.mergeEvents(events2, events1);
      expect(mergedEvents.length).toEqual(6);
      expect(mergedEvents[0].time).toEqual(50);
      expect(mergedEvents[1].time).toEqual(51);
      expect(mergedEvents[2].time).toEqual(52);
      expect(mergedEvents[3].time).toEqual(53);
      expect(mergedEvents[4].time).toEqual(54);
      expect(mergedEvents[5].time).toEqual(55);
    });
    
    it('knows how to merge events when there is overlap and duplicates', function() {
      var events1 = [], events2 = [], i;
      for (i = 0; i < 4; i++) {
        events1.push(makeTestEvent(i, i + 50));
        events2.push(makeTestEvent(i + 2, i + 52));
      }
      var mergedEvents = lwc.mergeEvents(events1, events2);
      expect(mergedEvents.length).toEqual(6);
      expect(mergedEvents[0].time).toEqual(50);
      expect(mergedEvents[1].time).toEqual(51);
      expect(mergedEvents[2].time).toEqual(52);
      expect(mergedEvents[3].time).toEqual(53);
      expect(mergedEvents[4].time).toEqual(54);
      expect(mergedEvents[5].time).toEqual(55);
    });
  });
});
