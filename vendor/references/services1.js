angular.module('app').factory('UserConfigService', UserConfigService);

UserConfigService.$inject = ['$http', '$rootScope', '$filter', '$log', '$stateParams', '$state', 'ConfigService', 'NotifyService', 'SessionService'];

function UserConfigService($http, $rootScope, $filter, $log, $stateParams, $state, ConfigService, NotifyService, SessionService) {

    var UserConfigService = {};

    UserConfigService.getPreferences = function(next) {
        next(SessionService.getPreferences());
    };

    UserConfigService.savePreferences = function(obj, next) {
        var user = SessionService.getUser();
        var data = {};
        data.type = 'Preferences';
        data.details = obj;
        var url = '/gptm-ui/api/users/' + user + '/config';
        $http.put(url, data)
            .success(function(res) {
                if (res.success) {
                    preferences = res.data;
                    SessionService.setPreferences(preferences)
                    next(preferences);
                    NotifyService.notifySuccess($rootScope.getWord("saved.successMsg"));
                } else {
                    NotifyService.notifyError(res.errors + "...");
                }
            });
    };

    UserConfigService.getViewByScreen = function(resource, next) {
        var result = [];

        result = result.concat(getStandardView(resource))
        result = result.concat(getViews(resource))

        var enabledViews = [];
        _.each(result, function(view) {
            if (view.active) {
                enabledViews.push(view);
            }
        })

        enabledViews = _.sortBy(enabledViews, function(o) {
            return o.type + o.name;
        });

        next(enabledViews[0]);
    };

    UserConfigService.getViewsByResource = function(resource, next) {
        var result = [];

        result = result.concat(getStandardView(resource))
        result = result.concat(getViews(resource))
        result = result.concat(getVariantViews(resource))

        var enabledViews = [];
        _.each(result, function(view) {
            if (view.active) {
                enabledViews.push(view);
            }
        })

        enabledViews = _.sortBy(enabledViews, function(o) {
            return o.type + o.name;
        });

        next(enabledViews);
    };

    UserConfigService.getViews = function(next) {
        next(SessionService.getViews());
    };

    UserConfigService.deleteView = function(view, next) {
        var user = SessionService.getUser();
        var views = SessionService.getViews();

        views = _.reject(views, { "id": view.id })

        saveViews(views, next)
    };

    UserConfigService.saveAllViews = function(views, next) {
        var user = SessionService.getUser();
        if (!views) views = [];
        saveViews(views, next)

    };

    UserConfigService.saveView = function(view, next) {
        var user = SessionService.getUser();
        var views = SessionService.getViews();
        if (!views) views = [];

        views = _.reject(views, { "id": view.id })
        views.push(view);

        if (view.type == 1) {
            _.each(views, function(viewObj) {
                if (viewObj.type == 1 && viewObj.resource === view.resource && viewObj.id != view.id) {
                    viewObj.type = 3;
                    viewObj.default = false;
                }
            })
        }

        saveViews(views, next)

    };

    UserConfigService.getVariants = function(next) {
        next(SessionService.getVariants());
    };

    UserConfigService.deleteVariant = function(data, next) {
        variants = SessionService.getVariants();
        if (!variants) {
            variants = [];
        }
        var url = '/gptm-ui/api/portal/variant';
        $http.put(url, data)
            .success(function(res) {
                if (res.success) {
                    var finalVariants = _.reject(variants, function(item) {
                        return item.variant.variantId === data.variant.variantId;
                    });
                    var favorites = SessionService.getFavorites();
                    var finalFavorites = _.reject(favorites, function(item) {
                        return item.variantId === data.variant.variantId;
                    });
                    variants = angular.copy(finalVariants);
                    favorites = angular.copy(finalFavorites);
                    SessionService.setVariants(variants);
                    SessionService.setFavorites(favorites);
                    if (next) {
                        next(variants);
                    }
                    NotifyService.notifySuccess($rootScope.getWord("Deleted successfully..."));
                } else {
                    NotifyService.notifyError(res.errors + "...");
                }
            });
    }

    UserConfigService.getVariant = function(id, next) {
        this.getVariants(function(variantList) {
            angular.forEach(variantList, function(variantObj) {
                if (variantObj.variant.variantId == id) {
                    return next(variantObj);
                }
            });
        })
    };

    UserConfigService.saveBulkVariants = function(variant, next) {
        var user = SessionService.getUser();
        variants = [];

        var url = '/gptm-ui/api/portal/variant';
        $http.put(url, variant)
            .success(function(res) {
                if (res.success) {
                    variants.push(res.data);
                    SessionService.setVariants(variants);
                    if (next) {
                        next(variants);
                    }
                } else {
                    NotifyService.notifyError(res.errors + "...");
                }
            });
    };

    UserConfigService.saveVariant = function(variant, next) {
        var user = SessionService.getUser();
        var variants = SessionService.getVariants();
        if (!variants) {
            variants = [];
        }

        var url = '/gptm-ui/api/portal/variant';
        $http.post(url, variant)
            .success(function(res) {
                if (res.success) {
                    variants = _.reject(variants, function(item) {
                        return item.variant.variantId === res.data.variant.variantId;
                    });
                    variants.push(res.data);
                    SessionService.setVariants(variants);
                    NotifyService.notifySuccess($rootScope.getWord("saved.successMsg"));

                    if (next) {
                        next(variants);
                    }
                } else {
                    NotifyService.notifyError(res.errors + "...");
                }
            });
    };

    UserConfigService.saveAllVariants = function(variantsObj, next) {
        var user = SessionService.getUser();
        var variants = SessionService.getVariants();
        if (!variants) {
            variants = [];
        }

        var data = {};
        data.type = 'Variants';
        data.details = variantsObj;

        var url = '/gptm-ui/api/users/' + user + '/config';
        $http.put(url, data)
            .success(function(res) {
                if (res.success) {
                    variants = res.data;
                    SessionService.setVariants(variants);
                    if (next) {
                        next(variants);
                    }
                    NotifyService.notifySuccess($rootScope.getWord("saved.successMsg"));
                } else {
                    NotifyService.notifyError(res.errors + "...");
                }
            });

    };

    UserConfigService.updateLocalFavorites = function() {
        var list = [];
        var variants = SessionService.getVariants();
        var favorites = SessionService.getFavorites();
        list = $filter('filter')(favorites, function(item) {
            return item.type != "variant";
        });

        _.each(variants, function(item) {
            var variant = {};
            variant.type = "variant";
            variant.name = item.variant.name;
            variant.state = item.variant.state;
            variant.variantId = item.variant.variantId;
            variant.addFav = item.addFav;
            variant.order = item.variant.order;
            list.push(variant);
        });
        favorites = angular.copy(list);
        SessionService.setFavorites(favorites);
    }

    UserConfigService.getFavorites = function(next) {
        next(SessionService.getFavorites());
    };

    UserConfigService.saveFavorites = function(favoritesObj, next) {
        var user = SessionService.getUser();
        var data = {};
        data.type = 'Favorites';
        data.details = favoritesObj;

        var url = '/gptm-ui/api/users/' + user + '/config';
        $http.put(url, data)
            .success(function(res) {
                if (res.success) {
                    variants = [];
                    favorites = res.data;
                    SessionService.setFavorites(favorites);
                    loadVariants(undefined, true);
                    //NotifyService.notifySuccess($rootScope.getWord("Saved successfully..."));
                } else {
                    NotifyService.notifyError(res.errors + "...");
                }
                next(favorites);
            });
    };

    UserConfigService.getTaskUserRoles = function(defaultValues, next) {
        var taskTeamConfig = ConfigService.get('taskTeamConfig');
        var defaultTeams = [];
        angular.forEach(taskTeamConfig, function(value, key) {
            var defaultTeam = {};
            defaultTeam.code = value;
            defaultTeam.decode = key;
            defaultTeam.default = true;
            defaultTeams.push(defaultTeam);
        })
        UserConfigService.getUserRoles(defaultTeams, next);
    };

    UserConfigService.getUserRoles = function(defaultValues, next) {
        var roles = []
        var roleData = SessionService.getRoleCode();
        roleData = roleData.split(",");

        _.each(roleData, function(role) {
            var roleObj = {};
            roleObj.code = role;
            roleObj.decode = role;
            roleObj.default = true
            roles.push(roleObj);
        });

        defaultValues = defaultValues.concat(roles);
        defaultValues = _.sortBy(defaultValues, function(obj) {
            return obj.decode;
        });

        next(defaultValues);
    };

    UserConfigService.init = function(next) {
        var done = _.after(4, function() {
            $log.log('all inited')
            next()
        })

        $log.log('inside init')
        loadVariants(done, false);
        loadViews(done);
        loadFavorites(done);
        loadPreferences(done);
    };

    function loadViews(next) {
        var user = SessionService.getUser();
        var views = SessionService.getViews();
        if (!views || views.length == 0) {
            var url = '/gptm-ui/api/users/' + user + '/config?type=Views';
            $http.get(url)
                .success(function(result) {
                    if (result.success) {
                        views = angular.isArray(result.data) ? result.data : [];
                        SessionService.setViews(views);
                        next();
                    }
                });
        } else {
            next();
        }
    }

    function loadVariants(next, isFavoriteSave) {
        var user = SessionService.getUser();
        var variants = SessionService.getVariants();
        var roleCode = SessionService.getRoleCode();
        var url = '/gptm-ui/api/portal/variant/all?userId=' + user + '&roleCode=' + roleCode;
        if (user) {
            if ((!variants || variants.length == 0) || isFavoriteSave) {
                $http.get(url)
                    .success(function(result) {
                        if (result.success) {
                            variants = result.data;
                            SessionService.setVariants(variants)
                            if (next) {
                                next();
                            }
                        }
                    });
            } else {
                if (next) {
                    next();
                }
            }
        } else {
            next();
        }
    }

    function loadFavorites(next) {
        var user = SessionService.getUser();
        var favorites = SessionService.getFavorites();
        if (user) {
            if (!favorites) {
                var url = '/gptm-ui/api/users/' + user + '/config?type=Favorites';
                $http.get(url)
                    .success(function(result) {
                        if (result.success) {
                            favorites = result.data;
                            SessionService.setFavorites(favorites)
                            if (next) {
                                next();
                            }
                        }
                    });
            } else {
                if (next) {
                    next();
                }
            }
        } else {
            next();
        }
    }

    function loadPreferences(next) {
        var user = SessionService.getUser();
        var preferences = SessionService.getPreferences();
        if (user) {
            if (!preferences) {
                var url = '/gptm-ui/api/users/' + user + '/config?type=Preferences';
                $http.get(url)
                    .success(function(result) {
                        if (result.success) {
                            preferences = result.data;
                            SessionService.setPreferences(preferences);
                            next();
                        }
                    });
            } else {
                next();
            }
        } else {
            next();
        }
    }

    function getStandardView(resource) {
        return angular.copy(ConfigService.getViews(resource));
    }

    function getViews(resource) {
        var result = []
        angular.forEach(SessionService.getViews(), function(view) {
            if (view.resource == resource) {
                result.push(view);
            }
        });

        return result;
    }

    function getVariantViews(resource) {
        var result = []
        var variants = SessionService.getVariants();
        variants = _.remove(variants, function(variant) {
            variant.variant.ispublish == false;
        });
        _.each(variants, function(variant) {
            if (variant.variant.view.resource === resource) {
                var obj = variant.variant.view
                result.push(obj);
            }
        })

        return result
    }

    function saveViews(views, next) {
        // saving
        var user = SessionService.getUser();
        var data = {};
        data.type = 'Views';
        data.details = views;
        var url = '/gptm-ui/api/users/' + user + '/config';
        $http.put(url, data)
            .success(function(res) {
                if (res.success) {
                    views = res.data;
                    //angular.extend(obj, views);
                    SessionService.setViews(views);
                    next(views);

                    NotifyService.notifySuccess($rootScope.getWord("saved.successMsg"));
                } else {
                    NotifyService.notifyError(res.errors + "...");
                }
            });
    }

    UserConfigService.getFileName = function() {
        var fileName = "";
        if ($stateParams.variant) {
            UserConfigService.getVariant($stateParams.variant, function(obj) {
                fileName = obj.variant.name;
            });
        } else {
            var menuObj = _.find(ConfigService.get('menu'), { state: $state.current.name });
            fileName = menuObj.code;
        }
        return fileName;
    }



    return UserConfigService;
};



