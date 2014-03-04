// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/Util",
  "cloudera/common/Humanize",
  "cloudera/common/I18n",
  "cloudera/common/TimeUtil"
], function(Util, Humanize, I18n, TimeUtil) {

  return function(options) {

    function onTimeRangeChanged(range, isCurrentMode) {
      var startDate = range.startDate.getTime();
      var endDate = range.endDate.getTime();

      Util.text('logSearchStartTime', startDate);
      Util.text('logSearchEndTime', endDate);
    }

    onTimeRangeChanged(options);
    jQuery.subscribe("timeSelectionChanged", onTimeRangeChanged);

    /*
       Searches all logs in the given directory. Outputs either json or raw text.
       Includes the time taken to perform the search in the response as well as
       the host and port. Can filter log events by
       - time-interval given in ISO format, in local time for this machine.
       - directory where the logs are stored. (e.g. /var/log/hadoop)
       - log level (e.g. FATAL, WARN, DEBUG, INFO) default: WARN.
       - regular expression applied to text in the message section of the event
       - component / role (e.g. namenode, datanode, jobtracker, tasktracker)

       Full list of defaults in param='default' format:
       start='2011-05-01T08:00:00.000',
       end='2011-06-04T08:00:00.000',
       directory='/var/log/hadoop',
       level='WARN',
       components='namenode,datanode,jobtracker,tasktracker',
       query='',
       format='json' # or 'raw'
       */

    function getFormContent() {
      var content = jQuery('#logSearchForm').serializeArray();
      var filteredContent = [];
      var i;
      var roleids = [];
      for (i = 0; i < content.length; i++) {
        if (content[i].value) {
          if (content[i].name === "roleids") {
            roleids.push(content[i].value);
          } else {
            filteredContent.push(content[i]);
          }
        }
      }
      if (roleids.length > 0) {
        filteredContent.push({
          name: "roleids",
          value: roleids.join(",")
        });
      }
      content = null;
      return filteredContent;
    }

    function getSourceIsChartElem() {
      return $("#logSearchForm").find("input[name='sourceIsChart']");
    }

    function getButtonElem() {
      return $("#logSearchForm").find("button[type='submit']");
    }

    function getStatistic(path, data) {
      var hashes = jQuery.trim(path).split('.');
      var val = data;
      try {
        var i;
        for (i = 0; i < hashes.length; i++) {
          val = val[hashes[i]];
        }
      } catch (ex) {
        val = "";
      }
      return val;
    }

    function getStatisticAsNumber(path, data) {
      var result = getStatistic(path, data);
      try {
        result = parseInt(result, 10);
        if (!Util.isNumber(result)) {
          result = 0;
        }
      } catch (ex) {
        result = 0;
      }
      return result;
    }

    function updateStatistics(data, numFailed) {
      var $statsTable = jQuery("#logSearchStats");

      var endTime = TimeUtil.getServerNow().getTime();
      try {
        var startTime = parseInt(data.requestStartTime, 10);
        if (Util.isNumber(startTime)) {
          var rtt = endTime - startTime;
          $statsTable.find('.rtt')
          .text(rtt + ' ms');
        }
      } catch (ex) {}

      // These are the 'costs' properties in the 'data' object.
      // We currently only use some of them in the UI, so this is for the
      // sake of documentation.
      //    'costs.cpu.system',
      //    'costs.cpu.user',
      //    'costs.io.write.count',
      //    'costs.io.write.bytes',
      //    'costs.io.read.count',
      //    'costs.io.read.bytes',
      //    'costs.time',
      //    'costs.num'

      $statsTable.find(".cpuUser")
      .text(Util.secondsToMillis(getStatistic('costs.cpu.user', data)) + " ms");
      $statsTable.find(".cpuSystem")
      .text(Util.secondsToMillis(getStatistic('costs.cpu.system', data)) + " ms");
      $statsTable.find(".numResults")
      .text(getStatistic('results.length', data));
      $statsTable.find(".searched")
      .text(getStatistic('costs.num', data));
      $statsTable.find(".notSearched")
      .text(numFailed);
      $statsTable.find(".searchTime")
      .text(Util.secondsToMillis(getStatistic('costs.time', data)) + " ms");

      var totalIOs = getStatisticAsNumber('costs.io.write.count', data);
      totalIOs += getStatisticAsNumber('costs.io.read.count', data);

      $statsTable.find(".io")
      .text(totalIOs);

      $statsTable = null;
    }

    function resultsRequestCompleted(jqXHR, textStatus) {
      if (textStatus === "parsererror") {
        getButtonElem().removeAttr("disabled");
      }
    }

    function createLinkForHost (hostname) {
      return "/cmf/hardware/host?hostname=" + hostname;
    }

    function processResults(results, start, end, title) {
      jQuery('.LogResultsContainer .result').remove();

      var resultsEmpty = false;
      if (results.length === 0) {
        resultsEmpty = true;
        results.push({
          message: jQuery('#noResultsMessage').text(),
          source: '',
          time: '',
          role: '',
          loglevel: '',
          path: '',
          host: ''
        });
      }

      // hold count of number of WARN/DEBUG etc
      var numAtLevel = {},
      numPerHost = {};

      jQuery.each(results, function(index, result) {
        var n = jQuery('.resultTemplate').clone();

        numAtLevel[result.loglevel] = numAtLevel[result.loglevel] || 0;
        numAtLevel[result.loglevel]++;

        numPerHost[result.host] = numPerHost[result.host] || 0;
        numPerHost[result.host]++;

        var className;
        for (className in result) {
          var el = n.find('.' + className);
          if (el.length > 0)  {
            var value = result[className];

            if (className === 'path' && value) {
              var qs = jQuery.param({
                path: value,
                roleId: result.roleId,
                host: result.host,
                port: result.port,
                offset: result.offset
              });
              var href = '/cmf/process/all/logs/context?' + qs;
              n.find('.messageLink')
              .attr('href', href);
            } else if (className === 'host' && value) {
              el.html(result.host.link(createLinkForHost(result.host)));
            } else {
              if (className === 'message' || className === 'source') {
                value = jQuery.trim(value);
              }
              if (className === 'time' && value) {
                value = Humanize.humanizeDateTimeMedium(new Date(value));
              }
              if (className === 'message') {
                el.find("pre.message").text(value);
              } else {
                if (className === 'source') {
                  el.attr("title", value);
                  value = value.split(".");
                  value = value[value.length - 1];
                } else if (className === 'loglevel') {
                  el.addClass(value.toLowerCase());
                }
                el.text(value);
              }
            }
          }
          el = null;
        }

        n.removeClass('resultTemplate hidden')
        .addClass('result');
        jQuery('.resultTemplate')
        .parent()
        .append(n);
        n = null;
      });

      if (resultsEmpty) {
        results.pop();
        jQuery("#noResultsMessage").removeClass("hidden");
        jQuery(".LogResultsContainer")
        .find(".results")
        .addClass("hidden")
        .end().find(".resultsSummary").not("#noResultsMessage")
        .addClass("hidden");
      } else {
        jQuery("#noResultsMessage").addClass("hidden");
        jQuery(".LogResultsContainer")
        .find(".results")
        .removeClass("hidden")
        .end().find(".resultsSummary").not("#noResultsMessage")
        .removeClass("hidden");
      }

      return {
        numAtLevel: numAtLevel,
        numPerHost: numPerHost
      };
    }

    function updateChart(data) {
      if (getSourceIsChartElem().attr("checked")) {
        return;
      }
    }

    function getHostURL(hostname) {
      return "<a href='/cmf/hardware/host?hostname=" + hostname + "'>" + hostname + "</a>";
    }

    function getErrorTreeTableRow(hostname, parentID) {
      var result = "<tr class='child-of-" + parentID + "'><td>";
      result += getHostURL(hostname);
      result += "</td></tr>";
      return result;
    }

    function getErrorTreeTableHTML(hostsForMessage, j) {
      var tableHTML = [];
      tableHTML.push("<table class='logSearchErrorTable'><tbody>");
      var topID = "logSearchError" + j;
      tableHTML.push("<tr id='" + topID + "'><td class='errorHeaderRow'>");
      tableHTML.push(hostsForMessage.length + " hosts");
      tableHTML.push("</td></tr>");
      var groupSize = 50;
      var i;
      if (hostsForMessage.length <= groupSize) {
        for (i = 0; i < hostsForMessage.length; i += 1) {
          tableHTML.push(getErrorTreeTableRow(hostsForMessage[i], topID));
        }
      } else {
        for (i = 0; i < hostsForMessage.length; i += groupSize) {
          var subGroupID = topID + "subGroup" + i;
          tableHTML.push("<tr class='child-of-"+ topID + "' id='" + subGroupID + "'><td>");
          var endIndex = Math.min(hostsForMessage.length, (i + groupSize));
          tableHTML.push("Hosts " + (i + 1) + " - " + endIndex);
          tableHTML.push("</td></tr>");
          var k;
          for (k = i; k < endIndex; k += 1) {
            tableHTML.push(getErrorTreeTableRow(hostsForMessage[k], subGroupID));
          }
        }
      }
      tableHTML.push("</tbody></table>");
      return tableHTML.join("");
    }

    function getErrorSpanHTML(hostsForMessage, j) {
      var spanHTML;
      if (hostsForMessage.length > 1) {
        spanHTML = getErrorTreeTableHTML(hostsForMessage, j);
      } else {
        spanHTML = getHostURL(hostsForMessage[0]);
      }
      return spanHTML;
    }

    function showAgentErrors(messages) {
      var numFailed = 0;
      var message;
      jQuery(".LogSearchErrors").find(".logSearchError").remove();
      var j = 0;

      var ns = [];
      for (message in messages) {
        var n = jQuery(".logSearchErrorTemplate").clone();
        n.find(".message")
        .text(message);
        var hostsForMessage = messages[message];

        if (hostsForMessage && hostsForMessage.length > 0) {
          n.find(".hosts span")
          .append(getErrorSpanHTML(hostsForMessage, j));
        }
        n.removeClass("logSearchErrorTemplate hidden").addClass("logSearchError");
        ns.push(n.wrap("<span>").parent().html());
        numFailed += 1;
        j += 1;
        n = null;
      }
      jQuery(".logSearchErrorTemplate").parent().append(ns.join(""));
      jQuery(".logSearchErrorTable").treeTable({
        indent: 22
      });
      if (numFailed > 0) {
        jQuery(".LogSearchErrors").removeClass("hidden");
      } else {
        jQuery(".LogSearchErrors").addClass("hidden");
      }
      return numFailed;
    }

    function resultsRequestSuccess(data, textStatus, jqXHR) {
      jQuery("#logSearchForm").find(".IconSpinner24x24").addClass("hidden");
      getButtonElem().removeAttr("disabled");
      if (textStatus === "success") {
        jQuery(".LogResultsContainer")
        .removeClass("hidden");
        var start = jQuery('#logSearchStartTime').val();
        var end = jQuery('#logSearchEndTime').val();
        //TODO: I18n, fix concatenation.
        var numResults = getStatistic('results.length', data);
        var title = numResults + " " + data.localizedTitle;
        var chartData = processResults(data.results, start, end, title);
        if (numResults > 0) {
          updateChart(chartData);
        }
        var numFailed = showAgentErrors(data.messages);
        updateStatistics(data, numFailed);

        // ----- pagination code ------
        // stack of timestamps for the previous button
        var prevResultsTimes;
        if (jQuery('#prevResultsTimestamps').text() === "") {
          prevResultsTimes = [];
        } else {
          prevResultsTimes = jQuery('#prevResultsTimestamps').text().split(',');
        }

        // timestamp for what we just received
        var currentPageResponseStamp = data.currentPageStartTime + "@" + data.currentPageOffset;

        // If what we just received looks exactly like our next, then we should disable the next button.
        if (currentPageResponseStamp === jQuery("#nextResultsTimeStamp").text()) {
          jQuery(".LogPaginationLinks .nextLink").addClass("disabled");
        }

        if(prevResultsTimes.length > 0 && currentPageResponseStamp === prevResultsTimes[prevResultsTimes.length-1]) {
          // if it matches the top of the stack this was a result of clicking the previous button
          prevResultsTimes.pop();
          if (prevResultsTimes.length < 1) {
            jQuery(".LogPaginationLinks .prevLink").addClass("disabled");
          }
        }
        else if(jQuery('#currentResultsTimestamp').text() !== "") {
          // this is not a first page, push the timestamp on the prevResultsTimestamps stack
          var crts = jQuery('#currentResultsTimestamp').text();
          prevResultsTimes.push(crts);
          jQuery(".LogPaginationLinks .prevLink").removeClass("disabled");
        }
        jQuery('#prevResultsTimestamps').text(prevResultsTimes.join(","));

        if(data.nextPageStartTime !== null) {
          // results have more pages
          var npst = data.nextPageStartTime;
          jQuery('#nextResultsTimestamp').text(npst + "@" + data.nextPageOffset);
          jQuery('#currentResultsTimestamp').text(data.currentPageStartTime + "@" + data.currentPageOffset);
          jQuery(".LogPaginationLinks .nextLink").removeClass("disabled");
        } else {
          jQuery(".LogPaginationLinks .nextLink").addClass("disabled");
        }

      }
    }

    function onSearch(e) {
      var params = getFormContent();
      params.push({
        name: 'requestStartTime',
        value: TimeUtil.getServerNow().getTime()
      });
      params = jQuery.param(params);

      if (!(getSourceIsChartElem().attr("checked"))) {
        jQuery("#logChart").find("*").remove();
      }
      jQuery("#logSearchForm").find(".IconSpinner24x24").removeClass("hidden");
      jQuery.ajax('/cmf/process/all/logs/search/api', {
        dataType: 'json',
        data: params,
        success: resultsRequestSuccess,
        complete: resultsRequestCompleted,
        type: 'POST'
      });
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      return false;
    }

    function onSubmit(e) {
      if (jQuery("#logSearchForm").valid()) {
        // new search, clear pagination state
        jQuery('#logSearchOffset').val("0");
        jQuery("#prevResultsTimestamps").text("");
        jQuery("#nextResultsTimestamp").text("");
        jQuery("#currentResultsTimestamp").text("");
        jQuery(".LogPaginationLinks a").addClass("disabled");
        getButtonElem().attr("disabled", "disabled");
        jQuery(".LogResultsContainer").addClass("hidden");
        onSearch(e);
      }
    }

    function onKeyPress(e) {
      if (e.which === 13) {
        onSubmit(e);
      }
    }


    function serializeChartData(data) {
      var result = {
        keys: [],
        values: []
      };
      var key;
      for (key in data) {
        result.keys.push(key);
        result.values.push(data[key]);
      }
      result.keys = result.keys.join(",");
      result.values = result.values.join(",");
      return result;
    }

    function hostCountsDescending(a, b) {
      return a[1] < b[1];
    }

    function bucketData(data, numBuckets) {
      var resultArr = [];
      var key;
      for (key in data) {
        resultArr.push([key, data[key]]);
      }

      resultArr.sort(hostCountsDescending);

      var otherCount = 0;
      while (resultArr.length > numBuckets) {
        var item = resultArr.pop();
        otherCount += item[1];
      }
      if (otherCount > 0) {
        resultArr.push([I18n.t("ui.other"), otherCount]);
      }

      var result = {};
      var i;
      for (i = 0; i < resultArr.length; i++) {
        key = resultArr[i][0];
        result[key] = resultArr[i][1];
      }
      return result;
    }


    function pointSelected (e) {
      var type = e.data.Series.Name;
      var value = e.data.Attributes.paramName;
      getSourceIsChartElem().attr("checked", "checked");
      if (type === "level") {
        jQuery("#level option").removeAttr("selected");
        jQuery("#level option[value='" + value +"']").attr("selected", "selected");
      } else if (type === "host") {
        jQuery("#hostNames").val(value);
      }
      onSubmit(null);
    }


    function hostCountsComparator(a, b) {
      return a[1] < b[1];
    }

    function insertHostCount (index, tuple) {
      var n = jQuery('.numEventPerHostTemplate').clone();
      var hostname = tuple[0],
      num = tuple[1];

      n.find('.host')
      .text(num);

      var link = n.find('.link');
      link.text(hostname);
      link.href = createLinkForHost(hostname);

      n.removeClass('numEventPerHostTemplate hidden')
      .addClass('child');
      jQuery('.numEventPerHostTemplate')
      .parent()
      .append(n);

      link = null;
      n = null;
    }

    function insertHostCounts(numPerHost) {
      var hosts = [];

      jQuery('.numEventPerHost .child').remove();

      var host;
      for (host in numPerHost) {
        hosts.push([host, numPerHost[host]]);
      }
      hosts = hosts.sort(hostCountsComparator);
      jQuery.each(hosts, insertHostCount);
    }

    function setFormInput(contentForID, id) {
      var el = jQuery('#' + id);
      if (id === 'level' || id === 'roletypes') {
        // uncheck all
        el.find(':checked')
        .removeProp('checked');

        if (contentForID) {
          jQuery.each(contentForID.toLowerCase().split(','), function(index, inputId){
            jQuery('#' + inputId).prop('checked', true);
          });
        }
      } else {
        el.val(contentForID);
      }
      el = null;
    }

    function setFormContent(content) {
      // sets the contents of each of these ids
      var ids = ['level', 'roletypes', 'query'];
      var i;
      for (i = 0; i < ids.length; i++) {
        setFormInput(content[ids[i]], ids[i]);
      }
      return content;
    }


    function getNextPage (e) {
      var nextParams = jQuery('#nextResultsTimestamp').text().split( "@" );
      jQuery('#logSearchStartTime').val(nextParams[0]);
      jQuery('#logSearchOffset').val(nextParams[1]);
      // NOTE: timecontrol should not autoupdate when a user clicks
      onSearch(e);
    }

    function getPrevPage (e) {
      var prevParamsStack = jQuery('#prevResultsTimestamps').text().split(",");
      var prevParams = prevParamsStack[prevParamsStack.length-1].split( "@" );
      jQuery('#logSearchStartTime').val(prevParams[0]);
      jQuery('#logSearchOffset').val(prevParams[1]);
      // NOTE: timecontrol should not autoupdate when a user clicks
      onSearch(e);
    }

    function paginationLinkClicked (e) {
      var $target = jQuery(e.target);

      // Find the ancestor prev/next link element.
      if (!$target.is(".LogPaginationLinks a")) {
        $target = $target.closest("a");
      }

      // Do nothing if it is disabled.
      if ($target.hasClass("disabled")) {
        if (e) {
          e.preventDefault();
        }
      } else if ($target.hasClass("prevLink")) {
        getPrevPage(e);
      } else if ($target.hasClass("nextLink")) {
        getNextPage(e);
      }
    }

    function setSelectAllCheckboxState() {
      var $rowsWithIDs = jQuery("#servicesAndRoles tr").filter(function(index) {
        return jQuery(this).attr("id");
      });
      var $checkedRows = $rowsWithIDs.filter(function(index) {
        return jQuery(this).find("input[type='checkbox']").attr("checked");
      });
      Util.setCheckboxState(jQuery("#logSearchSelectAll"), $checkedRows.length === $rowsWithIDs.length);
      $rowsWithIDs = null;
      $checkedRows = null;
    }

    function checkboxClicked (event){
      var $target = jQuery(event.target);
      var id = $target.closest("tr").attr("id");
      var containerSelector = "#logSearchForm";
      if (id) {
        var $otherCheckboxes = jQuery("#logSearchForm").find(".child-of-" + id).find("input[type='checkbox']");
        Util.setCheckboxState($otherCheckboxes, $target.attr("checked"));
        $otherCheckboxes = null;
      } else {
        var classes = $target.closest("tr").attr("class").split(/\s+/);
        var i;
        for (i = 0; i < classes.length; i++) {
          if (classes[i]) {
            var matchIndex = classes[i].search(/^child-of-/);
            if (matchIndex === 0) {
              var parentID = classes[i].replace(/^child-of-/, "");
              var numUnselectedCheckboxes =
                jQuery(containerSelector)
              .find("." + classes[i])
              .find("input[type='checkbox']")
              .not(":checked")
              .length;
              Util.setCheckboxState(jQuery("#" + parentID).find("input[type='checkbox']"), numUnselectedCheckboxes === 0);
              break;
            }
          }
        }
      }
      setSelectAllCheckboxState();
      $target = null;
    }

    function selectAllClicked (event) {
      var $target = jQuery(event.target);
      var $otherCheckboxes = jQuery("#logSearchForm input[type='checkbox']").not($target);
      Util.setCheckboxState($otherCheckboxes, $target.attr("checked"));
      $otherCheckboxes = null;
      $target = null;
    }


    function searchClicked(e) {
      getSourceIsChartElem().removeAttr("checked");
      onSubmit(e);
    }

    function split( val ) {
      return val.split( /,\s*/ );
    }

    function extractLast( term ) {
      return split( term ).pop();
    }


    getButtonElem().click(searchClicked)
    .end().find("input[type='text']").keypress(onKeyPress)
    .end();
    $("#logSearchForm").validate();

    $("#logSearchSelectAll").click(selectAllClicked);
    $("#logSearchForm input[type='checkbox']").not("#logSearchSelectAll").click(checkboxClicked);
    $(".LogResultsContainer").find(".LogPaginationLinks").click(paginationLinkClicked);
    $( "#hostNames" )
    // don't navigate away from the field on tab when selecting an item
    .bind( "keydown", function( event ) {
      if ( event.keyCode === $.ui.keyCode.TAB &&
          $( this ).data( "autocomplete" ).menu.active ) {
        event.preventDefault();
      }
    })
    .autocomplete({
      source: function( request, response ) {
        $.ajax({
          url: options.autocmpPath,
          dataType: "json",
          data: {
            type: "hostName",
            prefix: extractLast( request.term ),
            num: "20"
          },
          success: function( data ) {
            response( $.map( data.suggestions, function( item ) {
              return {
                label: item,
                value: item
              };
            }));
          }
        });
      },
      search: function() {
        //custom minLength
        var term = extractLast( this.value );
        if ( term.length < 2 ) {
          return false;
        }
      },
      focus: function() {
        //prevent value inserted on focus
        return false;
      },
      select: function( event, ui ) {
        var terms = split( this.value );
        //remove the current input
        terms.pop();
        //add the selected item
        terms.push( ui.item.value );
        //add placeholder to get the comma-and-space at the end
        terms.push( "" );
        this.value = terms.join( ", " );
        return false;
      }
    });
    if (options.searchOnLoad) {
      onSearch();
    }
  };
});
