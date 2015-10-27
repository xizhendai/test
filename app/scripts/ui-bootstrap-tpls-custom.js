'use strict';

angular.module('ui.bootstrap.tpls.custom', []).run(['$templateCache', function($templateCache) {
  $templateCache.put('template/accordion/accordion-group.html',
    '<div class="panel panel-default">\n' +
    '  <div class="panel-heading">\n' +
    '    <h4 class="panel-title">\n' +
    '      <a href class="accordion-toggle" ng-click="toggleOpen()" accordion-transclude="heading"><span ng-class="{\'text-muted\': isDisabled}">{{heading}}</span></a>\n' +
    '    </h4>\n' +
    '  </div>\n' +
    '  <div class="panel-collapse" collapse="!isOpen" ng-transclude>\n' +
    '  </div>\n' +
    '</div>\n' +
    '');
}]);
