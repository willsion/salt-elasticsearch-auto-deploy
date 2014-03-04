// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "underscore",
  "cloudera/TestUtil",
  "cloudera/Util",
  "cloudera/cmf/include/HostRoleColumnRenderer",
  "cloudera/common/spec/I18nSpec"
], function(_, TestUtil, Util, HostRoleColumnRenderer, I18nSpec) {

  describe("HostRoleColumnRenderer Tests", function() {
    function compareHTML(html1, html2) {
      var diffs = TestUtil.compareHTML(html1, html2);
      expect(diffs).toEqual([]);
    }

    if (window.resources === undefined) {
      window.resources = {};
    }

    it("should render Nameservices", function() {
      var host = {
        roles : [ {
          nameservice : "foo",
          roleType : "NAMENODE",
          displayType : "NameNode"
        }, {
          nameservice : "foo1",
          roleType : "NAMENODE",
          displayType : "NameNode"
        }]
      };
      var actual = HostRoleColumnRenderer.renderNameservices(host);
      var expected = '<span>foo (NameNode)</span><br><span>foo1 (NameNode)</span>';
      compareHTML(actual, expected);
    });

    it("should render no Nameservices", function() {
      var host = {
        roles : [ ]
      };
      var actual = HostRoleColumnRenderer.renderNameservices(host);
      var expected = '';
      expect(actual).toEqual(expected);
    });

    it("should render roles", function() {
      var host = {
        hostId : "7",
        roles : [ {
          nameservice : "foo",
          roleType : "NAMENODE",
          displayType : "NameNode"
        }, {
          nameservice : "foo1",
          roleType : "NAMENODE",
          displayType : "NameNode"
        }]
      };
      var actual = HostRoleColumnRenderer.renderRoles(host);
      var expected = '<div class="Toggler otherHeader" data-element-direction="next" data-element-selector="ul"><span>2 role(s)</span><i class="icon-chevron-right"></i></div><ul class="otherRoles" style="display: none;"><li>NameNode</li><li>NameNode</li></ul>';
      compareHTML(actual, expected);
    });

    it("should render 1 role", function() {
      var host = {
        hostId : "7",
        roles : [ {
          nameservice : "foo1",
          roleType : "NAMENODE",
          displayType : "NameNode"
        }]
      };
      var actual = HostRoleColumnRenderer.renderRoles(host);
      var expected = 'NameNode';
      expect(actual).toEqual(expected);
    });

    it("should render 0 roles", function() {
      var host = {
        hostId : "7",
        roles : [ ]
      };
      var actual = HostRoleColumnRenderer.renderRoles(host);
      var expected = 'None';
      expect(actual).toEqual(expected);
    });


    it("should render roleCount", function() {
      var host = {
        hostId : "7",
        roles : [ {
          nameservice : "foo1",
          roleType : "NAMENODE",
          displayType : "NameNode"
        }]
      };
      var actual = HostRoleColumnRenderer.renderRoleCount(host);
      var expected = 1;
      expect(actual).toEqual(expected);
    });

    var host1 = {
      hostId : "7",
      roles : [ {
        nameservice : "foo",
        roleType : "NAMENODE",
        displayType : "NameNode"
      }, {
        nameservice : "foo",
        roleType : "SECONDARYNAMENODE",
        displayType : "SecondaryNameNode"
      }]
    };

    it("should render checkboxes test 1", function() {
      var expected = '<input type="checkbox" name="hostIdsForJNs" value="7">';
      var actual = HostRoleColumnRenderer.renderJN(host1, "foo1", false);
      compareHTML(actual, expected);
    });

    it("should render checkboxes test2", function() {
      var host = {
        hostId: "7",
        roles : [ {
          roleType: "JOURNALNODE",
          displayType: "JournalNode"
        }]
      };
      // We already have a JN here.
      var expected = 'X';
      var actual = HostRoleColumnRenderer.renderJN(host, "foo1", false);
      compareHTML(actual, expected);
    });

    it("should render radio buttons test 1", function() {
      // Should not allow placing the same NN here.
      var expected = '';
      var actual = HostRoleColumnRenderer.renderANN(host1, "foo", true);
      compareHTML(actual, expected);
    });

    it("should render radio buttons test 2", function() {
      var expected = 'n/a';
      var actual = HostRoleColumnRenderer.renderSBN(host1, "foo", true);
      compareHTML(actual, expected);
    });

    it("should render radio buttons test 3", function() {
      // A SNN here
      var expected = '<input type="radio" name="hostIdForSNN" value="7">';
      var actual = HostRoleColumnRenderer.renderSNN(host1, "foo", false);
      compareHTML(actual, expected);
    });

    it("should render radio buttons test 4", function() {
      // We show reserved because this host has NN foo.
      var expected = 'n/a';
      var actual = HostRoleColumnRenderer.renderANN(host1, "bar", true);
      compareHTML(actual, expected);
    });

    it("should render radio buttons test 5", function() {
      // We show reserved because this host has NN foo.
      var expected = 'n/a';
      var actual = HostRoleColumnRenderer.renderSBN(host1, "bar", false);
      compareHTML(actual, expected);
    });

    it("should render radio buttons test 6", function() {
      var expected = 'n/a';
      var actual = HostRoleColumnRenderer.renderSNN(host1, "bar", false);
      compareHTML(actual, expected);
    });

    it("should render radio buttons test 7", function() {
      // We show reserved because this host has NN foo and foo1 already.
      var expected = 'n/a';
      var actual = HostRoleColumnRenderer.renderANN(host1, "foo2", true);
      compareHTML(actual, expected);
    });

    it("should render radio buttons test 8", function() {
      // We show reserved because this host has a NN.
      var expected = 'n/a';
      var actual = HostRoleColumnRenderer.renderSBN(host1, "foo1", true);
      compareHTML(actual, expected);
    });

    it("should render radio buttons test 9", function() {
      // We show reserved because this host has a SNN.
      var expected = 'n/a';
      var actual = HostRoleColumnRenderer.renderSNN(host1, "foo1", false);
      compareHTML(actual, expected);
    });

    var host2 = {
      hostId : "8",
      roles : [ {
        nameservice : "foo1",
        roleType : "SECONDARYNAMENODE"
      }]
    };

    it("should render radio buttons test 11", function() {
      // Should not allow placing a NN here.
      var expected = '';
      var actual = HostRoleColumnRenderer.renderANN(host2, "foo1", true);
      compareHTML(actual, expected);
    });

    it("should render radio buttons test 12", function() {
      // Can place a NN here because the SNN is getting removed.
      var expected = '<input type="radio" name="hostIdForSBN" value="8">';
      var actual = HostRoleColumnRenderer.renderSBN(host2, "foo1", true);
      compareHTML(actual, expected);
    });

    it("should render radio buttons test 13", function() {
      // Can place a SNN because this is the same one as the existing one.
      var expected = '<input type="radio" name="hostIdForSNN" value="8">';
      var actual = HostRoleColumnRenderer.renderSNN(host2, "foo1", false);
      compareHTML(actual, expected);
    });

    it("should render radio buttons test 14", function() {
      // We show reserved because this host has SNN foo1.
      var expected = '';
      var actual = HostRoleColumnRenderer.renderANN(host2, "bar", true);
      compareHTML(actual, expected);
    });

    it("should render radio buttons test 15", function() {
      // There is a SNN foo1 already, cannot place a SBN.
      var expected = '';
      var actual = HostRoleColumnRenderer.renderSBN(host2, "bar", false);
      compareHTML(actual, expected);
    });

    it("should render radio buttons test 16", function() {
      // There is a SNN foo1 already.
      var expected = 'n/a';
      var actual = HostRoleColumnRenderer.renderSNN(host2, "bar", false);
      compareHTML(actual, expected);
    });

    it("should render radio buttons test 17", function() {
      // No NN here, but placing a ANN is not allowed.
      var expected = '';
      var actual = HostRoleColumnRenderer.renderANN(host2, "foo1", true);
      compareHTML(actual, expected);
    });

    it("should render radio buttons test 18", function() {
      // Placing a SBN here is allowed.
      var expected = '<input type="radio" name="hostIdForSBN" value="8">';
      var actual = HostRoleColumnRenderer.renderSBN(host2, "foo1", true);
      compareHTML(actual, expected);
    });

    it("should render radio buttons test 18a", function() {
      // Can place a SBN because a SNN is here.
      var expected = 'n/a';
      var actual = HostRoleColumnRenderer.renderSBN(host2, "foo1", false);
      compareHTML(actual, expected);
    });

    it("should render radio buttons test 19", function() {
      // We show reserved because this host has a SNN.
      var expected = '<input type="radio" name="hostIdForSNN" value="8">';
      var actual = HostRoleColumnRenderer.renderSNN(host2, "foo1", false);
      compareHTML(actual, expected);
    });

    it("should render radio buttons test 19a", function() {
      // Can place a SNN here because the SNN is getting removed.
      var expected = 'n/a';
      var actual = HostRoleColumnRenderer.renderSNN(host2, "foo1", true);
      compareHTML(actual, expected);
    });


    var host3 = {
      hostId : "9",
      roles : [ ]
    };

    it("should render radio buttons test 21", function() {
      // Should not allow placing a NN here.
      var expected = '<input type="radio" name="hostIdForANN" value="9">';
      var actual = HostRoleColumnRenderer.renderANN(host3, "foo1", true);
      compareHTML(actual, expected);
    });

    it("should render radio buttons test 22", function() {
      // Can place a NN here because the SNN is getting removed.
      var expected = '<input type="radio" name="hostIdForSBN" value="9">';
      var actual = HostRoleColumnRenderer.renderSBN(host3, "foo1", true);
      compareHTML(actual, expected);
    });

    it("should render radio buttons test 23", function() {
      // Can place a SNN because this is the same one as the existing one.
      var expected = '<input type="radio" name="hostIdForSNN" value="9">';
      var actual = HostRoleColumnRenderer.renderSNN(host3, "foo1", false);
      compareHTML(actual, expected);
    });

    it("should render nothing", function() {
      var host = {};
      var p;
      for (p in HostRoleColumnRenderer) {
        if (HostRoleColumnRenderer.hasOwnProperty(p)
            && $.isFunction(HostRoleColumnRenderer[p]
            && p !== "renderAssignment")) {
          if (p.indexOf("render") === 0) {
            var actual = HostRoleColumnRenderer[p](host);
            var expected = "";
            if (p === "renderRoleCount") {
              expected = '0';
            }
            expect(actual).toEqual(expected);
          }
        }
      }
    });

    var host4 = {
      hostId : "8",
      roles : [ {
        nameservice : null,
        roleType : "SECONDARYNAMENODE"
      }]
    };

    it("should render radio buttons test 31", function() {
      // Can place a SBN because the SNN for the default nameservice was here.
      var expected = '<input type="radio" name="hostIdForSBN" value="8">';
      var actual = HostRoleColumnRenderer.renderSBN(host4, null, true);
      compareHTML(actual, expected);
    });

    var host5 = {
      hostId : "8",
      roles : [ {
        nameservice : null,
        roleType : "SECONDARYNAMENODE"
      }, {
        nameservice : null,
        roleType : "NAMENODE"
      }]
    };

    it("should render radio buttons test 32", function() {
      // Cannot place a SBN because the SNN for the default nameservice was here,
      // There is also a NN here.
      var expected = 'n/a';
      var actual = HostRoleColumnRenderer.renderSBN(host5, null, true);
      expect(actual).toEqual(expected);
    });

    it("should render radio buttons test33", function() {
      // Can place a JT because there is no JT on host5.
      var expected = '<input type="radio" name="hostIdForSBJT" value="8">';
      var actual = HostRoleColumnRenderer.renderSBJT(host5, null, true);
      compareHTML(actual, expected);
    });

    var host6 = {
      hostId : "9",
      roles : [ {
        nameservice : null,
        roleType : "JOBTRACKER"
      } ]
    };

    it("should render radio buttons test34", function() {
      // Can't place a JT because there is already a JT on host6.
      var expected = 'n/a';
      var actual = HostRoleColumnRenderer.renderSBJT(host6, null, true);
      compareHTML(actual, expected);
    });

    it("should render radio buttons test 35", function() {
      var expected = '<input type="radio" name="hostIdForANN" value="9">';
      var actual = HostRoleColumnRenderer.renderAssignment("ACTIVE_NAMENODE", host3, null, true);
    });

    it("should render radio buttons test 36", function() {
      var expected = '<input type="radio" name="hostIdForSBN" value="9">';
      var actual = HostRoleColumnRenderer.renderAssignment("STANDBY_NAMENODE", host3, null, true);
    });

    it("should render radio buttons test 37", function() {
      var expected = '<input type="radio" name="hostIdForSNN" value="9">';
      var actual = HostRoleColumnRenderer.renderAssignment("SECONDARY_NAMENODE", host3, null, true);
    });

    it("should render radio buttons test 38", function() {
      var expected = '<input type="radio" name="hostIdForJN" value="9">';
      var actual = HostRoleColumnRenderer.renderAssignment("JOURNALNODE", host3, null, true);
    });

    it("should render radio buttons test 39", function() {
      var expected = '<input type="radio" name="hostIdForSBJT" value="9">';
      var actual = HostRoleColumnRenderer.renderAssignment("STANDBY_JOBTRACKER", host3, null, true);
    });
  });
});