angular.module('app').factory('RoleEntitlementService', RoleEntitlementService);

RoleEntitlementService.$inject = ['$http', '$filter', 'NotifyService', '$rootScope'];

function RoleEntitlementService($http, $filter, NotifyService, $rootScope) {
    var roles = [];
    var dEntitlements = {
        screentEntitlements: [],
        dataEntitlements: []
    };

    var RoleEntitlementService = {};

    function updateLocalRoles(role) {
        angular.forEach(roles, function(item, index) {
            if (item.roleCode == role.roleCode) {
                roles.splice(index, 1);
            }
        });
        roles.push(role);
        removeInActiveRoles();
        return roles;
    };

    function loadDefaultDataEntitlements() {
        dEntitlements.dataEntitlements = [{
            'fieldCode': 'Legal Entity',
            'permissions': ['COMP_1', 'COMP_2', 'COMP_3']
        }];
    };

    function loadDefaultScreenEntitlements() {
        dEntitlements.screentEntitlements = [{ 'screenName': 'My Preferences', 'accessLevel': 'NOACCESS', 'class': 'validClass', 'permissions': [{ "code": "NOACCESS", "decode": "No Access" }, { "code": "READ", "decode": "Read" }, { "code": "READANDWRITE", "decode": "Read & Write" }], 'actions': [{ 'actionName': 'Save', 'accessLevel': 'NOACCESS' }, { 'actionName': 'Cancel', 'accessLevel': 'NOACCESS' }] }, { 'screenName': 'Positions', 'accessLevel': 'NOACCESS', 'class': 'validClass', 'permissions': [{ "code": "NOACCESS", "decode": "No Access" }, { "code": "READ", "decode": "Read" }], 'actions': [{ 'actionName': 'Save', 'accessLevel': 'NOACCESS' }, { 'actionName': 'Cancel', 'accessLevel': 'NOACCESS' }] }, { 'screenName': 'Movements', 'accessLevel': 'NOACCESS', 'class': 'validClass', 'permissions': [{ "code": "NOACCESS", "decode": "No Access" }, { "code": "READ", "decode": "Read" }], 'actions': [{ 'actionName': 'Save Variant', 'accessLevel': 'NOACCESS' }, { 'actionName': 'Save View', 'accessLevel': 'NOACCESS' }, { 'actionName': 'Export', 'accessLevel': 'NOACCESS' }] }, { 'screenName': 'Trade List', 'accessLevel': 'NOACCESS', 'class': 'validClass', 'permissions': [{ "code": "NOACCESS", "decode": "No Access" }, { "code": "READ", "decode": "Read" }], 'actions': [{ 'actionName': 'Save', 'accessLevel': 'NOACCESS' }, { 'actionName': 'Cancel', 'accessLevel': 'NOACCESS' }] }, { 'screenName': 'Corporate Actions', 'accessLevel': 'NOACCESS', 'class': 'validClass', 'permissions': [{ "code": "NOACCESS", "decode": "No Access" }, { "code": "READ", "decode": "Read" }], 'actions': [{ 'actionName': 'Save', 'accessLevel': 'NOACCESS' }, { 'actionName': 'Cancel', 'accessLevel': 'NOACCESS' }] }, { 'screenName': 'Current Day Activity', 'accessLevel': 'NOACCESS', 'class': 'validClass', 'permissions': [{ "code": "NOACCESS", "decode": "No Access" }, { "code": "READ", "decode": "Read" }], 'actions': [{ 'actionName': 'Save', 'accessLevel': 'NOACCESS' }, { 'actionName': 'Cancel', 'accessLevel': 'NOACCESS' }] }, { 'screenName': 'Entitlements', 'accessLevel': 'NOACCESS', 'class': 'validClass', 'permissions': [{ "code": "NOACCESS", "decode": "No Access" }, { "code": "READ", "decode": "Read" }, { "code": "READANDWRITE", "decode": "Read & Write" }], 'actions': [{ 'actionName': 'Save', 'accessLevel': 'NOACCESS' }, { 'actionName': 'Cancel', 'accessLevel': 'NOACCESS' }] }, { 'screenName': 'Variants', 'accessLevel': 'NOACCESS', 'class': 'validClass', 'permissions': [{ "code": "NOACCESS", "decode": "No Access" }, { "code": "READANDWRITE", "decode": "Read & Write" }], 'actions': [{ 'actionName': 'Add to Variants', 'accessLevel': 'NOACCESS' }, { 'actionName': 'Remove from Variants', 'accessLevel': 'NOACCESS' }, { 'actionName': 'Delete', 'accessLevel': 'NOACCESS' }] }, { 'screenName': 'Favourites', 'accessLevel': 'NOACCESS', 'class': 'validClass', 'permissions': [{ "code": "NOACCESS", "decode": "No Access" }, { "code": "READANDWRITE", "decode": "Read & Write" }], 'actions': [{ 'actionName': 'Save', 'accessLevel': 'NOACCESS' }, { 'actionName': 'Cancel', 'accessLevel': 'NOACCESS' }, ] }, { 'screenName': 'Create Variants', 'accessLevel': 'NOACCESS', 'class': 'validClass', 'permissions': [{ "code": "NOACCESS", "decode": "No Access" }, { "code": "READANDWRITE", "decode": "Read & Write" }], 'actions': [{ 'actionName': 'Create', 'accessLevel': 'NOACCESS' }, { 'actionName': 'Publish', 'accessLevel': 'NOACCESS' }] }, { 'screenName': 'Task Management', 'accessLevel': 'NOACCESS', 'class': 'validClass', 'permissions': [{ "code": "NOACCESS", "decode": "No Access" }, { "code": "READ", "decode": "Read" }, { "code": "READANDWRITE", "decode": "Read & Write" }], 'actions': [{ 'actionName': 'Resubmit', 'accessLevel': 'NOACCESS' }, { 'actionName': 'Authorise', 'accessLevel': 'NOACCESS' }, { 'actionName': 'Discard', 'accessLevel': 'NOACCESS' }, { 'actionName': 'Send In', 'accessLevel': 'NOACCESS' }, { 'actionName': 'Task edit', 'accessLevel': 'NOACCESS' }] }, { 'screenName': 'Views', 'accessLevel': 'NOACCESS', 'class': 'validClass', 'permissions': [{ "code": "NOACCESS", "decode": "No Access" }, { "code": "READANDWRITE", "decode": "Read & Write" }], 'actions': [{ 'actionName': 'Save', 'accessLevel': 'NOACCESS' }, { 'actionName': 'Cancel', 'accessLevel': 'NOACCESS' }] }, { 'screenName': 'Instrument Enquiry', 'accessLevel': 'NOACCESS', 'class': 'validClass', 'permissions': [{ "code": "NOACCESS", "decode": "No Access" }, { "code": "READ", "decode": "Read" }], 'actions': [] }, { 'screenName': 'Trade Enquiry', 'accessLevel': 'NOACCESS', 'class': 'validClass', 'permissions': [{ "code": "NOACCESS", "decode": "No Access" }, { "code": "READ", "decode": "Read" }], 'actions': [] }, { 'screenName': 'Party Enquiry', 'accessLevel': 'NOACCESS', 'class': 'validClass', 'permissions': [{ "code": "NOACCESS", "decode": "No Access" }, { "code": "READ", "decode": "Read" }], 'actions': [] }, { 'screenName': 'Task Explorer', 'accessLevel': 'NOACCESS', 'class': 'validClass', 'permissions': [{ "code": "NOACCESS", "decode": "No Access" }, { "code": "READ", "decode": "Read" }], 'actions': [] }];
    };

    function removeInActiveRoles() {
        roles = $filter('filter')(roles, { state: 'true' })
    };

    RoleEntitlementService.saveRole = function(role, next) {
        var url = '/gptm-ui/api/security/saveRole';
        $http.put(url, role)
            .success(function(res) {
                if (next) {
                    if (res.responseData) {
                        next(res, updateLocalRoles(res.responseData));
                    } else {
                        next(res, roles);
                    }
                }
            });
    };

    RoleEntitlementService.getRoles = function(next) {
        if (roles.length == 0) {
            var url = '/gptm-ui/api/security/role';
            $http.get(url)
                .success(function(result) {
                    if (result) {
                        roles = result.responseData;
                        removeInActiveRoles()
                        next(roles);
                    }
                });
        } else {
            next(roles);
        }
    };

    RoleEntitlementService.reset = function() {
        roles = [];
        dEntitlements = {
            screentEntitlements: [],
            dataEntitlements: []
        };
    }

    RoleEntitlementService.getRole = function(code, next) {
        if (roles.length == 0) {
            this.getRoles(function() {
                angular.forEach(roles, function(role) {
                    if (role.roleCode == code) {
                        next(role);
                    }
                })
            });
        } else {
            angular.forEach(roles, function(role) {
                if (role.roleCode == code) {
                    next(role);
                }
            })
        }
    };

    function getUnionOfActions(selectedEntitlement, defaultEntitlements) {
        _.each(defaultEntitlements.actions, function(entitlement) {
            var actions = _.findWhere(selectedEntitlement.actions, { "actionName": entitlement.actionName });
            if (_.isUndefined(actions)) {
                selectedEntitlement.actions.push(entitlement)
            }
        });
        return selectedEntitlement.actions;
    }

    function getUnionOfPermissions(selectedEntitlement, defaultEntitlements) {
        _.each(defaultEntitlements.permissions, function(entitlement) {
            var permissions = _.findWhere(selectedEntitlement.permissions, { "code": entitlement.code });
            if (_.isUndefined(permissions)) {
                selectedEntitlement.permissions.push(entitlement)
            }
        });
        return selectedEntitlement.permissions;
    }
    RoleEntitlementService.getRoleScreenEntitlements = function(code, next) {
        this.getRole(code, function(role) {
            var roleEntitlement = $filter('filter')(role.entitlements, { type: 'functional' })[0];
            if (!roleEntitlement) {
                return next({
                    'fieldCode': 'UserInterface',
                    'type': 'functional',
                    'operator': 'EQU',
                    'value': dEntitlements.screentEntitlements
                });
            }
            var screenEntitlements = [];
            angular.forEach(dEntitlements.screentEntitlements, function(entitlement) {
                // var obj = $filter('filter')(roleEntitlement.value, { screenName: entitlement.screenName })[0];
                var obj = _.find(roleEntitlement.value, { screenName: entitlement.screenName });
                if (obj) {
                    obj.permissions = getUnionOfPermissions(obj, entitlement);
                    obj.actions = getUnionOfActions(obj, entitlement);
                    screenEntitlements.push(obj);
                } else {
                    screenEntitlements.push(entitlement);
                }
            });
            roleEntitlement.value = screenEntitlements;
            return next(roleEntitlement);
        });
    };

    RoleEntitlementService.saveRoleScreenEntitlements = function(code, entitlment, next) {
        angular.forEach(entitlment.value, function(item) {
            delete item.class;
        })

        this.getRole(code, function(role) {
            var entitlements = [];
            RoleEntitlementService.getRoleDataEntitlements(code, function(entitlements) {
                angular.forEach(entitlements, function(item) {
                    delete item.permissions;
                    delete item.class;
                });

                entitlements.push(entitlment);
                role.entitlements = entitlements;
                RoleEntitlementService.saveRole(role, function(res, data) {
                    if (res.responseType == "MESSAGE") {
                        next();
                        NotifyService.notifySuccess($rootScope.getWord("saved.successMsg"));
                    } else {
                        NotifyService.notifyError(responseMsg[0]);
                    }

                });
            });
        });
    };

    RoleEntitlementService.getRoleDataEntitlements = function(code, next) {
        this.getRole(code, function(role) {
            var entitlements = [];
            angular.forEach(dEntitlements.dataEntitlements, function(item) {
                var obj = $filter('filter')(role.entitlements, { fieldCode: item.fieldCode })[0];
                var entitlement = angular.copy(item);
                if (obj) {
                    entitlement.value = obj.value;
                    entitlement.type = obj.type;
                    entitlement.operator = obj.operator;
                } else {
                    entitlement.value = [];
                    entitlement.type = 'data';
                    entitlement.operator = 'IN';
                }
                entitlements.push(entitlement);
            });
            return next(entitlements);
        });
    };

    RoleEntitlementService.saveRoleDataEntitlements = function(code, entitlements) {
        this.getRole(code, function(role) {
            RoleEntitlementService.getRoleScreenEntitlements(code, function(entitlment) {
                entitlements.push(entitlment);

                role.entitlements = entitlements;
                RoleEntitlementService.saveRole(role, function(res, data) {
                    if (res.responseType == "MESSAGE") {
                        NotifyService.notifySuccess($rootScope.getWord("saved.successMsg"));
                    } else {
                        NotifyService.notifyError(responseMsg[0]);
                    }

                });
            });
        });
    };

    RoleEntitlementService.init = function() {
        loadDefaultDataEntitlements();
        loadDefaultScreenEntitlements();
    };

    RoleEntitlementService.init();

    return RoleEntitlementService;
};


