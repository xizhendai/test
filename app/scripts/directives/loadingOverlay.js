'use strict';

angular.module('loadingOverlay', [])

.directive('loadingOverlay', function() {
  return {
    restrict: 'A',
    scope: {},
    template: '<div class="info bg-info" ng-show="show">Loading...</div>',
    link: function($scope, element, attrs) {
      $scope.show = true;
      $scope.$on('loading-started', function() {
        $scope.show = true;
      });
      $scope.$on('loading-complete', function() {
        $scope.show = false;
      });
    }
  };
});
