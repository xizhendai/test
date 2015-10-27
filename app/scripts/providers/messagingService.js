'use strict';
angular.module('messagingService', [])
  .service('messagingService',function(){
    var _msg;
    this.setMsg = function(msg){
      _msg = msg;
    };
    this.getMsg = function(){
      var tmp = _msg;
      _msg = '';
      return tmp;
    };
  });
