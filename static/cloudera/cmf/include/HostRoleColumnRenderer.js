// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/Util",
  "cloudera/common/I18n"
], function(Util, I18n) {

  var ensureDefined = Util.ensureDefined;
  var isDefined = Util.isDefined;

  var hasRole = function(roles, roleType) {
    if ($.isArray(roles)) {
      var i, len = roles.length;
      for (i = 0; i < len; i += 1) {
        var role = roles[i];
        if (role.roleType === roleType) {
          return true;
        }
      }
      return false;
    } else {
      return false;
    }
  };

  var hasNameNode = function(host) {
    return hasRole(host.roles, "NAMENODE");
  };

  var hasJobTracker = function(host) {
    return hasRole(host.roles, "JOBTRACKER");
  };

  var hasSecondaryNameNode = function(host) {
    return hasRole(host.roles, "SECONDARYNAMENODE");
  };

  var hasJournalNode = function(host) {
    return hasRole(host.roles, "JOURNALNODE");
  };

  var renderInputWithName = function(host, name, type) {
    var $container = $("<div></div>");
    var $input = $('<input>')
      .attr("type", type)
      .attr("name", name)
      .attr("value", host.hostId);
    $container.append($input);

    return $container.html();
  };

  var renderCheckWithName = function(host, name) {
    return renderInputWithName(host, name, "checkbox");
  };

  var renderRadioWithName = function(host, name) {
    return renderInputWithName(host, name, "radio");
  };

  var renderExistingJNPlaceholder = function (host) {
    return "X";
  };

  var renderJN = function(host, nameservice, enableHA) {
    if (isDefined(host) && host.hostId) {
      if (hasJournalNode(host)) {
        return renderExistingJNPlaceholder(host);
      }
      return renderCheckWithName(host, "hostIdsForJNs");
    } else {
      return "";
    }
  };

  var getRolesWithNameservice = function(host) {
    var result = [];
    if ($.isArray(host.roles)) {
      var i,
        roles = host.roles,
        len = roles.length;
      for (i = 0; i < len; i += 1) {
        var role = roles[i];
        if (role.nameservice !== undefined) {
          result.push(role);
        }
      }
    }
    return result;
  };

  var renderNameservices = function(host) {
    if ($.isArray(host.roles)) {
      var i,
        $container = $("<span>"),
        nameservice,
        roles = getRolesWithNameservice(host),
        len = roles.length;
      if (len > 0) {
        for (i = 0; i < len; i += 1) {
          nameservice = roles[i].nameservice;
          if (nameservice === null) {
            // Don't display null in the UI.
            nameservice = "";
          }
          $container.append($("<span>").text(nameservice + " (" + roles[i].displayType + ")"));
          if (i < len - 1) {
            $container.append("<br/>");
          }
        }
        return $container.html();
      } else {
        return "";
      }
    } else {
      return "";
    }
  };
  

  var hasNameservice = function(host, nameservice) {
    var roles = getRolesWithNameservice(host);
    var i, len = roles.length;
    for (i = 0; i < len; i += 1) {
      if (roles[i].nameservice === nameservice) {
        return true;
      }
    }
    return false;
  };

  var renderRoles = function(host) {
    if ($.isArray(host.roles)) {
      var i, roles = host.roles,
        len = host.roles.length;
      if (len > 1) {
        var $container = $("<span>"),
          $otherHeader = $("<div></div>")
            .addClass("Toggler").addClass("otherHeader")
            .attr("data-element-direction", "next")
            .attr("data-element-selector", "ul"),
          $icon = $("<i></i>")
            .addClass("icon-chevron-right"),
          $otherRoles = $("<ul></ul>")
            .addClass("otherRoles").hide(),
          $otherRolesHeader = $("<span></span>").text(len + " role(s)");

        $otherHeader.append($otherRolesHeader).append($icon);
        for (i = 0; i < len; i += 1) {
          var role = roles[i];
          var $li = $("<li></li>").text(role.displayType);
          $otherRoles.append($li);
        }
        $container.append($otherHeader).append($otherRoles);
        return $container.html();
      } else if (len === 1) {
        return roles[0].displayType;
      } else {
        return I18n.t("ui.none");
      }
    } else {
      return "";
    }
  };

  var renderRoleCount = function(host) {
    if ($.isArray(host.roles)) {
      return host.roles.length;
    } else {
      return "0";
    }
  };

  var renderPlaceholder = function () {
    return I18n.t("ui.na");
  };

  var renderANN = function(host, nameservice, enableHA) {
    if (isDefined(host) && host.hostId) {
      if (hasNameservice(host, nameservice)) {
        // This should not happen actually.
        return "";
      } else if (hasNameNode(host)) {
        // Another NN is present.
        return renderPlaceholder();
      } else if (hasSecondaryNameNode(host)) {
        // A SNN is present, cannot place a NN here.
        return "";
      } else {
        return renderRadioWithName(host, "hostIdForANN");
      }
    } else {
      return "";
    }
  };

  var renderSBN = function(host, nameservice, enableHA) {
    if (isDefined(host) && host.hostId) {
      if (hasNameservice(host, nameservice)) {
        // A SNN or a NN for this nameservice is here.
        if (enableHA && (hasSecondaryNameNode(host) && !hasNameNode(host))) {
          return renderRadioWithName(host, "hostIdForSBN");
        } else {
          return renderPlaceholder();
        }
      } else if (hasNameNode(host)) {
        // Another NN is present.
        return renderPlaceholder();
      } else if (hasSecondaryNameNode(host)) {
        // A SNN is present, cannot place a NN here.
        return "";
      } else {
        return renderRadioWithName(host, "hostIdForSBN");
      }
    } else {
      return "";
    }
  };

  var renderSNN = function(host, nameservice, enableHA) {
    if (isDefined(host) && host.hostId) {
      if (hasNameservice(host, nameservice)) {
        if (!enableHA) {
          // We can place the Stand-by Node
          // on the soon-to-be removed SNN.
          return renderRadioWithName(host, "hostIdForSNN");
        } else {
          return renderPlaceholder();
        }
      } else if (hasSecondaryNameNode(host)) {
        // A SNN is present, cannot place a NN here.
        return renderPlaceholder();
      } else if (hasNameNode(host)) {
        // Another NN is present.
        return "";
      } else {
        return renderRadioWithName(host, "hostIdForSNN");
      }
    } else {
      return "";
    }
  };

  var renderSBJT = function(host, nameservice, enableHA) {
    if (isDefined(host) && host.hostId) {
      if (hasJobTracker(host)) {
        return renderPlaceholder();
      } else {
        return renderRadioWithName(host, "hostIdForSBJT");
      }
    } else {
      return "";
    }
  };

  var assignmentMethods = {
    "ACTIVE_NAMENODE" : renderANN,
    "STANDBY_NAMENODE" : renderSBN,
    "SECONDARY_NAMENODE" : renderSNN,
    "JOURNALNODE" : renderJN,
    "STANDBY_JOBTRACKER" : renderSBJT
  };

  var renderAssignment = function(columnName, host, nameservice, enableHA) {
    return assignmentMethods[columnName](host, nameservice, enableHA);
  };


  var HostRoleColumnRenderer = {
    renderNameservices: renderNameservices,
    renderRoles: renderRoles,
    renderRoleCount: renderRoleCount,
    renderAssignment : renderAssignment,
    renderANN: renderANN,
    renderSBN: renderSBN,
    renderSNN: renderSNN,
    renderJN: renderJN,
    renderSBJT: renderSBJT
  };
  return HostRoleColumnRenderer;
});
