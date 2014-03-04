// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/charts/ChartsSearch',
  'cloudera/Util'
], function(ChartsSearch, Util) {
  describe("ChartsSearch Tests", function() {
    var module, id = "chartsSearchContainer", options = {
      container: "#" + id,
      recentUri: "dontcare",
      searchUri: "dontcare",
      metric: "",
      tsquery: ""
    }, SOME_TSQUERY = "SELECT Metric FOO", SOME_METRIC = "Metric FOO";

    beforeEach(function() {
      jasmine.Ajax.useMock();
      clearAjaxRequests();
      $('<div id="' + id + '">' +
       '<div class="control-group">' +
        '<input class="metricInput" type="text"/>' +
        '</div>' +
        '<div class="control-group">' +
        '<input class="tsqueryInput" data-bind="value: tsquery" type="hidden"/>' +
        '</div>' +
        '</div>').appendTo(document.body);
      spyOn($, "publish");
    });

    afterEach(function() {
      $("#" + id).remove();
    });

    it("should not show error class on tsquery input fields when it is empty", function() {
      module = new ChartsSearch(options);

      // Test Binding.
      module.tsquery("");
      expect($(".tsqueryInput").val()).toEqual("");

      module.handleClick();
      expect($(".tsqueryInput").closest(".control-group.error").length).toBeGreaterThan(0);
      expect($.publish).wasNotCalled();
    });

    it("should not show error class on tsquery input fields when it is not empty", function() {
      module = new ChartsSearch(options);

      module.tsquery(SOME_TSQUERY + "1");
      expect($(".tsqueryInput").val()).toEqual(SOME_TSQUERY + "1");

      module.handleClick();
      expect($(".tsqueryInput").closest(".control-group.error").length).toEqual(0);
      expect($.publish).wasCalledWith("tsqueryChanged", [SOME_TSQUERY + "1"]);
    });

    it("should trigger a $.publish", function() {
      module = new ChartsSearch(options);

      $(".tsqueryInput").val(SOME_TSQUERY + "2");

      // Added to the recent list.
      module.handleClick();
      expect($.publish).wasCalledWith("tsqueryChanged", [SOME_TSQUERY + "2"]);
      expect(module.recentList().length).toEqual(1);

      // Added to the recent list.
      $(".tsqueryInput").val(SOME_TSQUERY + "3");
      module.handleClick();
      expect(module.recentList().length).toEqual(2);

      // No change.
      $(".tsqueryInput").val(SOME_TSQUERY + "3");
      module.handleClick();
      expect(module.recentList().length).toEqual(2);
    });

    it("should generate context key values", function() {
      module = new ChartsSearch($.extend({}, options, {
        context: {
          '$foo': "FOO",
          '$bar': "BAR"
        }
      }));
      expect(module.contextKeyValues().length).toEqual(2);
      expect(module.contextKeyValues()[0].name).toEqual("$foo");
      expect(module.contextKeyValues()[0].value).toEqual("FOO");
    });

    it('should call search on the second enter', function() {
      module = new ChartsSearch(options);
      spyOn(module, "handleClick");

      // Set some fake values as the tsquery.
      var event = $.Event('keyup');
      event.which = $.ui.keyCode.ENTER; // The Enter key.
      $('.tsqueryInput').val('select catpants').trigger(event);

      var waitedOnce = false;
      waitsFor(function() {
        var result = waitedOnce;
        waitedOnce = true;
        return result;
      }, 200);

      runs(function() {
        expect(module.handleClick).wasCalled();
      });
    });

    function triggerKeyEvent($input, event, keyCode) {
      var keyupEvt = jQuery.Event(event);
      keyupEvt.keyCode = keyCode;
      $input.trigger(keyupEvt);
    }

    it('should ensure the cursor is set', function() {
      module = new ChartsSearch(options);

      var $input = $('.tsqueryInput');

      // Set some fake values as the tsquery.
      $input.val('select catpants').trigger("keyup");

      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify([{
          "value":{
            "qualifier":"{}",
            "cursor":18,
            "tsquery":"SELECT cpu_percent"
          },
          "label":"Host CPU Usage (cpu_percent)"
        }])
      });

      triggerKeyEvent($input, 'keydown', 40);// 40 = down arrow;
      triggerKeyEvent($input, 'keyup', 13);// 13 = enter;

      spyOn(Util, "setCaretToPos");

      waitsFor(function() {
        return Util.setCaretToPos.callCount > 0;
      }, 500);

      runs(function() {
        expect(Util.setCaretToPos).wasCalled();
        expect(Util.setCaretToPos.mostRecentCall.args[1]).toEqual(18);
      });
    });
  });
});
