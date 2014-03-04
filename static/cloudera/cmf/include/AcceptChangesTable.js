// (c) Copyright 2012 Cloudera, Inc. All rights reserved.

/*global define: false, $: false */
define([
  "cloudera/cmf/page/ServiceConfig",
  "cloudera/common/I18n"
], function (ServiceConfig, I18n) {
  "use strict";

  return function (options) {

    var serviceConfigOptions = options.serviceConfigOptions;
    var serviceConfig = new ServiceConfig(serviceConfigOptions);

    var unselectCell = function ($parent) {
      $parent.find("input").attr("disabled", "disabled");
      $parent.find(".icon-ok").addClass("hidden");
    };

    var selectCell = function ($parent) {
      $parent.find("input").removeAttr("disabled");
      $parent.find(".icon-ok").removeClass("hidden");
    };

    var $container = $(options.containerSelector);
    $container.on('click', '.valueContainer', function (e) {
      var $tr, $tgt = $(e.target);
      if (!$tgt.is(".valueContainer")) {
        $tgt = $tgt.closest(".valueContainer");
      }
      $tr = $tgt.closest("tr");
      unselectCell($tr);
      selectCell($tgt);
    });

    $container.find(".allNewValue").click(function (e) {
      selectCell($container.find(".valueContainer .newValue"));
      unselectCell($container.find(".valueContainer .currentValue"));
      if (e) {
        e.preventDefault();
      }
    });

    $container.find(".allCurrentValue").click(function (e) {
      unselectCell($container.find(".valueContainer .newValue"));
      selectCell($container.find(".valueContainer .currentValue"));
      if (e) {
        e.preventDefault();
      }
    });

    $container.find(".showMembers").click(function (e) {
      var $link = $(e.target);
      var $popup = $("#membersPopup");
      var $list = $popup.find(".roleList");
      var $desc = $popup.find(".listDescription");

      var name = $link.data("name");
      var displayName = $link.data("displayName");
      var roleType = $link.data("roleType");
      var hostNames = options.groupToHosts[name];
      hostNames.sort();

      // Update popup header
      $popup.find(".modal-header h3").html(displayName);

      // Update list description
      $desc.html(I18n.t("ui.wizard.groupContains", displayName, hostNames.length, roleType));

      // Update list of hosts
      $list.children("li").remove();
      var i;
      for (i = 0; i < hostNames.length; i++) {
        $("<li>").html(hostNames[i]).appendTo($list);
      }

      // Open modal
      $popup.modal();
    });

    $container.find(".showTooltip").tooltip();
  };
});
