'use strict';
angular.module('cqsDirectives', [])
.directive('cqsSelect', function(){
  return {
    restrict: 'E',
    scope: {
      label: '=label',
      attribute: '=attribute',
      collection: '=collection',
      disabled: '=isdisabled',
      isrequired: '=isrequired', //A logical expression that evaluates to true/false based on values in other fields
      change: '=change',
      draftstatus: '=draftstatus'
    },
  template: '<select ng-model="attribute" ng-disabled="disabled" ng-required="draftstatus !== \'Incomplete\' && isrequired" ng-show="isrequired" ng-change="change"><option value>Please Select</option><option ng-repeat="option in collection" ng-selected="option === attribute" >{{option}}</option></select>',
    link: function(scope, element, attr){
      scope.$watch(
        function(){
          return scope.isrequired;
        }, function(v){
          if(scope.isrequired === false && element.find('select.ng-valid-required').length > 0){
            scope.attribute = '';
          }
        }
      );
    }
  };
})
.directive('cqsInput', function(){
  return {
    restrict: 'E',
    scope: {
      label: '=label',
      attribute: '=attribute',
      disabled: '=isdisabled',
      isrequired: '=isrequired',
      placeholder: '@',
      change: '=change',
      warnings: '&',
      draftstatus: '=draftstatus'
    },
    template: '<input type="text" class="form-control" ng-model="attribute" ng-disabled="disabled" ng-required="draftstatus !== \'Incomplete\' && isrequired" ng-change="change" placeholder="{{placeholder}}" ng-blur="blur()"/>',
    link: function(scope, element, attr){
      scope.$watch(
        function(){
          return scope.isrequired;
        }, function(v){
          if(scope.isrequired === false && element.find("input.ng-valid-required").length > 0){
            scope.attribute = '';
          }
        }
      );
      scope.blur = function(){
        if(scope.warnings() && scope.warnings().length > 0){
          var msg = scope.label;
          msg += ":\n";
          msg += scope.warnings().join("\n");
          alert(msg);
        }
      };
    }
  }
})
.directive('cqsArea', function(){
  return {
    restrict: 'E',
    scope: {
      label: '=label',
      attribute: '=attribute',
      disabled: '=isdisabled',
      isrequired: '=isrequired',
      change: '=change',
      warnings: '&',
      draftstatus: '=draftstatus',
      rows: '=rows'
    },
    template: '<textarea class="form-control" ng-model="attribute" ng-disabled="disabled" ng-required="draftstatus !== \'Incomplete\' && isrequired" ng-change="change" placeholder="{{placeholder}}" rows="rows" ng-blur="blur()"></textarea>',
    link: function(scope, element, attr){
      scope.$watch(
        function(){
          return scope.isrequired;
        }, function(v){
          if(scope.isrequired === false && element.find("textarea.ng-valid-required").length > 0){
            scope.attribute = '';
          }
        }
      );
      scope.blur = function(){
        if(scope.warnings() && scope.warnings().length > 0){
          var msg = scope.label;
          msg += ":\n";
          msg += scope.warnings().join("\n");
          alert(msg);
        }
      };
    }
  }
})
.directive('cqsCheck', function(){
  return{
    restrict: 'E',
    scope: {
      label: '=label',
      attribute: '=attribute',
      disabled: '=isdisabled',
      isrequired: '=isrequired',
      change: '=change',
      clearif: '=clearif',
      draftstatus: '=draftstatus'
    },
    template: '<input type="checkbox" class="form-control checkbox-width" ng-model="attribute" ng-disabled="disabled" ng-required="draftstatus !== \'Incomplete\' && isrequired" ng-change="change" />',
    link: function(scope, element, attr){
      scope.$watch(
        function(){
          return scope.isrequired;
        }, function(v){
          if((scope.isrequired === false || scope.clearif === true) && element.find("input.ng-valid-required").length > 0){
            scope.attribute = '';
          }
        }
      );
    }
  }
})
.directive('cqsRadio', function(){
  return{
    restrict: 'E',
    scope: {
      attribute: '=attribute',
      disabled: '=isdisabled',
      isrequired: '=isrequired',
      change: '=change',
      clearif: '=clearif',
      value: '=value',
      fieldname: '=fieldname',
      draftstatus: '=draftstatus'
    },
    template: '<input type="radio" ng-model="attribute" ng-value="value" name="{{fieldname}}" ng-required="draftstatus !== \'Incomplete\' && isrequired && !attribute" ng-change="change" ng-disabled="disabled" />',
    link: function(scope, element, attr){
      scope.$watch(
        function(){
          return scope.isrequired;
        }, function(v){
          if((scope.isrequired === false || scope.clearif === true) && element.find("input.ng-valid-required").length > 0){
            scope.attribute = '';
          }
        }
      );
    }
  }
})
.directive('radioArray', function(){
  return {
    restrict: 'E',
    scope: {
      attributes: '=attributes',
      values: '=values'
    },
    templateUrl: 'views/directives/cqsDirectives/radioArray.html'
  };
})
.directive('hemId', function(){
  return {
    restrict: 'E',
    scope: {
      pid: '=patientid',
      sid: '=siteid'
    },
    template: '<span>1538-{{sid}}-{{pid}}</span>'
  };
})
.directive('errorList', function() {
  return {
    restrict: 'E',
    scope: {
      errors: '=errors'
    },
    templateUrl: 'views/directives/cqsDirectives/errorList.html'
  };
})
.directive('rangeDetails', function(){
  return {
    restrict: 'E',
    templateUrl: 'views/directives/cqsDirectives/rangeDetails.html',
    scope: {
      obj: '=obj',
      errors: '=errors',
      draftstatus: '=draftstatus',
      requirement1: '=requirement1',
      requirement2: '=requirement2',
      requirement3: '=requirement3'
    }
  };
})
;
