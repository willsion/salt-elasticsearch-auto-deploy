// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
/**
 * jQuery's implementation of turning regular buttons/links into ajax operations, and the response content
 * gets appended.
 */
define([
  "cloudera/Util",
  "cloudera/layout/FormFinder",
  "underscore"
], function(Util, FormFinder, _) {

  var AjaxLink = function (element) {
    this.$element = $(element);

    this.onclick = function (evt) {
      // data-target: the jQuery selector of the parent target (default body),
      // data-method: get|post (default get)
      // data-append: true (default) |false.
      //   true means the content will be appended to the target;
      //   false means the parents content will be erased first.
      // }
      var $link = this.$element;
      var i, url, method, params = "", defaults = $.fn.AjaxLink.defaults;

      // the URL may be specified by href or associated with a form.
      var $form = $link.FormFinder();
      if ($form.length !== 0) {
        url = $form.attr("action");
        method = $form.attr("method") || defaults.method;
        params = $form.serializeArray();

        if ($link.attr("name") !== undefined &&
            $link.attr("value") !== undefined) {
          var param = {
            name:  $link.attr("name"),
            value : $link.attr("value")
          };
          params.push(param);
        }
        $form = null;
      } else if ($link.attr("href")) {
        url = $link.attr("href");
        method = $link.attr("data-method") || defaults.method;
      }

      var target = $link.attr("data-target") || defaults.target;
      var append = $link.attr("data-append") || defaults.append;

      var hasDuplicateDialogIds = function(response) {
        var hasDuplicateId = false;
        var $visibleDialogs = $(".modal.in:visible");
        if ($visibleDialogs.length > 0) {
          // This is a bit tricky.
          // When there is a visible modal dialog open, we need to make sure
          // we don't load another modal dialog that has the same id.
          // Otherwise a JavaScript exception is thrown and user has to reload the page.
          $.each($visibleDialogs, function(i, dialog) {
            var id = $(dialog).attr("id");
            if (id !== "") {
              hasDuplicateId = hasDuplicateId || response.indexOf('id="' + id + '"') !== -1;
            }
          });
        }
        return hasDuplicateId;
      };

      var showSpinnerTime;
      /**
       * @return the amount of time spinner has been shown so far.
       */
      var getSpinnerShownTime = function() {
        return (new Date()).getTime() - showSpinnerTime;
      };

      /**
       * @return the amount of time we still have to show the spinner.
       */
      var getSpinnerDelayTime = function() {
        return Math.max(defaults.spinnerDisplayDurationInMS - getSpinnerShownTime(), 0);
      };

      /**
       * Adds two elements to document.body:
       * <div class="modal-backdrop in global-spinner-backdrop"> and
       * <div class="global-spinner-well modal">
       */
      var showSpinner = function() {
        if ($(".global-spinner-backdrop").length === 0) {
          var $backdrop = $("<div>").addClass("modal-backdrop in global-spinner-backdrop");
          $backdrop.appendTo(document.body);
        } else {
          $(".global-spinner-backdrop").show();
        }

        if ($(".global-spinner-well").length === 0) {
          var $well = $("<div>").addClass("well global-spinner-well modal");
          var $container = $("<div>").addClass("global-spinner-container");
          var $spinner = $("<i>").addClass("IconSpinner32x32Dark").appendTo($container);
          $container.appendTo($well);
          $well.appendTo(document.body);
        } else {
          $(".global-spinner-well").show();
        }
        showSpinnerTime = new Date();
      };

      /**
       * Removes the spinner.
       */
      var hideSpinner = function() {
        _.delay(function() {
          $(".global-spinner-backdrop").hide();
          $(".global-spinner-well").hide();
        }, getSpinnerDelayTime());
      };

      var onResponse = function(response) {
        var filteredResponse = Util.filterError(response);

        if (hasDuplicateDialogIds(filteredResponse)) {
          // do nothing.
          return;
        }

        _.delay(function() {
          var $target = $(target);
          if (append === "true") {
            $target.append($(filteredResponse));
          } else {
            $target.html(filteredResponse);
          }
        }, getSpinnerDelayTime());
      };

      showSpinner();
      if (method.toLowerCase() === "get") {
        if (params !== "") {
          url += "?" + params;
        }
        $.get(url, onResponse).complete(hideSpinner);
      } else {
        $.post(url, params, onResponse).complete(hideSpinner);
      }
      $link.blur();

      if (evt) {
        evt.preventDefault();
      }
      $link = null;
    };
  };

  $.fn.AjaxLink = function (option) {
    return this.each(function () {
      var $this = $(this),
      data = $this.data('AjaxLink'),
      onclick = function (evt) {
        data.onclick(evt);
      };

      if (!data) {
        $this.data('AjaxLink', (data = new AjaxLink(this)));
      }

      /**
       * Simulates a click event.
       */
      if (option === 'click') {
        data.onclick(null);
      }
    });
  };

  $.fn.AjaxLink.defaults = {
    target: "body",
    method: "get",
    append: "true",
    spinnerDisplayDurationInMS: 200
  };
  return $.fn.AjaxLink;
});