angular.module('app').factory('UserEntitlementService', UserEntitlementService);

UserEntitlementService.$inject = ['$http', '$filter', 'NotifyService', '$rootScope'];

function UserEntitlementService($http, $filter, NotifyService, $rootScope) {
    var users = [];
    var dEntitlements = {
        dataEntitlements: []
    };

    var UserEntitlementService = {};

    function updateLocalUsers(user) {
        angular.forEach(users, function(item, index) {
            if (item.userId == user.userId) {
                users.splice(index, 1);
            }
        });
        users.push(user);
        removeInActiveUsers()
        return users;
    };

    function loadDefaultDataEntitlements() {
        dEntitlements.dataEntitlements = [{
            'fieldCode': 'Legal Entity',
            'permissions': ['COMP_1', 'COMP_2', 'COMP_3']
        }, {
            'fieldCode': 'Trading Book',
            'permissions': ['BOOK_1', 'BOOK_2', 'BOOK_3']
        }, {
            'fieldCode': 'Depot',
            'permissions': ['DEPO_1', 'DEPO_2', 'DEPO_3']
        }, {
            'fieldCode': 'Trade Type',
            'permissions': ['PRIN']
        }];
    };

    UserEntitlementService.init = function() {
        loadDefaultDataEntitlements();
    };

    UserEntitlementService.init();

    UserEntitlementService.saveUser = function(user, next) {
        var url = '/gptm-ui/api/security/saveUserProfile';
        $http.put(url, user)
            .success(function(res) {
                if (next) {
                    if (res.responseData) {
                        next(res, updateLocalUsers(res.responseData));
                    } else {
                        next(res, users);
                    }
                }
            });
    };

    function removeInActiveUsers() {
        users = $filter('filter')(users, { state: 'true' })
    };

    UserEntitlementService.getUsers = function(next) {
        if (users.length == 0) {
            var url = '/gptm-ui/api/security/user';
            $http.get(url)
                .success(function(result) {
                    if (result) {
                        users = result.responseData;
                        removeInActiveUsers()
                        next(users);
                    }
                });
        } else {
            next(users);
        }
    };

    UserEntitlementService.getUser = function(userID, next) {
        if (users.length == 0) {
            this.getUsers(function() {
                angular.forEach(users, function(user) {
                    if (user.userId == userID) {
                        next(user);
                    }
                })
            });
        } else {
            angular.forEach(users, function(user) {
                if (user.userId == userID) {
                    next(user);
                }
            })
        }
    };

    UserEntitlementService.getDataEntitlements = function(userID, next) {
        this.getUser(userID, function(user) {
            var entitlements = [];
            angular.forEach(dEntitlements.dataEntitlements, function(item) {
                var obj;
                if (user.entitlements) {
                    obj = $filter('filter')(user.entitlements, { fieldCode: item.fieldCode })[0];
                }

                var entitlement = angular.copy(item);
                if (obj) {
                    entitlement.value = obj.value;
                    entitlement.type = obj.type;
                    entitlement.operator = obj.operator;
                } else {
                    entitlement.value = [];
                    entitlement.type = 'data';
                    entitlement.operator = 'IN';
                }
                entitlements.push(entitlement);
            });
            return next(entitlements);
        });
    };

    UserEntitlementService.saveDataEntitlements = function(userID, entitlements) {
        this.getUser(userID, function(user) {
            user.entitlements = entitlements;
            UserEntitlementService.saveUser(user, function(res, data) {
                if (res.responseType == "MESSAGE") {
                    NotifyService.notifySuccess($rootScope.getWord("saved.successMsg"));
                } else {
                    NotifyService.notifyError(responseMsg[0]);
                }
            });
        });
    };

    return UserEntitlementService;
};


