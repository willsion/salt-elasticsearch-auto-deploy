// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/Util",
  "cloudera/common/Humanize",
  "cloudera/common/InlineGraph",
  "cloudera/common/I18n",
  "cloudera/common/TimeUtil",
  "cloudera/cmf/include/HealthAndIcon",
  "cloudera/cmf/include/DisplayStatusAndIcon",
  "cloudera/cmf/include/RoleStateAndIcon",
  "cloudera/cmf/include/HeartbeatDuration",
  "cloudera/cmf/CmfPath",
  "underscore"
], function(Util, Humanize, InlineGraph, I18n, TimeUtil, HealthAndIcon, DisplayStatusAndIcon, RoleStateAndIcon, HeartbeatDuration, CmfPath, _) {

  var ensureDefined = Util.ensureDefined;
  var isDefined = Util.isDefined;
  // Use a fixed now value so that during sorting,
  // especially when sorting takes non-trivial amount
  // of time, the values are stable.
  var now = TimeUtil.getServerNow();
  var getNow = function() {
    return now;
  };

  var renderCheckbox = function(obj) {
    if (isDefined(obj.id)) {
      var $container = $("<span>");
      var $input = $("<input type='checkbox'>")
        .attr("name", 'id')
        .attr("value", obj.id);
      if (obj.selected) {
        $input.attr("checked", "checked");
      }
      $container.append($input);
      return $container.html();
    } else {
      return "";
    }
  };

  var getRoleActiveState = function(role) {
    if (isDefined(role)) {
      return ensureDefined(role.roleActiveState);
    } else {
      return "";
    }
  };

  var getRoleDisplayName = function(role) {
    if (isDefined(role)) {
      return ensureDefined(role.roleName) + getRoleActiveState(role);
    } else {
      return "";
    }
  };

  var renderRole = function(role) {
    var roleDisplayName = getRoleDisplayName(role);
    return ensureDefined(roleDisplayName);
  };

  var renderRoleType = function(role) {
    return ensureDefined(role.roleType);
  };

  var renderLink = function(url, text, title) {
    var $container = $("<span>");
    var $elem = $("<a>")
      .attr("href", url)
      .text(text);
    if (title) {
      $elem.attr("title", title);
    }
    $container.append($elem);
    return $container.html();
  };

  var renderIconLink = function (url, text, iconClass) {
    // url is required. text, iconClass may be optional.
    if (_.isString(url)) {
      var $container = $("<span>");
      var $icon = $("<i>").addClass(iconClass);
      var $elem = $("<a>")
      .attr("href", url)
      .append($icon)
      .append(" " + text);
      $container.append($elem);
      return $container.html();
    } else {
      return "";
    }
  };

  var renderMenu = function (links, buttonText, buttonIconClass, menuAlignment) {
    if (!$.isArray(links)) {
      return "";
    }
    var $container = $("<span>");
    var $btnGroup = $("<div>").addClass("btn-group");
    var $caret, $menuButton = $("<a>").addClass("btn dropdown-toggle")
      .attr("data-toggle", "dropdown")
      .attr("href", "#");

    if (buttonIconClass && buttonText) {
      var $icon = $("<i>").addClass(buttonIconClass);
      $menuButton.append($icon);
      $menuButton.append(" " + buttonText + " ");
      $caret = $("<span>").addClass("caret");
      $menuButton.append($caret);
    } else {
      $caret = $("<i>").addClass("caret valignMiddle");
      $menuButton.append($caret);
    }

    if (menuAlignment) {
      $btnGroup.addClass(menuAlignment);
    }

    var $dropdownMenu = $("<ul>").addClass("dropdown-menu");
    $btnGroup.append($menuButton);
    $btnGroup.append($dropdownMenu);

    var i = 0;
    for (i = 0; i < links.length; i += 1) {
      var link = links[i];
      var $link = renderIconLink(link.url, link.text, link.iconClass);
      var $li = $("<li>").append($link);
      $dropdownMenu.append($li);
    }
    return $container.append($btnGroup).html();
  };

  var renderIconLinkWithMenu = function (url, text, iconClass, links) {
    var $link = renderIconLink(url, text, iconClass);
    var $menuContainer = $("<div>").addClass("inlineBlock");
    var $menu = renderMenu(links);
    $menuContainer.append($menu);
    var $container = $("<span>");
    return $container.append($link).append($menuContainer).html();
  };

  var renderSpanWithIcon= function(title, clazz) {
    var $container = $("<span>");
    var $icon = $("<i>").addClass("icon");
    var $elem = $("<span>")
      .attr("title", title)
      .append($icon)
      .addClass(clazz);
    $container.append($elem);
    return $container.html();
  };

  var renderIcon = function(title, iconClass) {
    var $container = $("<span>");
    var $icon = $("<i>").addClass(iconClass);
    $container.append($icon);
    return $container.html();
  };


  var renderDate = function(timestamp) {
    if (timestamp > 0) {
      return Humanize.humanizeDateTimeMedium(new Date(timestamp));
    } else {
      return "";
    }
  };

  var renderRoleLink = function(role) {
    if (isDefined(role) && role.id && role.serviceId) {
      if ("GATEWAY" === role.roleType) {
        return getRoleDisplayName(role);
      }
      var roleUrl = CmfPath.getTabUrlsForRoleInstance(role.serviceId, role.id).STATUS;
      return renderIconLink(roleUrl, getRoleDisplayName(role), "");
    } else {
      return "";
    }
  };

  var getHostDisplayName = function(host) {
    if (isDefined(host)) {
      var hostDisplayName;
      if (host.hostId === host.hostName) {
        hostDisplayName = host.hostId;
      } else {
        hostDisplayName = host.hostName + " (" + host.hostId + ")";
      }
      return hostDisplayName;
    } else {
      return "";
    }
  };

  var renderHostLink = function(host) {
    if (isDefined(host) && host.id) {
      var hostUrl = CmfPath.getTabUrlsForHost(host.id).STATUS;
      return renderIconLink(hostUrl, getHostDisplayName(host), "");
    } else {
      return "";
    }
  };

  var renderHost = function(host) {
    return ensureDefined(getHostDisplayName(host));
  };

  var renderIP = function(host) {
    return ensureDefined(host.ipAddress);
  };

  var renderConfigGroup = function(role) {
    return ensureDefined(role.configGroup);
  };

  var renderRack = function(host) {
    return ensureDefined(host.rackId);
  };

  var renderCDHVersion = function(host) {
    return ensureDefined(host.cdhVersion);
  };

  var renderCluster = function(host) {
    if (isDefined(host.cluster)) {
      return ensureDefined(host.cluster.name);
    } else {
      return '<span class="hidden">__orphan__</span>';
    }
  };

  var renderRolesOnHost = function(host) {
    if (isDefined(host.roles)) {
      if (host.roles.length !== 0) {

        var $arrow = $('<i>')
          .addClass("icon-chevron-right");

        var $summary = $('<span>')
          .text(I18n.t("ui.nRoles", host.roles.length));

        var $p = $("<p>")
          .addClass("Toggler")
          .attr("data-element-direction", "next")
          .attr("data-element-selector", "ul")
          .append($arrow)
          .append($summary);

        var $ul = $("<ul>")
          .addClass("unstyled")
          .hide();

        _.each(host.roles, function(role) {
          var $li = $("<li>");

          var $icon = $("<i>")
            .addClass(role.service.type.toLowerCase() + "ServiceIcon");

          var $text = $("<span>")
            .append(role.displayType);

          var $a = $("<a>")
            .attr("href", CmfPath.getInstanceStatusUrl(role.service.id, role.id))
            .attr("title", role.service.name)
            .addClass("showTooltip")
            .append($icon).append($text);

          $ul.append($li);
          $li.append($a);
        });
        return $("<span>").append($p).append($ul).html();
      }
    }
    return '';
  };

  var renderCommissionState = function(commissionState) {
    if (isDefined(commissionState) &&
        isDefined(commissionState.text) &&
        isDefined(commissionState.tag)) {
      if (commissionState.tag !== "commission-state-commissioned") {
        return commissionState.text + '<span class="hidden">' + commissionState.tag + '</span>';
      } else {
        return '<span class="hidden">' + commissionState.tag + '</span>';
      }
    }
    return "";
  };

  var renderHealth = function(obj) {
    if (isDefined(obj.health)) {
      var options = {
        health: obj.health
      };
      return ensureDefined(HealthAndIcon.render(options));
    } else {
      return "";
    }
  };

  var renderDisplayStatus = function(obj) {
    if (isDefined(obj.displayStatus)) {
      var options = {
        displayStatus: obj.displayStatus
      };
      return ensureDefined(DisplayStatusAndIcon.render(options));
    } else {
      return "";
    }
  };

  var renderRoleState = function(role) {
    if (isDefined(role.roleState)) {
      var options = {
        roleState: role.roleState
      };
      return ensureDefined(RoleStateAndIcon.render(options));
    } else {
      return "";
    }
  };

  var renderHeartbeat = function(host) {
    var lastSeen = host.lastSeen;
    if (isDefined(lastSeen)) {
      var msSinceLastSeen = this.getNow().getTime() - lastSeen;
      var text = Humanize.humanizeMilliseconds(msSinceLastSeen) + " ago";
      var filterValue = HeartbeatDuration.getFilterValue(msSinceLastSeen);

      var $container = $("<span>");
      var $span = $("<span>").attr("class", "hidden filterValue").text(filterValue);

      $container.append(text).append($span);
      return $container.html();
    } else {
      return I18n.t("ui.none");
    }
  };

  var renderLastSeen = function(host) {
    var lastSeen = host.lastSeen;
    if (isDefined(lastSeen)) {
      return String(lastSeen);
    } else {
      return "";
    }
  };

  var renderNumCores = function(host) {
    if (isDefined(host.numCores)) {
      return String(host.numCores);
    } else {
      return "";
    }
  };

  var renderUsedTotal = function(used, total, units) {
    if (isDefined(used) && isDefined(total)) {
      return InlineGraph.render(used, total, units);
    } else {
      return "";
    }
  };

  var renderDiskUsage = function(host) {
    if (isDefined(host.space)) {
      return renderUsedTotal(host.space.used, host.space.total, "bytes");
    } else {
      return "";
    }
  };

  var renderLoadAverage = function(host) {
    var loadAverage = host.loadAverage;
    if (isDefined(loadAverage)) {
      var buf = [];
      buf.push("<table class='innerTable'>");
      buf.push("<tbody>");
      buf.push("<tr>");
      var i;
      for (i = 0; i < loadAverage.length; i += 1) {
        buf.push("<td>");
        buf.push(loadAverage[i]);
        buf.push("</td>");
      }
      buf.push("</tr>");
      buf.push("</tbody>");
      buf.push("</table>");
      return buf.join("");
    } else {
      return "";
    }
  };

  var renderPhysicalMemory = function(host) {
    if (isDefined(host.physicalMemory)) {
      return renderUsedTotal(host.physicalMemory.used, host.physicalMemory.total, "bytes");
    } else {
      return "";
    }
  };

  var renderVirtualMemory = function(host) {
    if (isDefined(host.virtualMemory)) {
      return renderUsedTotal(host.virtualMemory.used, host.virtualMemory.total, "bytes");
    } else {
      return "";
    }
  };

  var renderMaintenanceMode = function(mm) {
    if (isDefined(mm)) {
      if (mm.actual) {
        return I18n.t("ui.yes") + ' <span class="hidden">yes</span><span class="maintenanceIconActual16x16"></span>';
      } else if (mm.effective) {
        return I18n.t("ui.yes") + ' <span class="hidden">yes</span><span class="maintenanceIconEffective16x16"></span>';
      } else if (mm.actual !== undefined || mm.effective !== undefined) {
        return '<span class="hidden">no</span>';
      }
    }
    return "";
  };

  var match = function(value, filterValue, exact) {
    var matchFilter = true;
    if (filterValue !== undefined && filterValue.length > 0) {
      if (exact) {
        matchFilter = (value === filterValue);
      } else {
        matchFilter = (value.indexOf(filterValue) !== -1);
      }
    }
    return matchFilter;
  };

  var matchCell = function(aData, index, $filterElem, exact) {
    return match(aData[index], $filterElem.val(), exact);
  };

  var matchDropdown = function(aData, index, $filterElem, exact) {
    var dropdownValue = $("option:selected", $filterElem).val();
    return match(aData[index], dropdownValue, exact);
  };

  var setPagination = function(oSettings, isEnabled, pageSize) {
    if (isEnabled) {
      oSettings.sPaginationType = "full_numbers";
      oSettings.iDisplayLength = pageSize;
      oSettings.bPaginate = true;
      oSettings.bInfo = true;
      if (oSettings.sDom === undefined) {
        oSettings.sDom = '<"toolbar"ipl>rt<"toolbar"ipl><"clear">';
      }
      oSettings.bLengthChange = true;
    } else {
      oSettings.bPaginate = false;
      oSettings.sDom = "ti";
      oSettings.bLengthChange = true;
    }
  };

  var getPaginationMenu = function() {
    var pageLengthValue, i,
      keys = [10, 25, 50, 100, 250, -1],
      labels = [10, 25, 50, 100, 250, I18n.t("ui.all")];

    var $container = $("<span>");
    var $select = $("<select>").addClass("pagination").addClass("input-mini");
    $container.append($select);

    for (i = 0; i < keys.length; i += 1) {
      var $opt = $("<option>").attr("value", keys[i]).text(labels[i]);
      $select.append($opt);
    }
    return I18n.t("ui.display") + " " + $container.html() + " " + I18n.t("ui.entries");
  };

  var isFiltered = function($filters) {
    var hasFilterValue = false;
    $filters.each(function(i, filter) {
      var $filter = $(filter);
      if ($filter.is("input")) {
        if ($filter.val() !== "") {
          hasFilterValue = true;
        }
      } else if ($filter.is("select")) {
        if ($filter.find("option:selected").val() !== "") {
          hasFilterValue = true;
        }
      }
    });

    return hasFilterValue;
  };

  var DataTableColumnRenderer = {
    renderCheckbox: renderCheckbox,
    renderLink: renderLink,
    renderDate: renderDate,
    renderUsedTotal: renderUsedTotal,
    renderHost: renderHost,
    renderHostLink: renderHostLink,
    renderRole: renderRole,
    renderRoleType: renderRoleType,
    renderRoleLink: renderRoleLink,
    renderHealth: renderHealth,
    renderDisplayStatus: renderDisplayStatus,
    renderRoleState: renderRoleState,
    renderIconLink: renderIconLink,
    renderIP: renderIP,
    renderConfigGroup: renderConfigGroup,
    renderRack: renderRack,
    renderCDHVersion: renderCDHVersion,
    renderCluster: renderCluster,
    renderRolesOnHost: renderRolesOnHost,
    renderCommissionState: renderCommissionState,
    renderHeartbeat: renderHeartbeat,
    renderLastSeen: renderLastSeen,
    renderNumCores: renderNumCores,
    renderDiskUsage: renderDiskUsage,
    renderLoadAverage: renderLoadAverage,
    renderPhysicalMemory: renderPhysicalMemory,
    renderVirtualMemory: renderVirtualMemory,
    renderMenu: renderMenu,
    renderMaintenanceMode: renderMaintenanceMode,
    match: match,
    matchCell: matchCell,
    matchDropdown: matchDropdown,
    setPagination: setPagination,
    getPaginationMenu: getPaginationMenu,
    // Allow tests to mock the return value
    getNow: getNow,
    isFiltered: isFiltered
  };
  return DataTableColumnRenderer;
});
