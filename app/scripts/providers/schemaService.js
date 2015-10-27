'use strict';

angular.module('schemaService', [])
.service('schemaService', function ($http, $q) {
  var _schema = {};

  this.loadSchema = function () {
    var deferred = $q.defer();
    $http.get('schema.json')
      .success(function (data) {
      deferred.resolve(data);
    });
    _schema = deferred.promise;
  };

  this.getSchema = function () {
    return _schema;
  };

  this.getValues = function (fieldPath) {
    var values;
    return _schema.then(function (schema) {
      var field = getModule(schema, fieldPath);
      var values = field.enum;
      return values;
    });
  };

  this.getAllValues = function (moduleName) {
    return _schema.then(function (schema) {
      var module = getModule(schema, moduleName);
      var values = {};
      var fields;
      var collection;
      if (module.schematic) {
        collection = module.schematic.children;
      } else if (module.children) {
        collection = module.children;
      }
      fields = $.grep(collection, function (item) { return 'enum' in item; });
      fields.forEach(function (field) {
        values[field.name] = field.enum;
      });
      return values;
    });
  };

  this.warningService = function () {
    return _schema.then(function (schema) {
      return function (path, field, item, parent, grandparent) {
        var tests;
        var messages = [];
        var helpers = '';
        var section = getModule(schema, path);
        if (section.warnings) {
          tests = section.warnings.filter(function (x) { return x.field === field });
          if (schema.helpers && schema.helpers.length > 0) {
            for (var j = 0; j < schema.helpers.length; j++) {
              helpers += schema.helpers[j].code.join(' ');
            }
          }
          for (var i = 0; i < tests.length; i++) {
            var result = eval(helpers + tests[i].code.join(''));
            if (result === false) {
              messages.push(tests[i].message);
            }
          }
        }
        return messages;
      };
    });
  };

  this.notificationService = function () {
    return _schema.then(function (schema) {
      return function (sectionPath, action) {
        var message;
        var notice;
        var section = getModule(schema, sectionPath);
        if (section.schematic && section.schematic.notifications) {
          notice = section.schematic.notifications.filter(function (x) { return x.type === 'display' && x.name === action });
        } else if (section.notifications) {
          notice = section.notifications.filter(function (x) { return x.type === 'display' && x.name === action });
        }
        if (notice && notice.length > 0) { message = notice[0].body }
        return message;
      };
    });
  };

  this.getPermissions = function(sectionPath) {
    // finds the "nearest" section with permissions and returns them
    return _schema.then(function(schema) {
      var paths = sectionPath.split('.');
      var s;
      for(var i = paths.length; i--; ) {
        s = getModule(schema, paths.slice(0, i+1).join('.'));
        if (s.permissions) {
          return s.permissions;
        }
      }
      return s.schematic.permissions;
    });
  };

  this.getReports = function(collectionName) {
    return _schema.then(function (schema) {
      var collection = getModule(schema, collectionName);
      var reports = [];
      if (collection.reports != undefined) {
        reports = collection.reports;
      }
      return reports;
    });
  };

  this.labelFactory = function () {
    return _schema.then(function (schema) {
      return function (fieldPath) {
        var section = getModule(schema, fieldPath);
        return section.label;
      };
    });
  };

  this.requiredFactory = function () {
    return _schema.then(function (schema) {
      return function (fieldPath, item, parent, grandparent) {
        if (item === undefined) { item = {} }        ;
        var field = getModule(schema, fieldPath);
        // if (field === undefined) {
        //   console.log('undefined field, wrong fieldPath ' + fieldPath);
        // }
        if (field.required) {
          if (field.required.when === 'always') {
            return true;
          } else if (field.required.when === 'conditionally') {
            var code = field.required.code;
            var helpers = '';
            if (code instanceof Array) {
              code = code.join(' ');
            }
            if (schema.helpers && schema.helpers.length > 0) {
              for (var j = 0; j < schema.helpers.length; j++) {
                helpers += schema.helpers[j].code.join(' ');
              }
            }
            return eval(helpers + code);
          }
        } else {
          return false;
        }
      };
    });
  };

  var getModule = function (schema, modulePath) {
    var modules = modulePath.split('.');
    var module = schema;
    angular.forEach(modules, function (moduleName) {
      if (module.collections) {
        module = module.collections;
      } else if (module.schematic && module.schematic.components && moduleName === 'components') {
        module = module.schematic.components;
      } else if (module.schematic && module.schematic.children) {
        module = module.schematic.children;
      } else if (module.children) {
        module = module.children;
      }

      if (moduleName === 'components') {
      } else {
        module = $.grep(module, function (item) {
          return item.name === moduleName;
        })[0];
      }
    });
    return module;
  };
});