angular.module('app').factory('SchemaService', SchemaService);

SchemaService.$inject = ['$http', '$filter'];

function SchemaService($http, $filter) {
    var schemaDefs = {};

    var service = {};
    /*service.init = function() {
        $http.get('schema.json').success(function(data) {
            schemaDefs = data || {}
        });
    }*/

    service.init = function() {
        var promise = $http({
            method: 'GET',
            url: 'schema.json'
        });
        promise.success(function(data, status, headers, conf) {
            schemaDefs = data || {}
        });
        return promise;
    }

    service.get = function(pageName) {
        return schemaDefs[pageName];
    }

    service.getMaxExportPageSize = function() {
        return schemaDefs.maxExportPageSize;
    }

    return service;
};


angular.module('app').factory('GridService', GridService);

GridService.$inject = ['$http', '$filter'];

function GridService($http, $filter) {
    var service = {};

    service.find = function(model, schema) {
        var ds = makeDS(model, schema);
        model.dataSource = new kendo.data.DataSource(ds);
    }

    function makeDS(model, schema) {
        var ds = {
            transport: {
                read: { url: schema.dataSource.baseUrl, type: 'get', dataType: 'json' },
                parameterMap: function(data) {
                    var params = schema.dataSource.baseParams;
                    // var params = prepareSearchParams();
                    // var params = {};
                    // params.resource = 'positions';
                    // params.outputFormat = 'json';
                    // params.select = 'Position.*';
                    // params.lens = 'positionReport';
                    // params.positionDate = '2016-01-25'
                    // params.filter='Position.Company+EQ+%22CMP1%22'

                    params.page = data.page;
                    // params.size = 10;
                    return params;
                }
            },
            schema: {
                data: function(result) {
                    return _.get(result, schema.dataSource.rowsField);
                },
                total: function(result) {
                    return (_.get(result, schema.dataSource.rowsField) || []).length;
                }
            },
            serverPaging: false,
            serverFiltering: false,
            serverSorting: false,
            pageSize: 10
        }

        return ds;
    }

    return service;
};



