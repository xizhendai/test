'use strict';

/**
 * A service for errors hash operations
 * @name hem1538App.factory:ErrorMessagesHelper
 */
angular.module('errorMessagesHelper', [])
.factory('errorMessagesHelper', function() {

  var service = {};

  service.squash = function(key, value) {
    if (typeof(key) !== 'string' || !value) {
      console.log('Did you call this function the right way?');
      return undefined;
    }
    if (value instanceof Array) {
      return $.map(value, function(val, idx) {
        if (typeof(val) === 'string') {
          return { 'message': val, 'field': key };
        } else {
          return service.squash(key, val);
          // possibly add [val.id] to key here
        }
      });
    } else { // instanceof Object
      return $.map(value, function(v, k) {
        if (k !== 'id') {
          if (key.length > 0) {
            k = key+'.'+k;
          }
          return service.squash(k, v);
        }
      });
    }
  };

  service.rehash = function(errors, squashed) {
    var list;
    if (squashed) {
      list = errors;
    } else {
      list = service.squash('', errors);
    }
    var newHash = {};
    $.map(list, function(h) {
      newHash[h['field']] = true;
    });
    return newHash;
  };

  // service.expand = function(value) {
  //   if (value instanceof Array) {
  //     return true;
  //   } else {
  //     var newValue = {};
  //     $.each(value, function(k, v) {
  //       var nv = service.expand(v);
  //       var p = k.split('.');
  //       if (p.length > 1) {
  //         for (var i = p.length; i-- > 1;) {
  //           nv = { p[i]: nv };
  //         }
  //         $.extend(newValue[p[0]], nv);
  //       } else {
  //         $.extend(newValue[k], nv);
  //       }
  //     });
  //     return newValue;
  //   }
  // };

  return service;
});
