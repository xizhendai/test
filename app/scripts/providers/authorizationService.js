'use strict';

angular.module('authorization', [])

.service('AuthorizationService', function() {
  this.check = function(permissions, roles, mode, top) {
    if (roles.indexOf('_all_') >= 0) {
      // admin user
      // console.log('admin');
      return true;
    }
    return permissions.some(function(p) {
      var result = false;
      if (p.modes.indexOf(mode) >= 0) {
        // console.log('mode matches: ' + mode);
        if (p.roles.indexOf('_all_') >= 0) {
          // universal rule
          result = true;
        } else if (roles instanceof Array) {
          result = roles.some(function(role) {
            var tmp = p.roles.indexOf(role) >= 0;
            // if (tmp) { console.log('roles match: ' + role); }
            return tmp;
          });
        }

        if (result && mode !== 'create' && p.matches.when === 'conditionally') {
          result = eval(p.matches.code);
          // console.log(mode + ', ' + p.matches.code + ' = ' + result);
        }
      }
      return result;
    });
    return false;
  };
});
