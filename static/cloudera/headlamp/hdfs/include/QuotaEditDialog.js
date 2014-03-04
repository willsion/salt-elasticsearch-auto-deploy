// Copyright (c) 2012 Cloudera, Inc.  All rights reserved.
define([
  "cloudera/headlamp/hdfs/quota/Quota",
  "cloudera/common/I18n",
  "knockout"
], function(Quota, I18n, ko) {

  /**
   * Controls the Edit Quota Dialog.
   * options = {
   *   tableId: "the ID of the main table.",
   *   setQuotaUrl: "the URL for setting the quota"
   * }
   */
  return function(options) {
    var self = this;
    self.viewModel = new Quota();

    var getDialog = function() {
      return $("#quotaEdit");
    };

    var openDialog = function(addOrEdit) {
      getDialog().modal("show");
    };

    var closeDialog = function() {
      getDialog().modal("hide");
    };

    var getTable = function() {
      return $("#" + options.tableId);
    };

    /**
     * A FileSearchResult data is rendered (hidden) in the row.
     */
    var getDataFromRow = function($row) {
      var dataStr = $row.find(".data").text();
      return $.parseJSON(dataStr);
    };

    self.updateTableRow = function(quotaJson) {
      try {
        var $table = getTable();
        var $lastQuotaRow = $.data($table[0], "lastQuotaRow");
        var $oTable = $table.dataTable();

        // Get the position of the current data from the node
        var aPos = $oTable.fnGetPosition( $lastQuotaRow[0] );
        // Get the data array for this row
        var aData = $oTable.fnGetData( aPos );

        // need the current index'ed values, merge with the old JSON
        // data.
        aData = $.merge(aData, getDataFromRow($lastQuotaRow));

        // update.
        aData.diskspaceQuota = quotaJson.dsLimit;
        aData.namespaceQuota = quotaJson.nsLimit;
        $oTable.fnUpdate(aData, aPos, 0);
      } catch (ex) {
        console.log(ex);
      }
    };

    self.viewModel.saveQuota = function() {
      // Need to blur the input field, or else knockout won't
      // see the change.
      getDialog().find("button:eq(0)").focus();
      var quotaJson = self.viewModel.toJSON();
      var onSetSuccess = function(response) {
        if (response === "OK") {
          self.updateTableRow(quotaJson);
        } else {
          $.publish("showError", [response]);
        }
        closeDialog();
      };

      if (getDialog().find("form").valid()) {
        var urlParams = {
          data : JSON.stringify(quotaJson)
        };
        $.post(options.setQuotaUrl, urlParams, onSetSuccess);
      }
    };

    var onKeypressedInSearchFilter = function(evt) {
      var code = evt.keyCode || evt.which;
      // if user pressed enter, triggers the search button.
      if ($.ui.keyCode.ENTER === code) {
        self.viewModel.saveQuota();
      }
    };

    /**
     * Handles when the table is clicked.
     */
    getTable().click(function(evt) {
      var $target = $(evt.target);
      if ($target.is(".manageQuota") || $target.find(".manageQuota").length > 0) {
        self.viewModel.readValue(getDataFromRow($target.closest("tr")));
        openDialog();
        if (evt) {
          evt.preventDefault();
        }
        $.data($(this)[0], "lastQuotaRow", $target.closest("tr"));
      }
    });

    try {
      getDialog().find("form")
        .keypress(onKeypressedInSearchFilter)
        .validate({
          rules: {
            nsLimit: {
              min: 1
            },
            dsLimit: {
              min: 1
            }
          }
        });
    } catch (ex1) {
      console.log(ex1);
    }

    try {
      ko.applyBindings(self.viewModel, getDialog()[0]);
    } catch (ex2) {
      console.log(ex2);
    }
  };
});
