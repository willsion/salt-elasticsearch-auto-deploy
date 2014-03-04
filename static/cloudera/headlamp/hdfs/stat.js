// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
// Ported from python2.6/stat.py

define([], function() {
  /*jslint bitwise: true */

  // Extract bits from the mode
  function S_IMODE(mode) {
    return mode & parseInt('07777', 8);
  }

  function S_IFMT(mode) {
    return mode & parseInt('0170000', 8);
  }

  // Constants/functions for interpreting results of os.stat() and os.lstat().

  return {

    // Indices for stat struct members in the tuple returned by os.stat()
    ST_MODE  : 0,
    ST_INO   : 1,
    ST_DEV   : 2,
    ST_NLINK : 3,
    ST_UID   : 4,
    ST_GID   : 5,
    ST_SIZE  : 6,
    ST_ATIME : 7,
    ST_MTIME : 8,
    ST_CTIME : 9,

    S_IMODE : S_IMODE,
    S_IFMT : S_IFMT,

    // Constants used as S_IFMT() for various file types
    // (not all are implemented on all systems)

    S_IFDIR  : parseInt("0040000", 8),
    S_IFCHR  : parseInt("0020000", 8),
    S_IFBLK  : parseInt("0060000", 8),
    S_IFREG  : parseInt("0100000", 8),
    S_IFIFO  : parseInt("0010000", 8),
    S_IFLNK  : parseInt("0120000", 8),
    S_IFSOCK : parseInt("0140000", 8),

    // Functions to test for each file type

    S_ISDIR : function(mode) {
      return S_IFMT(mode) === this.S_IFDIR;
    },

    S_ISCHR : function(mode) {
      return S_IFMT(mode) === this.S_IFCHR;
    },

    S_ISBLK : function(mode) {
      return S_IFMT(mode) === this.S_IFBLK;
    },

    S_ISREG : function(mode) {
      return S_IFMT(mode) === this.S_IFREG;
    },

    S_ISFIFO : function(mode) {
      return S_IFMT(mode) === this.S_IFIFO;
    },

    S_ISLNK : function(mode) {
      return S_IFMT(mode) === this.S_IFLNK;
    },

    S_ISSOCK : function(mode) {
      return S_IFMT(mode) === this.S_IFSOCK;
    },

    // Names for permission bits
    S_ISUID : parseInt("04000", 8),
    S_ISGID : parseInt("02000", 8),
    S_ENFMT : parseInt("02000", 8), //same as S_ISGID,
    S_ISVTX : parseInt("01000", 8),
    S_IREAD : parseInt("00400", 8),
    S_IWRITE : parseInt("00200", 8),
    S_IEXEC : parseInt("00100", 8),
    S_IRWXU : parseInt("00700", 8),
    S_IRUSR : parseInt("00400", 8),
    S_IWUSR : parseInt("00200", 8),
    S_IXUSR : parseInt("00100", 8),
    S_IRWXG : parseInt("00070", 8),
    S_IRGRP : parseInt("00040", 8),
    S_IWGRP : parseInt("00020", 8),
    S_IXGRP : parseInt("00010", 8),
    S_IRWXO : parseInt("00007", 8),
    S_IROTH : parseInt("00004", 8),
    S_IWOTH : parseInt("00002", 8),
    S_IXOTH : parseInt("00001", 8)
  };

});
