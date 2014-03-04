// (c) Copyright 2011-2013 Cloudera, Inc. All rights reserved.
define([
  'cloudera/form/RulesBuilder',
  'cloudera/headlamp/hdfs/include/FileSearchFilter'
], function(RulesBuilder, FileSearchFilter) {
  describe("FileSearchFilter Tests", function() {
    var module, id="fileSearchFilterContainer", rulesBuilderOptions = {
      rules : [],
      ruleChoices: [
        {"label":"Filename","name":"0","type":"string","units":""},
        {"label":"Owner","name":"1","type":"string","units":""},
        {"label":"Group","name":"2","type":"string","units":""},
        {"label":"Path","name":"3","type":"string","units":""},
        {"label":"Size (B)","name":"6","type":"numeric","units":""},
        {"label":"Diskspace Quota","name":"7","type":"numeric","units":""},
        {"label":"Namespace Quota","name":"8","type":"numeric","units":""},
        {"label":"File and Directory Count","name":"10","type":"numeric","units":""},
        {"label":"Replication","name":"11","type":"numeric","units":""},
        {"label":"Parent","name":"12","type":"string","units":""},
        {"label":"Raw Size (B)","name":"13","type":"numeric","units":""}
      ]
    };
    var cannedQueries = [ {
      id: "basic",
      label: "File or Directory Name",
      searchUrl: "/cmf/services/3/hdfs/search?path=%2F",
      queryTermsJson: '{"terms":[{"fileSearchType":0,"queryText":""}]}'
    }, {
      id: "underReplicatedFiles",
      label: "Files With Low Replication",
      searchUrl: "/cmf/services/3/hdfs/search?path=%2F",
      queryTermsJson: '{"terms":[{"fileSearchType":11,"endOfRange":3},{"fileSearchType":11,"startOfRange":1,"startInclusive":1}]}'
    }, {
      id: "dirsWithQuotas",
      label: "Directories with Quotas",
      searchUrl: "/cmf/services/3/quota/list?path=%2F",
      queryTermsJson: ''
    }, {
      id: "dirsWatched",
      label: "Directories Watched",
      searchUrl: "/cmf/services/3/watcheddir/list?path=%2F",
      queryTermsJson: ''
    }, {
      id: "advanced",
      label: "Custom",
      searchUrl: "/cmf/services/3/hdfs/search?path=%2F",
      queryTermsJson: '{"terms":[{}]}'
    } ];
    var options = {
      container: "#" + id,
      defaultQueryTerms: {
        "terms":[ ]
      },
      rulesBuilder: new RulesBuilder(rulesBuilderOptions),
      cannedQueries: cannedQueries
    };

    beforeEach(function() {
      $("<form>").attr("id", id).appendTo(document.body);
      $("#" + id).append('<div class="fileSearchBasic"></div>');
    });

    afterEach(function() {
      $("#" + id).remove();
    });

    it("should initialize FileSearchFilter", function() {
      module = new FileSearchFilter(options);
      expect(module.rulesBuilder.rules().length).toEqual(0);
      expect(module.selectedSearchOption()).toEqual("basic");
    });

    it("should test FileSearchFilter search basic", function() {
      module = new FileSearchFilter(options);
      spyOn(module, "changeFilter");
      module.cannedQueries()[0].click();
      module.getBasicSearchInput().val("Hello World");
      module.search();

      var searchUrl = '/cmf/services/3/hdfs/search?path=%2F';
      var queryTermsJson = '{"terms":[{"fileSearchType":0,"queryText":"*Hello World*"}]}';
      var searchMode = true;
      expect(module.changeFilter).wasCalledWith(searchUrl, queryTermsJson, searchMode);
    });

    it("should test FileSearchFilter search directory with under replication", function() {
      module = new FileSearchFilter(options);

      spyOn(module, "changeFilter");
      module.cannedQueries()[1].click();

      var searchUrl = '/cmf/services/3/hdfs/search?path=%2F';
      var queryTermsJson = '{"terms":[{"fileSearchType":11,"endOfRange":3,"endInclusive":false},{"fileSearchType":11,"startOfRange":1,"startInclusive":true}]}';
      var searchMode = true;
      expect(module.changeFilter).wasCalledWith(searchUrl, queryTermsJson, searchMode);
    });


    it("should test FileSearchFilter search directory with quotas", function() {
      module = new FileSearchFilter(options);

      spyOn(module, "changeFilter");
      module.cannedQueries()[2].click();

      var searchUrl = '/cmf/services/3/quota/list?path=%2F';
      var queryTermsJson = '';
      var searchMode = true;
      expect(module.changeFilter).wasCalledWith(searchUrl, queryTermsJson, searchMode);
    });

    it("should test FileSearchFilter search directory watched", function() {
      module = new FileSearchFilter(options);

      spyOn(module, "changeFilter");
      module.cannedQueries()[3].click();
      var searchUrl = '/cmf/services/3/watcheddir/list?path=%2F';
      var queryTermsJson = '';
      var searchMode = true;
      expect(module.changeFilter).wasCalledWith(searchUrl, queryTermsJson, searchMode);
    });

    it("should test FileSearchFilter advanced search", function() {
      module = new FileSearchFilter(options);

      spyOn(module, "changeFilter");
      module.cannedQueries()[4].click();
      expect(module.changeFilter).wasNotCalled();

      module.search();
      var searchUrl = '/cmf/services/3/hdfs/search?path=%2F';
      var queryTermsJson = '{"terms":[]}';
      var searchMode = false;

      expect(module.changeFilter).wasCalledWith(searchUrl, queryTermsJson, searchMode);
    });

    it("should publish a fileSearchFilterChanged event", function() {
      module = new FileSearchFilter(options);

      spyOn($, "publish");
      module.changeFilter("foo", "bar", true);
      expect($.publish).wasCalledWith("fileSearchFilterChanged", ["foo", "bar", true]);
    });

    it("should trigger search on key enter event", function() {
      module = new FileSearchFilter(options);

      spyOn(module, "search");
      var keypressEvt = jQuery.Event("keypress");
      keypressEvt.which = 13;
      module.getForm().trigger(keypressEvt);
      expect(module.search).wasCalled();
    });
  });
});
