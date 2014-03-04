// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define(function() {

  /**
   * A wrapper of the bootstrap typeahead control that allows the selected value
   * to be different from the display value.
   */
  var SimpleTypeahead = function (element) {
    this.$element = $(element);
    this.value2Name = {};
  };

  /**
   * options = {
   *   url: "Required. The url that returns an array of objects when added a query=... parameter"
   *   name: "Optional. The attribute name for the object name, defaults to name."
   *   value: "Optional. The attribute name for the object value, defaults to value."
   *   updater: function(name, value) {
   *     // Optional, but this control is not useful without it.
   *     // A callback function that tells the caller which
   *     // {name, value} pair was selected.
   *     // return what should be shown in the input field, which is typically the
   *     // value attribute.
   *   }
   *   noResults: function() {
   *     // Optional. Invoked if no results are returned by typeahead.
   *   }
   * }
   *
   * For example, suppose the url is "/path/foo",
   * When user types "bar" into the input field, a request
   * "/path/foo?query=bar" will be sent to the server.
   *
   * When the server sends back an JSON array:
   * [ {
   *    name: "bar1",
   *    value: "Milk Bar"
   * }, {
   *    name: "bar2",
   *    value: "Chocolate Bar"
   * }]
   *
   * ["Milk Bar", "Chocolate Bar"] will be displayed to the user for selection.
   *
   * When user selects "Milk Bar", options.updater("bar1", "Milk Bar") will be invoked.
   *
   * The server could also send back a JSON array with different attribute names:
   * [ {
   *    key: "bar1",
   *    label: "Milk Bar"
   * } , {
   *    ...
   * } ];
   *
   * In which case, options should specify the name of the attributes:
   * options = {
   *   url: "...",
   *   name: "key",
   *   value: "label"
   * }
   */
  $.fn.SimpleTypeahead = function (options) {
    return this.each(function () {
      var $this = $(this), data = $this.data("SimpleTypeahead");

      options = $.extend({}, $.fn.SimpleTypeahead.defaults, options);

      if (!data) {
        $this.data("SimpleTypeahead", (data = new SimpleTypeahead(this)));
      }

      /**
       * Invokes bootstrap's typeahead.
       */
      $this.typeahead({
        source: function(query, process) {
          var cursor = query.length;
          try {
            if ($this.is(":visible")) {
              cursor = $this.prop("selectionStart");
            }
          } catch (ex) {
            // purposely ignore when we cann't get the selectionStart property.
          }

          $.post(options.url, { query: query, cursor: cursor }, function(response) {
            var values = [];
            data.value2Name = {};
            $.each(response, function(i, v) {
              var value = v[options.value];
              var name = v[options.name];
              values.push(value);
              data.value2Name[value] = name;
            });
            if (values.length === 0 && $.isFunction(options.noResults)) {
              options.noResults();
            }
            process(values);
          }, 'json');
        }, updater: function(val) {
          if ($.isFunction(options.updater)) {
            return options.updater(data.value2Name[val], val);
          }
          return val;
        }, matcher: options.matcher,
        items: options.items
      });
    });
  };

  $.fn.SimpleTypeahead.defaults = {
    name: "name",
    value: "value",
    // The same default from Bootstrap's typeahead.
    items: 16
  };
});