angular.module('app').factory('ApiService', ApiService);

ApiService.$inject = ['$http', '$filter'];

function ApiService($http, $filter) {
    var service = {};

    service.find = function(resource, params) {
        var url = '/gptm-ui/api/' + resource
        if (params) {
            url += '?' + params;
        }

        return $http.get(url);
    }

    service.get = function(url, params) {
        return $http({
            'method': 'GET',
            'url': url,
            'params': params
        });
    }

    service.put = function(url, params, data) {
        return $http({
            'method': 'PUT',
            'url': url,
            'params': params,
            'data': data
        });
    }

    service.post = function(url, data) {
        return $http({
            'method': 'POST',
            'url': url,
            'data': data
        });
    }

    return service;
};


angular.module('app').factory('NotifyService', NotifyService);

NotifyService.$inject = ['$http', '$filter', 'notification'];

function NotifyService($http, $filter, notification) {
    var service = {};

    service.notifySuccess = function(message) {
        notification.success(message);
    }

    service.notifyError = function(message) {
        notification.error(message);
    }

    service.hide = function() {
        notification.hide();
    }

    return service;
};


angular.module('app').factory('UserPreferencesService', UserPreferencesService);

UserPreferencesService.$inject = ['$rootScope', '$http', '$filter', '$timeout', 'UserConfigService'];

function UserPreferencesService($rootScope, $http, $filter, $timeout, UserConfigService) {
    var service = {};

    service.applyToForm = function(data) {
        UserConfigService.getPreferences(function(preferences) {
            $timeout(function() {
                angular.forEach(data.form.fields, function(item) {
                    if (item.type == 'date' || item.type == 'daterangepicker') {
                        item.options.locale.format = preferences.dateFormat;
                        if (item.options.locale.format) {
                            item.options.locale.format = item.options.locale.format.replace("dd", "DD");
                            item.options.locale.format = item.options.locale.format.replace("yyyy", "YYYY");
                        } else {
                            item.options.locale.format = "MM/DD/YYYY";
                        }
                    }
                });
            }, 100);
        });
    }

    service.applyToGrid = function(data) {
        UserConfigService.getPreferences(function(preferences) {
            angular.forEach(data.grid.gridOptions.columns, function(item) {
                if (item.type == 'string') {
                    preferences.alignmentText ? item.attributes = { "class": preferences.alignmentText } : item.attributes = { "class": "text-left" };
                } else if (item.type == 'date') {
                    if (preferences.dateAlignment) {
                        item.attributes = { "class": preferences.dateAlignment };
                    } else {
                        item.attributes = { "class": "text-center" };
                    }
                    item.template = '{{dataItem.' + item.field + ' | date: "' + preferences.dateFormat + '"}}';
                } else if (item.type == 'number') {
                    var format;
                    item.attributes = { "class": "text-right" };
                    item.template = '<a href="javascript:void(0)">{{dataItem.' + item.field + ' | numberFormat : "' + preferences.numberFormat + '" : "' + preferences.onScreenDelimiter + '" : "' + preferences.decimalSeperator + '"}}</a>';
                    //item.template = '<a>{{dataItem.Party}}</a>'+format+'</a>'
                }
                item.title = item.titleKey ? $rootScope.getWord(item.titleKey) : '';
                //item.field = item.fieldKey;
            });
        });
        return data;
    }
    return service;
};


angular.module('app').factory('QueryService', QueryService);

QueryService.$inject = ['$filter', 'DateService', 'GridMetaService'];

