// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/form/DisableAfterClickOnce"
], function(DisableAfterClickOnce) {
  /**
   * depends on bootstrap-model.
   * options {
   *   defaultVisible: true|false, // whether the dialog should be shown initially, default true.
   *   destroyOnClose: true|false, // whether closing the dialog should remove it from the DOM, default true.
   *   focusFooterButton: true|false, // whether to focus on any button in the footer area, defalt false.
   * }
   */
  $.fn.ModalDialogBase = function(options) {
    return this.each(function() {
      var $this = $(this);
      var opts = $.extend({}, $.fn.ModalDialogBase.defaults, options);

      if (opts.focusFooterButton) {
        $this.on('shown', function(){
          // first try focus any visible cancel or close buttons.
          $this.find(".modal-footer .dismissButton:visible").focus();
          // then try to focus on visible any primary buttons.
          $this.find(".modal-footer .btn-primary:visible").focus();
        });
      }

      if (opts.defaultVisible) {
        $this.modal();
      } else {
        $this.modal("hide");
      }
      if (opts.destroyOnClose) {
        // Remove on hide.
        // When user closes the dialog, we actually want to remove
        // it from the DOM. This is necessary when dealing with
        // dialogs that are AJAX.
        $this.on('hidden', function(){
          // We cannot remove the dialog immediately because
          // sometimes, we want to submit the form on the popup
          // itself, but that gets called after this function is
          // executed. So we have to delay the remove.
          setTimeout(function () {
            $this.remove();
          }, 50);
        });
      } else {
        // Do not remove this dialog. Instead, hide it.
        $this.find(".modal-footer .dismissButton").click(function(evt) {
          $this.modal("hide");
          if (evt) {
            evt.preventDefault();
          }
        });
        $this.find(".modal-header .close").click(function(evt) {
          $this.modal("hide");
          if (evt) {
            evt.preventDefault();
          }
        });
      }

      // Press enter routes to the first primary button.
      // When user presses the Enter key, we want to invoke
      // the click event of the first primary button.
      // TODO: make this optional.
      $this.keypress(function(evt) {
        var code = evt.keyCode || evt.which;
        // Prevent enter key from submitting the form.
        if (code === $.ui.keyCode.ENTER) {
          var $primaryButtons = $this.find(".modal-footer").find(".btn-primary:first");
          if ($primaryButtons.length > 0) {
            $primaryButtons.trigger('click');
            if (evt) {
              evt.preventDefault();
            }
          } else {
            var $buttons = $this.find(".modal-footer").find(".btn:first");
            if ($buttons.length > 0) {
              $buttons.trigger('click');
              if (evt) {
                evt.preventDefault();
              }
            }
          }
        }
      });

      $this.find("[data-disable-after-click-once=true]").DisableAfterClickOnce();
    });
  };
  $.fn.ModalDialogBase.defaults = {
    defaultVisible: true,
    destroyOnClose: true
  };
  return $.fn.ModalDialogBase;
});
