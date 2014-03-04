// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
//
// Utilities for dealing with file modes.
// Ported from hue/apps/filebrowser/src/filebrowser/lib/rwx.py

define([
  "cloudera/headlamp/hdfs/stat"
], function(stat) {
  /*jslint bitwise: true */

  var BITS = [stat.S_IRUSR, stat.S_IWUSR, stat.S_IXUSR,
    stat.S_IRGRP, stat.S_IWGRP, stat.S_IXGRP,
    stat.S_IROTH, stat.S_IWOTH, stat.S_IXOTH
  ];

  function filetype(mode) {
    // Returns "dir", "file", or "link" according to what type path is.
    // @param mode: file mode from "stat" command.
    if (stat.S_ISLNK(mode)) {
      return "link";
    } else if (stat.S_ISDIR(mode)) {
      return "dir";
    } else if (stat.S_ISREG(mode)) {
      return "file";
    } else {
      return "unknown";
    }
  }

  function rwxtype(mode) {
    // Returns l/d/-/? for use in "rwx" style strings.
    if (stat.S_ISLNK(mode)) {
      return "l";
    } else if (stat.S_ISDIR(mode)) {
      return "d";
    } else if (stat.S_ISREG(mode)) {
      return "-";
    } else {
      return "?";
    }
  }

  function expand_mode(mode) {
    var i;
    var  bools = [];
    for (i = 0; i < BITS.length; i+= 1) {
      bools.push(mode & BITS[i]);
    }
    return bools;
  }

  function compress_mode(tup) {
    var mode = 0;
    var i;
    for (i = 0; i < tup.length && i < BITS.length; i+= 1) {
      var b = tup[i];
      var n = BITS[i];
      if (b) {
        mode += n;
      }
    }
    return mode;
  }

  function rwx(mode) {
    //  Returns "rwx"-style string like that ls would give you.
    //  I couldn't find much extant code along these lines;
    //  this is similar in spirit to the google-able "pathinfo.py".
    var bools = expand_mode(mode);
    var s = ['r', 'w', 'x', 'r', 'w', 'x', 'r', 'w', 'x'];
    var i;
    for (i = 0; i < bools.length; i+= 1) {
      if (!bools[i]) {
        s[i] = "-";
      }
    }
    return rwxtype(mode) + s.join("");
  }

  return {
    rwx: rwx,
    filetype: filetype,
    rwxtype: rwxtype
  };
});

