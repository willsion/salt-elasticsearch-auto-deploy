// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'cloudera/impala/ImpalaQueryDetails',
  'knockout'
], function(impalaQueryDetails, ko) {
  describe('ImpalaQueryDetails', function() {
    var $tabsContainer, $statementContainer, options,
      $queryDetailsContainer, $statement, $expandStatement, $collapseStatement,
      $fadeContainer, $tabContent, $tableOfContentsContainer;

    beforeEach(function() {
      $statement = $('<pre>Hello there how are you?</pre>')
        .appendTo(document.body);
      $tabsContainer = $('<div id="#testing-tab-container"/>').appendTo(document.body);
      $statementContainer = $('<div/>').appendTo(document.body);
      $queryDetailsContainer = $('<div/>').appendTo(document.body);
      $expandStatement = $('<div/>').appendTo(document.body);
      $collapseStatement = $('<div/>').appendTo(document.body);
      $fadeContainer = $('<div/>').appendTo(document.body);
      $tabContent = $('<div/>').appendTo(document.body);
      $tableOfContentsContainer = $('<div/>').appendTo(document.body);
      options = {
        queryDetailsContainer: $queryDetailsContainer,
        tabsContainer: $tabsContainer,
        statement: $statement,
        statementContainer: $statementContainer,
        expandStatement: $expandStatement,
        collapseStatement: $collapseStatement,
        fadeContainer: $fadeContainer,
        tabContent: $tabContent,
        tableOfContentsContainer: $tableOfContentsContainer
      };
    });

    afterEach(function() {
      $tabsContainer.remove();
      $statementContainer.remove();
      $statement.remove();
      $queryDetailsContainer.remove();
      $expandStatement.remove();
      $collapseStatement.remove();
      $fadeContainer.remove();
      $tabContent.remove();
      $tableOfContentsContainer.remove();
    });

    it('should highlight the query syntax', function() {
      $statement.text('select the catpants group by pants limit 10');
      impalaQueryDetails(options);
      var result = $statement.html();
      expect(result).toEqual(
        '<span class="keyword">select</span> the catpants ' +
        '<span class="keyword">group by</span> pants ' +
        '<span class="keyword">limit</span> 10');
    });

    it('should enable tooltips', function() {
      spyOn($.fn, 'tooltip');
      impalaQueryDetails(options);
      expect($.fn.tooltip).wasCalled();
    });

    it('should affix the table of contents correctly', function() {
      spyOn($.fn, 'affix');
      impalaQueryDetails(options);
      expect($.fn.affix).wasCalled();
      var args = $.fn.affix.mostRecentCall.args[0];
      expect(args).toBeDefined();
      expect(args.offset).toBeDefined();
      expect(args.offset.top).toBeDefined();
      var topFunc = args.offset.top;
      spyOn($.fn, 'position').andReturn({
        top: 42
      });
      var result = topFunc();
      expect(result).toEqual(42);
    });

    describe('statement collapse/expand', function() {
      it('should hide the fadeContainer by default', function() {
        spyOn($.fn, 'hide');
        impalaQueryDetails(options);
        expect($.fn.hide).wasCalled();
      });

      it('should enable if the statement is very long', function() {
        spyOn($.fn, 'hide');
        spyOn($.fn, 'show');
        // Set up the statement to trigger.
        $statement.css({
          'max-height': '5px',
          'overflow': 'hidden'
        });
        impalaQueryDetails(options);
        expect($.fn.hide).wasNotCalled();
        expect($.fn.show).wasCalled();
      });

      it('should toggle the collapsed class on expand/collapse click', function() {
        impalaQueryDetails(options);
        $expandStatement.trigger('click');
        expect($statementContainer.hasClass('collapsed')).toBeTruthy();
        $collapseStatement.trigger('click');
        expect($statementContainer.hasClass('collapsed')).toBeFalsy();
      });
    });
  });
});