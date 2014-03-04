// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "underscore",
  "cloudera/TestUtil",
  "cloudera/Util",
  "cloudera/common/Humanize",
  "cloudera/common/TimeUtil",
  "cloudera/cmf/include/DataTableColumnRenderer",
  "cloudera/cmf/include/HeartbeatDuration",
  "cloudera/common/spec/I18nSpec"
], function(_, TestUtil, Util, Humanize, TimeUtil, DataTableColumnRenderer, HeartbeatDuration, I18nSpec) {

describe("DataTableColumnRenderer Tests", function() {
  var oldServerNow = TimeUtil.getServerNow();

  function compareHTML(html1, html2) {
    var diffs = TestUtil.compareHTML(html1, html2);
    expect(diffs).toEqual([]);
  }

  if (window.resources === undefined) {
    window.resources = {};
  }
  var health = {
    text : "Good",
    tag : "good"
  };

  var state = {
    text : "Running",
    tag : "RUNNING"
  };

  beforeEach(function() {
    spyOn(TimeUtil, "getServerNow").andReturn(new Date(1000));
    spyOn(DataTableColumnRenderer, "getNow").andReturn(new Date(1000));
    spyOn(TimeUtil, 'getTimezoneDelta').andReturn(0);
  });

  afterEach(function() {
  });

  it("should render a checkbox", function() {
    var role = {
        id : "foo"
    };
    var actual = DataTableColumnRenderer.renderCheckbox(role);
    var expected = '<input type="checkbox" name="id" value="foo">';
    compareHTML(actual, expected);
  });

  it("should render a selected checkbox", function() {
    var role = {
        id : "foo",
        selected: true
    };
    var actual = DataTableColumnRenderer.renderCheckbox(role);
    var expected = '<input type="checkbox" name="id" value="foo" checked="checked">';
    compareHTML(actual, expected);
  });

  it("should render a role", function() {
    var role = {
      id: "1",
      serviceId: "7",
      roleName: "NameNode1"
    };
    var actual = DataTableColumnRenderer.renderRole(role);
    var expected = "NameNode1";
    expect(actual).toEqual(expected);
  });

  it("should render a roleType", function() {
    var role = {
      roleType: "NAMENODE"
    };
    var actual = DataTableColumnRenderer.renderRoleType(role);
    var expected = "NAMENODE";
    expect(actual).toEqual(expected);
  });

  it("should render a role link", function() {
    var role = {
      id: 3,
      serviceId: "1",
      roleName: "NameNode1"
    };
    var actual = DataTableColumnRenderer.renderRoleLink(role);
    var expected = '<a href="/cmf/services/1/instances/3/status"><i></i> NameNode1</a>';
    compareHTML(actual, expected);
  });

  it("should render a role name", function() {
    var role = {
      roleName: "NameNode1"
    };
    var actual = DataTableColumnRenderer.renderRole(role);
    var expected = "NameNode1";
    expect(actual).toEqual(expected);
  });

  it("should render a host name", function() {
    var host = {
      id: 1,
      hostName: "localhost",
      hostId: "localhost"
    };
    var actual = DataTableColumnRenderer.renderHost(host);
    var expected = "localhost";
    expect(actual).toEqual(expected);
  });

  it("should render a host name + hostId when they are different", function() {
    var host = {
      id: 1,
      hostName: "air",
      hostId: "localhost"
    };
    var actual = DataTableColumnRenderer.renderHost(host);
    var expected = "air (localhost)";
    expect(actual).toEqual(expected);
  });

  it("should render a host link", function() {
    var host = {
      id: 1,
      hostName: "air",
      hostId: "localhost",
      hostUrl: "/cmf/hardware/hosts/100/status"
    };
    var actual = DataTableColumnRenderer.renderHostLink(host);
    var expected = '<a href="/cmf/hardware/hosts/1/status"><i></i> air (localhost)</a>';
    compareHTML(actual, expected);
  });

  it("should render an IP Address", function() {
    var host = {
      ipAddress: "127.0.0.1"
    };
    var actual = DataTableColumnRenderer.renderIP(host);
    var expected = "127.0.0.1";
    expect(actual).toEqual(expected);
  });

  it("should render a rack", function() {
    var host = {
      rackId: "/default"
    };
    var actual = DataTableColumnRenderer.renderRack(host);
    var expected = "/default";
    expect(actual).toEqual(expected);
  });

  it("should render a health", function() {
    var host = {
      health: {
        text: "Good",
        tag: "good"
      }
    };
    var actual = DataTableColumnRenderer.renderHealth(host);
    var expected = '<span class="goodHealth"><span title="Good" class="icon"></span>Good</span>';
    compareHTML(actual, expected);
  });

  it("should render a display status", function() {
    var host = {
      displayStatus: {
        text: "Good Health",
        tag: "GOOD_HEALTH"
      }
    };
    var actual = DataTableColumnRenderer.renderDisplayStatus(host);
    var expected = '<span class="GOOD_HEALTHStatus"><span title="Good Health" class="icon"></span>Good Health</span>';
    compareHTML(actual, expected);
  });

  it("should render a role state", function() {
    var role = {
      roleState: {
        text: "Running",
        tag: "RUNNING"
      }
    };
    var actual = DataTableColumnRenderer.renderRoleState(role);
    var expected = '<span class="RUNNINGState"><span title="Running" class="icon"></span>Running</span>';
    compareHTML(actual, expected);
  });

  it("should render a date", function() {
    var timestamp = 10;
    var actual = DataTableColumnRenderer.renderDate(timestamp);
    var expected = moment(timestamp).format("LLL");
    expect(actual).toEqual(expected);
  });

  var testHeartbeatContent = function(lastSeen, expected) {
    var host = {
      lastSeen: lastSeen
    };
    var actual = DataTableColumnRenderer.renderHeartbeat(host);
    expect(actual).toMatch(expected);
  };

  it("should render a heart beat", function() {
    var now = TimeUtil.getServerNow();
    testHeartbeatContent(now, '0ms ago<span class="hidden filterValue">0s-30s</span>');
  });

  it("should render a heart beat with a filter value", function() {
    var now = TimeUtil.getServerNow();
    testHeartbeatContent(now, "0s-30s");
    // 45000 (45s), 90000 (1min 30s) etc are milliseconds into the past.
    testHeartbeatContent(new Date(now.getTime() - 45000), "30s-1m");
    testHeartbeatContent(new Date(now.getTime() - 90000), "1m-2m");
    testHeartbeatContent(new Date(now.getTime() - 180000), "2m-5m");
    testHeartbeatContent(new Date(now.getTime() - 360000), "5m-10m");
    testHeartbeatContent(new Date(now.getTime() - 720000), "10m+");
    testHeartbeatContent(new Date(now.getTime() - 7200000), "10m+");
  });

  it("should render last seen", function() {
    var host = {
      lastSeen: 0
    };
    var actual = DataTableColumnRenderer.renderLastSeen(host);
    var expected = "0";
    expect(actual).toEqual(expected);
  });

  it("should render number of cores", function() {
    var host = {
      numCores: 3
    };
    var actual = DataTableColumnRenderer.renderNumCores(host);
    var expected = "3";
    expect(actual).toEqual(expected);
  });

  it("should render disk usage", function() {
    var host = {
      space: {
        used: 3,
        total: 100
      }
    };
    var actual = DataTableColumnRenderer.renderDiskUsage(host);
    var expected = '<div class="CapacityUsage priorityLow"><span class="reading">3 B / 100 B</span><span class="bar" style="width: 3%;"></span><span class="hidden filterValue">priorityLow</span></div>';
    compareHTML(actual, expected);
  });

  it("should render load average", function() {
    var host = {
      loadAverage: [0.1, 0.2, 0.3]
    };
    var actual = DataTableColumnRenderer.renderLoadAverage(host);
    var expected = "<table class='innerTable'><tbody><tr><td>0.1</td><td>0.2</td><td>0.3</td></tr></tbody></table>";
    compareHTML(actual, expected);
  });

  it("should render physical memory", function() {
    var host = {
      physicalMemory: {
        used: 3,
        total: 100
      }
    };
    var actual = DataTableColumnRenderer.renderPhysicalMemory(host);
    var expected = '<div class="CapacityUsage priorityLow"><span class="reading">3 B / 100 B</span><span class="bar" style="width: 3%;"></span><span class="hidden filterValue">priorityLow</span></div>';
    compareHTML(actual, expected);
  });

  it("should render virtual memory", function() {
    var host = {
      virtualMemory: {
        used: 55,
        total: 100
      }
    };
    var actual = DataTableColumnRenderer.renderVirtualMemory(host);
    var expected = '<div class="CapacityUsage priorityMed"><span class="reading">55 B / 100 B</span><span class="bar" style="width: 55%;"></span><span class="hidden filterValue">priorityMed</span></div>';
    compareHTML(actual, expected);
  });

  it("should check match", function() {
    var value = "foobar";
    var filterValue = "bar";
    var exact = true;
    expect(DataTableColumnRenderer.match(value, filterValue, !exact)).toEqual(true);
    expect(DataTableColumnRenderer.match(value, filterValue, exact)).toEqual(false);
  });

  it("should set pagination", function() {
    var dataTableSettings = {};
    DataTableColumnRenderer.setPagination(dataTableSettings, true, 30);
    expect(dataTableSettings.sPaginationType).toEqual("full_numbers");
    expect(dataTableSettings.iDisplayLength).toEqual(30);
    expect(dataTableSettings.bPaginate).toEqual(true);
    expect(dataTableSettings.bLengthChange).toEqual(true);
  });

  it("should set pagination to false", function() {
    var dataTableSettings = {};
    DataTableColumnRenderer.setPagination(dataTableSettings, false, 30);
    expect(dataTableSettings.sPaginationType).toEqual(null);
    expect(dataTableSettings.iDisplayLength).toEqual(null);
    expect(dataTableSettings.bPaginate).toEqual(false);
    expect(dataTableSettings.bLengthChange).toEqual(true);
  });

  it("should render a link", function() {
    var text = "foo";
    var url = "http://www.example.com";
    var title = "dummyTitle";
    var actual = DataTableColumnRenderer.renderLink(url, text, title);
    var expected = '<a href="http://www.example.com" title="dummyTitle">foo</a>';
    compareHTML(actual, expected);
  });

  it("should render an actual maintenance mode icon", function() {
    var mm = {
      actual: true
    };
    var actual = DataTableColumnRenderer.renderMaintenanceMode(mm);
    var expected = 'Yes <span class="hidden">yes</span><span class="maintenanceIconActual16x16"></span>';
    compareHTML(actual, expected);
  });

  it("should render an effective maintenance mode icon", function() {
    var mm = {
      actual: false,
      effective: true
    };
    var actual = DataTableColumnRenderer.renderMaintenanceMode(mm);
    var expected = 'Yes <span class="hidden">yes</span><span class="maintenanceIconEffective16x16"></span>';
    compareHTML(actual, expected);
  });

  it("should render a maintenance mode empty string", function() {
    var mm = {
      actual: false
    };
    var actual = DataTableColumnRenderer.renderMaintenanceMode(mm);
    var expected = '<span class="hidden">no</span>';
    compareHTML(actual, expected);
  });

  it("should render a commission state column", function() {
    var cs = {
      text: "Decommissioned",
      tag: "commission-state-decommissioned"
    };
    var actual = DataTableColumnRenderer.renderCommissionState(cs);
    var expected = 'Decommissioned<span class="hidden">commission-state-decommissioned</span>';
    compareHTML(actual, expected);
  });

  it("should render a commission state column with no visible data", function() {
    var cs = {
      text: "Not Decommissioned",
      tag: "commission-state-commissioned"
    };
    var actual = DataTableColumnRenderer.renderCommissionState(cs);
    var expected = '<span class="hidden">commission-state-commissioned</span>';
    compareHTML(actual, expected);
  });


  it("should render nothing", function() {
    var aData = {};
    var p;
    for (p in DataTableColumnRenderer) {
      if (DataTableColumnRenderer.hasOwnProperty(p) && $.isFunction(DataTableColumnRenderer[p])) {
        if (p.indexOf("render") === 0) {
          var actual = DataTableColumnRenderer[p](aData);
          var expected = "";

          if (p === "renderHeartbeat") {
            // TODO: this should be translated.
            expected = "None";
          } else if (p === "renderCluster") {
            expected = '<span class="hidden">__orphan__</span>';
          }
          expect(actual + " " + p).toEqual(expected + " " + p);
        }
      }
    }
  });

  it("should render a pagination menu", function() {
    var actual = DataTableColumnRenderer.getPaginationMenu();
    var expected = 'Display <select class="pagination input-mini"><option value="10">10</option><option value="25">25</option><option value="50">50</option><option value="100">100</option><option value="250">250</option><option value="-1">All</option></select> Entries';
    compareHTML(actual, expected);
  });
});
});