function QueryService($filter, DateService, GridMetaService) {
    var service = {};

    service.find = function(name, schema, data, inputParams, next) {
        angular.forEach(schema.queries, function(query) {
            if (query.name == name) {
                return next(prepareQuery(query, data, schema, inputParams));
            }
        });
    }

    service.prepareQuery = function(queryObj, data, schema, inputParams) {
        return prepareQuery(queryObj, data, schema, inputParams);
    }

    function prepareQuery(queryObj, data, schema, inputParams) {
        var query = {};
        query.baseUrl = queryObj.path;
        query.params = prepareParams(queryObj.params, data, schema, inputParams);
        return query;
    }

    function prepareParams(params, data, schema, inputParams) {
        var parameter = {};
        angular.forEach(params, function(param) {
            if (param.type == 'CONST') {
                parameter[param.name] = param.value;
            } else if (param.type == 'REFERENCE') {
                var field = _.find(schema.form.fields, { field: param.value })
                parameter[param.name] = getValue(data[param.value], field);
            } else if (param.type == 'CUSTOM') {
                parameter[param.name] = service[param.value](param.options, data, schema, inputParams);
            }
        });

        return parameter;
    }

    service.filterMaker = function(options, data, schema, inputParams) {
        var filter = '';
        angular.forEach(options, function(option) {
            var field = {}
            if (schema.form) {
                field = _.find(schema.form.fields, { field: option.field }) || {}
            }

            var criteria = '';
            if (option.type == 'CONST') {
                criteria = prepareFilter(option.value, option.query);
            } else if (option.formatter) {
                if (data)
                    criteria = service[option.formatter](data[option.field], option.query)
            } else if (option.condition) {
                if (data)
                    criteria = applyCondition(getValue(data[option.field], field), option.query, option.condition)
            } else if (option.default) {
                criteria = prepareDefaultFilterValue(option.value, option.query);
            } else if (option.toggle) {
                if (data)
                    criteria = prepareToggleFieldValue(data[option.field], option.query);
            } else {
                if (data)
                    criteria = prepareFilter(getValue(data[option.field], field), option.query);
            }

            if (filter != '' && criteria != '') {
                filter += ' AND ';
            }

            filter += criteria;
        });
        if (schema.form.advFields) {
            var advFilter = prepareAdditionalCriteriaFilter(schema.form.advFields, data);
            if (advFilter != '') {
                filter += ' AND ' + advFilter;
            }
        }

        return filter;
    }

    service.getAdditionalCriteriaFilter = function(advFields, data) {
        var filter = prepareAdditionalCriteriaFilter(advFields, data);
        return filter;
    }

    function prepareAdditionalCriteriaFilter(advFields, data) {
        var filter = '';

        _.each(advFields, function(field) {
            var criteria = '';
            var value = getAdvFieldValue(field, data);
            if (field.ODSMapping && field.ODSMapping != '' && value != '' && value) {
                if (field.Datatype == 'Date' || field.Datatype == 'Datetime') {
                    criteria = prepareDateCriteria(field, value)
                } else {
                    criteria = field.ODSMapping
                    criteria += findFilterOperator(field);
                    criteria += value;
                }

            }

            if (filter != '' && criteria != '') {
                filter += ' AND '
            }

            filter += criteria;

        });


        return filter;
    }

    function prepareDateCriteria(field, value) {
        if (!value.startDate) {
            return '';
        }

        var dateObj = DateService.getMultiDateValue(value);
        var fromDate = dateObj.startDate || '';
        var toDate = dateObj.endDate || '';

        var startDate = $filter('date')(new Date(fromDate), 'yyyy-MM-dd');
        var endDate = $filter('date')(new Date(toDate), 'yyyy-MM-dd');

        var criteria = '';
        criteria += field.ODSMapping
        criteria += ' GE ';
        criteria += startDate;
        criteria += ' AND '
        criteria += field.ODSMapping
        criteria += ' LE ';
        criteria += endDate;
        return criteria;
    }

    function findFilterOperator(field) {
        if (_.isUndefined(field.enumeration)) {
            return ' EQ ';
        } else {
            return ' IN ';
        }
    }

    function getAdvFieldValue(field, data) {
        if (!data.advanced || !data.advanced[field.ODSKey]) {
            return;
        }
        var value = data.advanced[field.ODSKey];
        if (field.enumeration) {
            var result = [];
            angular.forEach(value, function(obj) {
                result.push(obj.ODSValue);
            });
            return extractValue(result);
        } else if (field.Datatype == 'Date' || field.Datatype == 'Datetime') {
            return value;
        } else {
            return extractValue(value);
        }
    }

    service.selectMaker = function(options, data, schema, inputParams) {
        if (!inputParams.columns) {
            return;
        }

        var fields = _.pluck(inputParams.columns, 'field');
        var selection = '';
        _.each(fields, function(field) {

            if (field && GridMetaService.get(field)) {
                if (selection != '') {
                    selection = selection + ',';
                }
                selection = selection + field;
            }
        })
        return selection;
    }

    function prepareToggleFieldValue(fieldValue, query) {
        if (query.indexOf("TransactionStatus") >= 0) {
            if (!fieldValue) {
                fieldValue = "Cancel";
                var value = extractValue(fieldValue);
                return query + ' ' + value;
            } else {
                return '';
            }
        } else if (query.indexOf("UpdatedBy.IsManual") >= 0) {
            if (fieldValue) {
                fieldValue = true;
                var value = extractValue(fieldValue);
                return query + ' ' + value;
            } else {
                return '';
            }
        } else if (query.indexOf("PaymentDate") >= 0) {
            if (fieldValue) {
                fieldValue = null;
                var value = fieldValue;
                return query + ' ' + value;
            } else {
                return '';
            }
        } else {
            return '';
        }
    }

    service.enquiryFilterMaker = function(options, data, schema, params) {
        var filter = '';
        angular.forEach(options, function(option) {

            var criteria = prepareCriteria(option, data, schema, params);

            if (filter != '' && criteria != '') {
                filter += ' AND ';
            }

            filter += criteria;
        });

        return filter;
    }

    function prepareCriteria(option, data, schema, params) {
        var fieldName = option.field;
        if (option.type == 'params') {
            fieldName = params[option.field] || option.field;
        }

        var field = {}

        if (schema && schema.form) {
            field = _.find(schema.form.fields, { field: fieldName }) || {}
        }

        var criteria = '';
        if (option.formatter) {
            criteria = service[option.formatter](_.get(data, fieldName), option.query)
        } else {
            criteria = prepareFilter(getValue(_.get(data, fieldName), field), option.query);
        }
        return criteria;
    }


    service.dateRanageFormater = function(value, query) {

        if (!value && !value.startDate) {
            return '';
        }

        var dateObj = DateService.getMultiDateValue(value);
        var fromDate = dateObj.startDate || '';
        var toDate = dateObj.endDate || '';

        if (fromDate === '') {
            return '';
        }

        var startDate = $filter('date')(new Date(fromDate), 'yyyy-MM-dd');
        var endDate = $filter('date')(new Date(toDate), 'yyyy-MM-dd');

        String.prototype.format = function() {
            var formatted = this;
            for (var arg in arguments) {
                formatted = formatted.replace("{" + arg + "}", arguments[arg]);
            }
            return formatted;
        };
        var query = query.format(startDate, endDate);
        return query;
    }

    function applyCondition(value, query, condition) {
        if (!value || value == '') {
            return '';
        }
        var value = extractValue(value);
        if (condition == "OR") {
            query = query.replace(/{val}/g, value);
        }
        return query;
    }

    function getValue(value, field) {
        if (field.type == 'multiselect') {
            var result = [];
            angular.forEach(value, function(obj) {
                result.push(obj[field.ODSFieldValue]);
            });
            return result;
        } else if (field.type == 'singleselect') {
            return value.ODSValue;
        } else if (field.type == 'date') {
            return $filter('date')(new Date(value), 'yyyy-MM-dd');
        } else if (field.type == 'sayt') {
            return value.Value;
        } else {
            return value;
        }
    }

    function prepareFilter(fieldValue, query) {
        if (!fieldValue || fieldValue == '') {
            return '';
        }
        var value = extractValue(fieldValue);

        return query + ' ' + value;
    }

    function prepareDefaultFilterValue(fieldValue, query) {
        var value = extractValue(fieldValue);

        return query + ' ' + value;
    }

    function extractValue(fieldValue) {
        var value = "";
        if (angular.isArray(fieldValue)) {
            angular.forEach(fieldValue, function(obj) {
                if (value == "") {
                    value = "(";
                } else {
                    value += ",";
                }
                value += '"' + obj + '"';
            });
            value += ")"
        } else {
            value = '"' + fieldValue + '"';
        }
        return value;
    }

    service.dateFormatter = function(option, data) {
        var format = "yyyy-MM-dd";
        if (option.format) {
            format = option.format;
        }
        if (data[option.field] == '' || !data[option.field]) {
            return '';
        }
        var value = data[option.field];

        var date = DateService.singleDateValue(value);
        var startDate = $filter('date')(new Date(date), format);;
        return startDate;

        /*if (moment.isMoment(value)) {
            // var date = DateService.singleDateValue(value);
            // var startDate = $filter('date')(new Date(date), format);;
            var startDate = $filter('date')(new Date(value), format);
            return startDate;
        } else {
            if (value.startDate == null) {
                return '';
            }
            var date = DateService.singleDateValue(value.startDate, format);
            var startDate = $filter('date')(new Date(date), format);
            return startDate;
        }*/
    }

    return service;

};



angular.module('app').factory('SessionService', SessionService);

SessionService.$inject = ['ApiService', '$sessionStorage'];

