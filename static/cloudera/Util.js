// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/common/Humanize",
  "underscore"
], function(Humanize, _) {

// returns an object, no instantiation required.
return {
throttle: function(fn, delay, context) {
  var timer = null;
  return function () {
    if (!context) {
      context = this;
    }
    var args = arguments;
    clearTimeout(timer);
    timer = setTimeout(function () {
      fn.apply(context, args);
    }, delay);
  };
},

/**
 * @return all the chart colors defined by the design library.
 */
getChartColors: function() {
  return ["#007DC4", "#419E08", "#FB950D", "#CE151D", "#572B91", "#049D84", "#005C91", "#285D07", "#774400", "#81070C", "#311851", "#045144"];
},

/**
 * @return a specific chart color.
 * @param index - which color to retrieve.
 */
getChartColor: function(index) {
  var colors = this.getChartColors();
  return colors[index % colors.length];
},

/**
 * @return a color based on the hashcode of the input name parameter.
 * A given input name will always result a specific color.
 */
getColor: function(name) {
  /* defined by the visual design library. */
  var colors = this.getChartColors();
  var prime = 31;
  var result = 1;
  var i;
  for (i = 0; i < name.length; ++i) {
    result = (prime * result + name.charCodeAt(i)) % colors.length;
  }
  return this.getChartColor(result);
},

/**
 * @return a greyscale color based on the hashcode of the input name parameter.
 * A given input name will always result a specific greyscale value.
 */
getGreyColor: function(name) {
  /* defined by the visual design library. */
  var colors = ["#000000", "#333333", "#666666", "#999999"];
  var prime = 31;
  var result = 1;
  var i;
  for (i = 0; i < name.length; ++i) {
    result = (prime * result + name.charCodeAt(i)) % colors.length;
  }
  return colors[result % colors.length];
},

// Use `text` to set an element's `innerHTML` and `value` when used like so,
// similar to jQuery's $('#id').text(...);
//
// text(node, 'hello');
// => node
//
// Or use it to get that node's innerHTML or value:
// text(paragraphWrapperNode)
// => <p></p>
//
// text(checkedCheckBoxNode);
// => true
text: function(node, text) {
  if (!node) {
    return false;
  }
  if (typeof(node) === "string") {
    node = jQuery("#" + node);
  } else {
    node = jQuery(node);
  }
  if (!node) { return false; }

  if (text !== undefined) {
    try {
      node.html(text);
    } catch (ex1) {}
    try {
      node.val(text);
    } catch (ex2) {}
    return node;
  } else {
    return node.html() || node.val();
  }
},

// takes a dash separated word and converts it to camelcase
// dashedToCamel('hello-there')
// => 'helloThere'
dashedToCamel: function(dashedWord) {
  var camel =
    jQuery.map(dashedWord.split('-'), function(h, i) {
      if (i === 0) { return h; }
      return h.substring(0, 1).toUpperCase()
        + h.substring(1, h.length);
    }).join('');
  return camel;
},

// Compares two numbers a and b. Handy to use in your sort function.
// Returns 1 if a is greater than b,
// returns -1 if a is less than b
// returns 0 if they are equal.
//
// Sort ascending:
// [1,3,2].sort(this.compare) //=> [1,2,3]
// Sort descending:
// [1,3,2].sort(function(a,b) {
//   return -1 * this.compare(a, b);
// }); //=> [3,2,1]
compare: function(a, b) {
  if (a > b) {
    return 1;
  } else if (a < b) {
    return -1;
  }
  return 0;
},

/**
 * Filters out all common AJAX errors and perform appropriate handling.
 */
filterError: function(response) {
  if (typeof response === 'string') {
    if (response.indexOf("ExceptionReport") !== -1) {
      // Display the region content in a popup.
      var content = jQuery(response).find(".ExceptionReport");
      jQuery.publish("showError", [content.html()]);
      return "";
    } else if (response.indexOf("<form class=\"LoginForm well\"") !== -1) {
      // Refresh the current page.
      // This should redirect to the login screen.
      this.reloadPage();
    }
  }
  return response;
},

filterJsonResponseError: function(response) {
  try {
    if (_.isString(response)) {
      var filteredResponse = this.filterError(response);
      filteredResponse = $.parseJSON(filteredResponse);
      if (filteredResponse) {
        return filteredResponse;
      } else {
        return {};
      }
    } else if (_.isObject(response)) {
      return response;
    }
  } catch (ex) {
    console.log(ex);
  }
  return {};
},

secondsToMillis: function(stringInSeconds) {
  var result = jQuery.trim(stringInSeconds);
  try {
    result = parseFloat(result);
    if (!isFinite(result)) {
      result = jQuery.trim(stringInSeconds).replace(".", "").replace(/^0+/, '');
      return result;
    }
    result = result * 1000;
    result = result.toFixed();
  } catch (ex) {
    result = jQuery.trim(stringInSeconds).replace(".", "").replace(/^0+/, '');
  }
  return result;
},

isNumber: function(value) {
  return typeof(value) === 'number' && isFinite(value);
},

severity2Color: function(severity) {
  // These colors are also defined in mixins.less
  if (severity === "2" || severity === "INFORMATIONAL") {
    return "#CEDFE1";
  } else if (severity === "3" || severity === "WARN" || severity === "IMPORTANT") {
    return "#FADC7C";
  } else if (severity === "4" || severity === "FATAL" || severity === "ERROR" || severity === "CRITICAL") {
    return "#FF3F3C";
  } else {
    return "#F1F1F1";
  }
},

/**
 * This performs the inverse of jQuery.param.
 *
 * The generalized form of this method is more complicated than this.
 *
 * TODO: replace this method with a more generalized form, e.g.
 * See: http://stackoverflow.com/questions/1131630/javascript-jquery-param-inverse-function
 */
unparam: function(queryParams) {
  var ret = {};
  var nvs = queryParams.replace(/\+/g, ' ').split("&");
  jQuery(nvs).each(function(i, nv) {
    var eqPos = nv.indexOf("=");
    if (eqPos !== -1) {
      var name = decodeURIComponent(nv.substring(0, eqPos));
      var value = decodeURIComponent(nv.substring(eqPos + 1));
      ret[name] = value;
    }
  });
  return ret;
},

setCheckboxState: function(checkbox, isChecked) {
  var $checkbox = jQuery(checkbox);
  if (isChecked) {
    $checkbox.attr("checked", "checked");
  } else {
    $checkbox.removeAttr("checked");
  }
},

ensureDefined: function(value) {
  // TODO: merge this into a single object closure.
  // and use isDefined instead.
  if (value !== null && value !== undefined) {
    return value;
  }
  return "";
},

isDefined: function(value) {
  return value !== null && value !== undefined;
},

setCookie: function(c_name, value, exdays) {
  var exdate = new Date();
  exdate.setDate(exdate.getDate() + exdays);
  var c_value=window.escape(value) + ((exdays === undefined) ? "" : "; expires="+exdate.toUTCString());
  document.cookie=c_name + "=" + c_value;
},

truncate: function(text, length) {
  if (text && text.length > length) {
    return text.substr(0, length) + "...";
  } else {
    return text;
  }
},

convertIfNumber: function(value) {
  //(NaN == NaN) is false
  if (jQuery.isNumeric(value)) {
    return Number(value);
  }  
  return value;
},

compareDates: function(date1, date2) {
  if (date1 && !date2) {
    return 1;
  } else if (!date1 && date2) {
    return -1;
  } else {
    return date1.getTime() - date2.getTime();
  }
},

setLocale: function(locale) {
  window._locale = locale;
  if (moment) {
    // default to English first.
    moment.lang("en");
    moment.lang(this.toMomentLanguage(locale));
  }
  if ($.datepicker) {
    $.datepicker.setDefaults($.datepicker.regional[this.toDatePickerLanguage(locale)]);
    $.timepicker.setDefaults($.timepicker.regional[this.toDatePickerLanguage(locale)]);
  }
},

setTestMode: function(value) {
  window._testMode = value;
},

getTestMode: function() {
  return window._testMode === true;
},

toMomentLanguage: function (locale) {
  // moment named a few language files
  // that look different from the locale.
  // Need to convert.
  var mapping = {
    "ko": "kr",
    "ko_KR": "kr",
    "ja": "jp",
    "ja_JP": "jp",
    "zh_CN": "zh-cn",
    "zh_TW": "zh-tw",
    "en_GB": "en-gb"
  };

  if (mapping[locale]) {
    return mapping[locale];
  } else {
    return this.toLowerCaseLanguage(locale);
  }
},

toDatePickerLanguage: function (locale) {
  var mapping = {
    "ko_KR": "ko",
    "ja_JP": "ja",
    "pt_BR": "pt-BR",
    "zh_CN": "zh-CN",
    "zh_TW": "zh-TW",
    "en_GB": "en-GB"
  };

  if (mapping[locale]) {
    return mapping[locale];
  } else {
    return this.toLowerCaseLanguage(locale);
  }
},

toLowerCaseLanguage: function (locale) {
  var _pos = locale.indexOf("_");
  if (_pos !== -1) {
    var language = locale.substring(0, _pos);
    return language.toLowerCase();
  } else {
    return locale.toLowerCase();
  }
},

getLocale: function() {
  return window._locale;
},

highlightAndFade: function($elem) {
  var callback = function() {
    setTimeout(function() {
      $elem.fadeIn();
    }, 1000);
  };
  $elem.effect("highlight", {}, 1000, callback);
},

setWindowLocation: function(url) {
  window.location = url;
},

getWindowLocation: function() {
  return window.location.href;
},

saveScrollTops : function ($container) {
  return _.map($container.parents(), function(p) {
    return $(p).scrollTop();
  });
},

applyScrollTops : function ($container, scrollTops) {
  _.each($container.parents(), function(p, i) {
    if (scrollTops.length > i && scrollTops[i] > 0) {
      $(p).scrollTop(scrollTops[i]);
    }
  });
},

html: function ($container, response) {
  var filteredResponse = this.filterError(response);
  var scrollTops = this.saveScrollTops($container);
  $container.html(filteredResponse);
  this.applyScrollTops($container, scrollTops);
},

dateToIsoString: function(date){
  return date.toISOString ? date.toISOString() : moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ');
},

isHttpsUrl: function(url){
    return url.length > 8 && url.substr(0, 8) === 'https://';
},

parseJSON: function(json) {
  try {
    return $.parseJSON(json);
  } catch (ex) {
    return null;
  }
},

binarySearch: function(target, max, value, forInsert, offset){
  var high = max, low = offset || -1, middle;
  while(high - low > 1){
    middle = Math.floor((high + low) / 2);
    if (target(middle) < value) {
      low = middle;
    } else {
      high = middle;
    }
  }
  return target(high) !== value ? (forInsert ? high : -1) : low;
},

findRange: function(target, max, start, end, offset){
  var endPos, startPos;
  endPos= this.binarySearch(target, max, end, true, offset);
  if (endPos > -1) {
    while (endPos < max && target(endPos) <= end) {
      endPos += 1;
    }
    startPos = this.binarySearch(target, endPos && endPos < max ? endPos : max, start, true, offset);
  }
  return startPos > -1 ? {
    start: startPos || 0,
    end: endPos || max
  }: undefined;
},

// Given an object with an array property "subscriptionHandles" containing
// handles returned from $.subscribe, unsubscribe from every subscription
// and set the subscriptionHandles array to an empty array.
unsubscribe: function(objWithHandles) {
  if (objWithHandles && objWithHandles.subscriptionHandles) {
    _.each(objWithHandles.subscriptionHandles, function(handle) {
      $.unsubscribe(handle);
    });
    objWithHandles.subscriptionHandles = [];
  }
},

reloadPage: function() {
  if (!this.getTestMode()) {
    document.location.reload();
  }
},

/**
 * Replaces all occurrences of k with v in s where
 * the context is a map of k to v.
 */
bindContext: function(s, context) {
  var result = s;
  if (_.isObject(context)) {
    _.each(context, function(v, k) {
      while (result.indexOf(k) !== -1) {
        result = result.replace(k, '"' + v + '"');
      }
    });
  }
  return result;
},

// Given a list and a bucket size, return a new list with the elements of the
// original list bucketed together.
// E.g.: list = [1,2,3,4,5,6], bucketSize = 2 -> [[1,2], [3,4], [5,6]]
bucket: function(list, bucketSize) {
  var result = [];
  var listCopy = list.slice(0);
  var first = _.first(listCopy, bucketSize);
  var rest = _.rest(listCopy, bucketSize);
  while (first.length > 0) {
    result.push(first);
    listCopy = listCopy.slice(bucketSize);
    first = _.first(listCopy, bucketSize);
    rest = _.rest(listCopy, bucketSize);
  }
  return result;
},

// "Low-level" clear method that will remove all the child nodes of the given
// DOM element.
// Check out http://jsperf.com/jquery-html-vs-empty-vs-innerhtml/2 .
clear: function(element) {
  while (element.hasChildNodes()) {
    element.removeChild(element.firstChild);
  }
},

/**
 * http://programanddesign.com/js/jquery-select-text-range/
 */
setSelectionRange: function(input, selectionStart, selectionEnd) {
  if (input.setSelectionRange) {
    input.focus();
    input.setSelectionRange(selectionStart, selectionEnd);
  } else if (input.createTextRange) {
    var range = input.createTextRange();
    range.collapse(true);
    range.moveEnd('character', selectionEnd);
    range.moveStart('character', selectionStart);
    range.select();
  }
},

setCaretToPos: function(input, pos) {
  this.setSelectionRange(input, pos, pos);
},

/**
 * Tokenize the input query and remove anything that appears in the input text.
 * If the input text is empty, then simply return query (not null or not undefined)
 * or an empty string.
 */
removeFilteredQuery: function(text, query) {
  if (_.isString(text) && _.isString(query)) {
    var remainingTokens = [];
    var textLower = text.toLowerCase();
    _.each(query.split(" "), function(token, i) {
      if ($.trim(token) !== "" && textLower.indexOf(token.toLowerCase()) === -1) {
        remainingTokens.push(token);
      }
    });
    return $.trim(remainingTokens.join(" "));
  } else {
    return query || "";
  }
}

};


});
