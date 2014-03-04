// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/charts/Plot',
  'cloudera/cmf/charts/Facets',
  'cloudera/common/spec/I18nSpec'
], function(Plot, Facets, I18nSpec) {
  describe("Facets Tests", function() {
    var timeSeriesArray = [ {
      data: [{x:1,y:1}],
      metadata: {
        entityDisplayName: "datanode1",
        metricDisplayName: "m1",
        attributes: {
          "roleType": "DATANODE"
        }
      }
    }, {
      data: [{x:1,y:1}],
      metadata: {
        entityDisplayName: "datanode2",
        metricDisplayName: "m1",
        attributes: {
          "hostName": "localhost",
          "roleType": "DATANODE"
        }
      }
    }, {
      data: [{x:1,y:1}],
      metadata: {
        entityDisplayName: "namenode1",
        metricDisplayName: "m1",
        attributes: {
          "hostName": "localhost",
          "roleType": "NAMENODE",
          "serviceType": "HDFS"
        }
      }
    } ];

    function check(facetsData) {
      expect(facetsData.length).toEqual(5);
      expect(facetsData[0].name).toEqual("entityDisplayName");
      expect(facetsData[0].counts.length).toEqual(3);
      expect(facetsData[0].counts[0].value).toEqual("datanode1");
      expect(facetsData[0].counts[0].count).toEqual(1);
      expect(facetsData[0].counts[1].value).toEqual("datanode2");
      expect(facetsData[0].counts[1].count).toEqual(1);
      expect(facetsData[0].counts[2].value).toEqual("namenode1");
      expect(facetsData[0].counts[2].count).toEqual(1);
      expect(facetsData[1].name).toEqual("roleType");
      expect(facetsData[1].counts.length).toEqual(2);
      expect(facetsData[1].counts[0].value).toEqual("DATANODE");
      expect(facetsData[1].counts[0].count).toEqual(2);
      expect(facetsData[1].counts[1].value).toEqual("NAMENODE");
      expect(facetsData[1].counts[1].count).toEqual(1);
      expect(facetsData[2].name).toEqual("hostName");
      expect(facetsData[2].counts.length).toEqual(1);
      expect(facetsData[2].counts[0].value).toEqual("localhost");
      expect(facetsData[2].counts[0].count).toEqual(2);
      expect(facetsData[3].name).toEqual("metricDisplayName");
      expect(facetsData[3].counts.length).toEqual(1);
      expect(facetsData[3].counts[0].value).toEqual("m1");
      expect(facetsData[3].counts[0].count).toEqual(3);
      expect(facetsData[4].name).toEqual("serviceType");
      expect(facetsData[4].counts.length).toEqual(1);
      expect(facetsData[4].counts[0].value).toEqual("HDFS");
      expect(facetsData[4].counts[0].count).toEqual(1);
    }

    it("should compute the facets the new way", function() {
      var facets = new Facets({
        plot: {}
      });
      var facetsData = facets.computeFacets(timeSeriesArray);

      check(facetsData);
    });

    it("should update the facets", function() {
      var facetsModule = new Facets({
        plot: {}
      });
      var facetsData = facetsModule.update(timeSeriesArray);

      // + 2 because we have two default facets.
      expect(facetsModule.facets().length).toEqual(5 + 2);
      expect(facetsModule.facets()[0].displayName()).toEqual("All Separate");
      expect(facetsModule.facets()[1].displayName()).toEqual("entityDisplayName");
      expect(facetsModule.facets()[2].displayName()).toEqual("roleType");
      expect(facetsModule.facets()[3].displayName()).toEqual("hostName");
      expect(facetsModule.facets()[4].displayName()).toEqual("metricDisplayName");
      expect(facetsModule.facets()[5].displayName()).toEqual("serviceType");
      expect(facetsModule.facets()[6].displayName()).toEqual("All Combined");

      spyOn($, 'publish');
      facetsModule.facets()[0].click();
      expect($.publish).wasCalledWith("clickFacetGroup", [Plot.FACETTING_NONE]);
      facetsModule.facets()[2].click();
      expect($.publish).wasCalledWith("clickFacetGroup", ["roleType"]);
    });

    it("should handle the empty case too", function() {
      var facetsModule = new Facets({
        plot: {}
      });
      var facetsData = facetsModule.update([ {
        data: [{x:1, y:1}],
        metadata: {}
      } ]);

      var facets = facetsModule.facets();
      expect(facets.length).toEqual(0);
    });

    it("should handle empty metadata too", function() {
      var facetsModule = new Facets({
        plot: {}
      });
      var facetsData = facetsModule.update([ {
        data: [{x:1, y:1}]
      } ]);

      var facets = facetsModule.facets();
      expect(facets.length).toEqual(0);
    });

    it("should handle empty input timeSeries array", function() {
      var facetsModule = new Facets({
        plot: {}
      });
      var facetsData = facetsModule.update([]);
      var facets = facetsModule.facets();
      expect(facets.length).toEqual(0);
    });

    it("should set the selected facet", function() {
      var selector = new Facets({
        plot: {facetting: "clusterId"}
      });
      
      spyOn($, "publish");
      selector.selectedFacet("hostname");
      expect($.publish).wasCalledWith("clickFacetGroup", ["hostname"]);
    });

  });
});