function SessionService(ApiService, $sessionStorage) {
    var roles = [];

    var service = {};

    service.create = function(userId, userName, roles, next) {
        $sessionStorage.user = userId;
        $sessionStorage.userName = userName;
        $sessionStorage.roleCode = roles.toString();
        if (_.isArray(roles)) {
            var done = _.after(roles.length, function() {
                next();
            });
            _.each(roles, function(role) {
                loadEntitlements(role, function(entitlements) {
                    var finalEntitlements = merge(getEntitlements(), entitlements);
                    setEntitlements(finalEntitlements);
                    done();
                });
            })
        } else {
            loadEntitlements(roles, function(entitlements) {
                setEntitlements(entitlements);
                next();
            });
        }
    }

    service.destroy = function() {
        delete $sessionStorage.user;
        delete $sessionStorage.entitlements;
        delete $sessionStorage.views;
        delete $sessionStorage.variants;
        delete $sessionStorage.preferences;
        delete $sessionStorage.favorites;
        //delete $sessionStorage.config;
    }

    service.getUser = function() {
        return $sessionStorage.user;
    }

    service.getUserName = function() {
        return $sessionStorage.userName;
    }

    service.getRoleCode = function() {
        return $sessionStorage.roleCode;
    }
    service.getRoleData = function() {
        return $sessionStorage.roleData;
    }

    service.getEntitlements = function() {
        return $sessionStorage.entitlements;
    }

    service.getViews = function() {
        return $sessionStorage.views;
    }

    service.setViews = function(views) {
        $sessionStorage.views = views;
    }

    service.getVariants = function() {
        return $sessionStorage.variants;
    }

    service.setVariants = function(variants) {
        $sessionStorage.variants = variants;
    }

    service.getPreferences = function() {
        return $sessionStorage.preferences;
    }

    service.setPreferences = function(preferences) {
        $sessionStorage.preferences = preferences;
    }

    service.getFavorites = function() {
        return $sessionStorage.favorites;
    }

    service.setFavorites = function(favorites) {
        $sessionStorage.favorites = favorites;
    }

    function initEntitlements(role, next) {
        var url = 'security/role/' + role;
        ApiService.find(url).then(function(resp) {
            $sessionStorage.roleData = resp.data.responseData;
            $sessionStorage.entitlements = _.find(resp.data.responseData.entitlements, { type: "functional" });
            return next();
        });
    }

    function loadEntitlements(role, next) {
        var url = 'security/role/' + role;
        ApiService.find(url).then(function(resp) {
            var entitlements = _.find(resp.data.responseData.entitlements, { type: "functional" });
            return next(entitlements);
        });
    }

    function setEntitlements(entitlements) {
        $sessionStorage.entitlements = entitlements;
    }

    function getEntitlements() {
        return $sessionStorage.entitlements;
    }

    function mergeArray(array1, array2) {
        var result = [];
        _.each(array1, function(obj1) {
            var obj2 = _.find(array2, { screenName: obj1.screenName });
            var mobj = mergeObj(obj1, obj2);
            result.push(mobj);
        })
        return result;
    }

    function mergeObj(obj1, obj2) {
        var mObj = obj1;
        if (!obj1 && obj2) {
            return obj2;
        } else if (obj1 && !obj2) {
            return obj1;
        }

        if (obj1.accessLevel || obj2.accessLevel) {
            mObj.accessLevel = getAccessLevel(obj1.accessLevel, obj2.accessLevel);
        }

        if (obj1.actions || obj2.actions) {
            var actions = [];
            _.each(obj1.actions, function(action) {
                var obj2Action = _.find(obj2.actions, { actionName: action.actionName });
                actions.push(mergeObj(action, obj2Action));
            })
            mObj.actions = actions;
        }

        if (obj1.selectedActions || obj2.selectedActions) {
            mObj.selectedActions = _.union(obj1.selectedActions, obj2.selectedActions);
        }

        if (obj1.permissions || obj2.permissions) {
            var permissions = _.union(obj1.permissions, obj2.permissions);
            mObj.permissions = _.uniq(permissions, 'code');
        }

        return mObj;
    }

    function getAccessLevel(val1, val2) {
        var accessLevel;
        if (val1 === "READANDWRITE" || val2 === "READANDWRITE") {
            accessLevel = "READANDWRITE";
        } else if (val1 === "READ" || val2 === "READ") {
            accessLevel = "READ";
        } else {
            accessLevel = "NOACCESS";
        }

        return accessLevel;
    }

    function merge(obj1, obj2) {
        if (!obj1 || !obj1.value || obj1.value.length == 0) {
            return obj2;
        } else if (!obj2 || !obj2.value || obj2.value.length == 0) {
            return obj1;
        }

        var obj = angular.copy(obj1);
        obj.value = mergeArray(obj1.value, obj2.value);
        return obj;
    }

    return service;

};

angular.module('app').factory('AuthService', AuthService);

AuthService.$inject = ['SessionService', 'ConfigService', 'UserConfigService', 'RoleEntitlementService'];

function AuthService(SessionService, ConfigService, UserConfigService, RoleEntitlementService) {

    var entitlements = [];
    var user;

    var service = {};

    service.getUser = function() {
        return user;
    }

    service.login = function(userId, userName, role, next) {
        var done = _.after(2, next);

        SessionService.create(userId, userName, role, done);
        UserConfigService.init(done);
    }

    service.logout = function() {
        SessionService.destroy();
    }

    service.isAuthenticated = function() {
        var userName = SessionService.getUser();
        if (!userName || userName == '') {
            return false;
        }

        return true;
    }

    service.getLogoutUrl = function() {
        var settings = ConfigService.get('appSettings');
        return settings['logoutUrl']
    }

    service.isEntitled = function(menuName) {
        var entitlements = SessionService.getEntitlements();
        if (!entitlements || entitlements.length == 0) {
            return false;
        }

        var entitlement = _.find(entitlements.value, { screenName: menuName });
        if (!entitlement || entitlement.accessLevel == 'NOACCESS') {
            return false;
        } else {
            return true;
        }
    }

    service.isActionEntitled = function(screenName, actionName) {
        var entitlements = SessionService.getEntitlements();
        var screenEntitlement = _.find(entitlements.value, { "screenName": screenName });
        if (screenEntitlement) {
            var selectedActions = screenEntitlement.selectedActions;
            if (screenEntitlement.accessLevel == "READANDWRITE") {
                var hasAccess = selectedActions.indexOf(actionName);
                if (hasAccess >= 0) {
                    return true;
                }
            }
        }
        return false;
    }

    service.isStateEntitled = function(stateName) {
        var menuName = findName(stateName);

        // TODO:Temporary fix
        if (stateName == 'home') return true;

        return service.isEntitled(menuName);
    }

    service.isPublic = function(stateName) {
        var menuList = ConfigService.get('menu');
        var menuObj = findMenuObj(menuList, stateName);

        if (menuObj && menuObj.isPublic) {
            return true;
        } else {
            return false;
        }

    }

    function findName(state) {
        var menuList = ConfigService.get('menu');
        var menuItem = findMenuObj(menuList, state);
        if (menuItem) {
            return menuItem.code;
        } else {
            return;
        }

    }

    function findMenuObj(data, state) {
        var menuItem;
        angular.forEach(data, function(item) {
            if (!menuItem) {
                if (item.state == state) {
                    menuItem = item;
                }
                if (item.items) {
                    var obj = findMenuObj(item.items, state);
                    if (obj) {
                        menuItem = obj;
                    }
                }
            }
        })
        return menuItem;
    }

    return service;
};

angular.module('app').factory('AppSettingService', AppSettingService);

AppSettingService.$inject = ['$http', '$q'];

function AppSettingService($http, $q) {
    var appSettings = {};
    var service = {};
    service.init = function() {
        var deferred = $q.defer();

        var url = '/gptm-ui/api/security/appSettings';
        $http.get(url)
            .success(function(data) {
                if (data) {
                    appSettings = data.data || {};
                    return deferred.resolve(appSettings)
                }
            })
        return deferred.promise;
    }

    service.get = function(setting) {
        var setting = appSettings[setting];
        return setting;
    }

    service.getSSOURL = function() {
        return service.get('ssoUrl');
    }

    service.getTEURL = function() {
        return service.get('teUrl');
    }

    service.isSSOEnabled = function() {
        return service.get('ssoEnabled');
    }

    return service;
};

angular.module('app').factory('ConfigService', ConfigService);

ConfigService.$inject = ['$http', '$localStorage', 'SessionService'];

function ConfigService($http, $localStorage, SessionService) {
    var service = {};

    service.loadConfig = function(data) {
        $localStorage.config = data;
    }

    service.init = function() {
        var configDefs = service.getConfig();
        return $http.get('config.json').then(function(res) {
            var configDefs = res.data || {};
            service.loadConfig(configDefs);
        });
    }



    service.getConfig = function() {
        return $localStorage.config;
    }

    service.get = function(name) {
        var configDefs = this.getConfig();
        if (configDefs) {
            return configDefs[name];
        } else {
            return;
        }
    }

    service.getViews = function(resource) {
        var configDefs = this.getConfig();
        var views = configDefs.views;
        return _.get(views, resource) || [];
    }

    return service;
};


angular.module('app').factory('MappingService', MappingService);

MappingService.$inject = ['ConfigService'];

function MappingService(ConfigService) {
    var service = {}

    service.get = function(type, from) {
        return (ConfigService.get('mappings')[type] || {})[from]
    }

    service.getTradeType = function(from) {
        return this.get('TRAN_SUBTPYE_TYPE_MAPPING', from)
    }

    return service;
};

angular.module('app').factory('FormatterService', FormatterService);

FormatterService.$inject = ['$rootScope', 'UserConfigService'];

