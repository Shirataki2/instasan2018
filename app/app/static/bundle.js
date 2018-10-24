'use strict';

require('js-snackbar/snackbar.css');

var _jsSnackbar = require('js-snackbar');

$(function () {
  var file = void 0;

  $('input[type=file]').change(function () {
    console.log($(undefined)[0]);
    file = $(undefined)[0];
    if (file.type != 'image/jpeg' && file.type != 'image/png') {
      file = null;
      (0, _jsSnackbar.show)({
        text: "対応している画像ファイル形式ではありません．",
        pos: "top-center",
        actionText: "OK",
        backgroundColor: "#ff6335",
        duration: 3000
      });
    }
  });
});