function FormatterService($rootScope, UserConfigService) {
    var service = {};

    service.split = function(template, separator) {
        var retArray = []
        angular.forEach(template.split(separator), function(item, index) {
            var obj = {}
            if (item.substring(0, 2) === "{{") {
                var format = "";
                UserConfigService.getPreferences(function(preferences) {
                    if (_.isEmpty(preferences)) {
                        preferences = { "numberFormat": "HUNDRED", "decimalSeperator": ".", "csvDelimiter": ",", "onScreenDelimiter": "," };
                    }
                    format = " | numberFormat: '" + preferences.numberFormat + "' : '" + preferences.onScreenDelimiter + "' : '" + preferences.decimalSeperator + "'";
                });

                var text = item.replace("{{", "").replace("}}", "");
                obj.type = "model"
                obj.value = text.concat(format);
            } else {
                obj.type = "string"
                obj.value = $rootScope.getWord(item);
            }
            retArray.push(obj)
        });
        return retArray;
    }

    return service;
};

angular.module('app').factory('AttributeMetaService', AttributeMetaService);

AttributeMetaService.$inject = ['$http', '$q', 'ApiService'];

function AttributeMetaService($http, $q, ApiService) {
    var metaDataDefs = {};
    var service = {};
    service.init = function() {
        var deferred = $q.defer();

        var done = _.after(6, function() {
            return deferred.resolve({})
        });

        loadPositionMetadata(done);
        loadInstrumentMetadata(done);
        loadPartyMetadata(done);
        loadTaskMetadata(done);
        loadTransactionMetadata(done);
        loadComplexTypes(done);


        return deferred.promise;
    }

    service.getByODSKey = function(entity, odsKey) {
        var field = entity;
        if (!_.isUndefined(odsKey)) {
            field += '.' + odsKey
        }

        return metaDataDefs[field]
    }

    function map(entity, attributes) {
        _.each(attributes, function(attribute) {
            metaDataDefs[entity + '.' + attribute.ODSKey] = attribute
        })
    }

    function loadPositionMetadata(next) {
        var entity = 'Position'
        loadMetaData(entity, function(result) {
            metaDataDefs.Position = _.get(result, "Attribute") || []
            map(entity, metaDataDefs[entity])
            next();
        })
    }

    function loadInstrumentMetadata(next) {
        var entity = 'Instrument'
        loadMetaData(entity, function(result) {
            metaDataDefs.Instrument = _.get(result, "Attribute") || []
            map(entity, metaDataDefs[entity])
            next();
        })
    }

    function loadPartyMetadata(next) {
        var entity = 'Party'
        loadMetaData(entity, function(result) {
            metaDataDefs.Party = _.get(result, "Attribute") || []
            map(entity, metaDataDefs[entity])
            next();
        })
    }

    function loadTaskMetadata(next) {
        var entity = 'Task'
        loadMetaData(entity, function(result) {
            metaDataDefs.Task = _.get(result, "Attribute") || []
            map(entity, metaDataDefs[entity])
            next();
        })
    }

    function loadTransactionMetadata(next) {
        var entity = 'Transaction'
        loadMetaData(entity, function(result) {
            metaDataDefs.Transaction = _.get(result, "Attribute") || []
            map(entity, metaDataDefs[entity])
            next();
        })
    }

    function loadComplexTypes(next) {
        var complexTypes = ["PostalAddress", "UpdatedBy", "Amount", "Percentage", "TradeExchangeRate", "ExchangeRate", "SettlementDetails", "TaskComment", "Settlement", "CAEvent", "TradePrice", "SSI", "Instruction"]
        var done = _.after(complexTypes.length, function() {
            next();
        });

        _.each(complexTypes, function(dataType) {
            loadMetaData(dataType, function(result) {
                metaDataDefs[dataType] = _.get(result, "Attribute") || []
                map(dataType, metaDataDefs[dataType])
                done();
            })
        })
    }


    function loadMetaData(entityType, next) {
        var params = {};
        params.resource = "attribute";
        params.outputFormat = "json";
        params.select = "Attribute.ODSKey,Attribute.Datatype,Attribute.DisplayLabel,Attribute.Tags,Attribute.enumeration,Attribute.cardinality,Attribute.container";
        params.EntityType = entityType;
        params.size = 1000;


        ApiService.get("/gptm-ui/api/Query", params).then(function success(response) {
            return next(response.data);
        })
    }

    service.get = function(Entity) {
        var metaData = metaDataDefs[Entity];
        if (!metaData) {
            return;
        }

        metaData.fields = _.sortBy((_.sortBy(metaData, 'DisplayLabel')), 'Tags');
        return metaData;
    }

    service.findTagNames = function(entity) {
        var metaData = metaDataDefs[entity];
        if (_.isUndefined(metaData)) {
            return [];
        }

        var list = _.pluck(metaData, 'Tags').toString();
        list = angular.toJson(list);
        var uniqueTags = _.filter(_.uniq(_.map(list.replace(/"/g, "").replace("[", "").replace("]", "").split(","), function(item) {
            return item.trim();
        })));

        return uniqueTags;
    }

    service.getByTag = function(entity, tag) {
        var metaData = metaDataDefs[entity];
        if (_.isUndefined(metaData)) {
            return;
        }

        var tagFields = _.filter(metaData, function(attr) {
            var tags = attr.Tags;
            return _.contains(tags, tag);
        })

        return _.sortBy(tagFields, 'DisplayLabel');
    }

    return service;
};


angular.module('app').factory('EnquiryConfigService', EnquiryConfigService);

EnquiryConfigService.$inject = ['$http'];

function EnquiryConfigService($http) {
    var service = {};
    var enqurySettings = {};
    service.init = function() {
        var url = '/gptm-ui/api/enquiryConfig/enquirySettings';
        $http.get(url)
            .success(function(data) {
                if (data) {
                    enqurySettings = data.data || {};
                }
            })
    }

    service.get = function() {
        var setting = enqurySettings.enquires;
        return setting;
    }

    return service;
};

angular.module('app').factory('LoaderService', LoaderService);

LoaderService.$inject = ['$rootScope'];

function LoaderService($rootScope) {
    var service = {};
    service.show = function() {
        $rootScope.$broadcast("GRID_LOADING_ON");
    }
    service.hide = function() {
        $rootScope.$broadcast("GRID_LOADING_OFF");
    }
    return service;
};

angular.module('app.mocks', []).factory('MockService', DummyMockService);
DummyMockService.$inject = ['$q'];

function DummyMockService($q) {
    var service = {};
    service.init = function() {
        return $q.resolve();;
    }
    service.log = function(url) {
        // Do nothing
    }

    return service;
};

angular.module('app').factory('TimerService', TimerService);

TimerService.$inject = ['$log'];

function TimerService($log) {
    var start = new Date();
    var service = {};

    service.init = function() {
        start = new Date();
    }
    service.log = function(mesg) {
        var diff = ((new Date()).getTime() - start.getTime()) / 1000
        $log.log(mesg, ':', diff, 'seconds')
    }
    return service;
};

angular.module('app').factory('CoreConfigService', CoreConfigService);

CoreConfigService.$inject = ['$log', '$http', '$localStorage'];

function CoreConfigService($log, $http, $localStorage) {
    var service = {};

    function setCoreConfig(data) {
        $localStorage.coreConfig = data;
    }

    function getCoreConfig() {
        return $localStorage.coreConfig;
    }

    service.init = function() {
        return $http.get('core.json').then(function(res) {
            var coreConfigDef = res.data || {};
            setCoreConfig(coreConfigDef);
        });
    }

    service.get = function(type) {
        var coreConfigDef = getCoreConfig();
        return _.get(coreConfigDef, type);
    }

    return service;

}
