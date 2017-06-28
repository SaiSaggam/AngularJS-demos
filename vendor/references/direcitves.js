angular.module('app')

// =========================================================================
// Field
// =========================================================================

.directive('brField', brField);
brField.$inject = [];

function brField() {
    return {
        restrict: 'E',
        replace: true,
        template: '<label class="label"><div>hello world123</div></label>',
        link: function(scope, elem, attrs, ctrl) {}
    }
}


// =========================================================================
// Slide Toggle
// =========================================================================    
angular.module('app').directive('slideToggle', slideToggle);
slideToggle.$inject = [];

function slideToggle() {
    return {
        restrict: 'AE',
        scope: {
            isOpen: "=slideToggle"
        },
        link: function(scope, element, attr) {
            var slideDuration = parseInt(attr.slideToggleDuration, 10) || 200;

            scope.$watch('isOpen', function(newIsOpenVal, oldIsOpenVal) {
                if (newIsOpenVal !== oldIsOpenVal) {
                    element.stop().slideToggle(slideDuration);
                }
            });
        }
    };
}

// =========================================================================
// Change model
// =========================================================================
angular.module('app').directive('brNgChange', brNgChange);
brNgChange.$inject = ['$timeout'];

function brNgChange($timeout) {
    return {
        restrict: 'A',
        priority: 0,
        link: function(scope, element, attr) {
            scope.$watch(attr.ngModel, function(value) {
                $timeout(function() {
                    scope.$eval(attr.brNgChange)
                }, 0, false);
            });
        }
    };
}

// =========================================================================
// Modal Window
// =========================================================================
angular.module('app').directive('brModal', brModal);
brModal.$inject = [];

function brModal() {
    return {
        template: '<div class="modal fade">' +
            '<div class="modal-dialog br-modal">' +
            '<div class="modal-content">' +
            '<div class="modal-header">' +
            '<button type="button" class="close" data-dismiss="modal" aria-hidden="true"><i class="fa fa-times"></i></button>' +
            '<label class="">{{getWord(titlename)}}</label>' +
            '</div>' +
            '<div class="modal-body" ng-transclude></div>' +
            '</div>' +
            '</div>' +
            '</div>',
        restrict: 'E',
        transclude: true,
        replace: true,
        scope: true,
        link: function(scope, element, attrs) {
            scope.$watch(attrs.visible, function(value) {
                if (value == true)
                    angular.element(element).modal('show');
                else
                    angular.element(element).modal('hide');
            });

            scope.$watch(attrs.titlename, function(value) {
                scope.titlename = value;
            });

            angular.element(element).on('shown.bs.modal', function() {
                scope.$apply(function() {
                    scope.$parent[attrs.visible] = true;
                });
            });

            angular.element(element).on('hidden.bs.modal', function() {
                scope.$apply(function() {
                    scope.$parent[attrs.visible] = false;
                });
            });

            function readAttribute(attrName) {
                var value = attrs[attrName];
                if (attrs[attrName]) {
                    var val = scope.$eval(attrs[attrName]);
                    if (val) {
                        value = val;
                    }
                    return value;
                }

                return;
            }
        }
    };
}


// =========================================================================
// toolTip directive
// =========================================================================
angular.module('app').directive('brTooltip', brTooltip);
brTooltip.$inject = ['$rootScope']

function brTooltip($rootScope) {
    return {
        restrict: 'AE',
        replace: true,
        link: function(scope, elem, attrs) {
            angular.element(elem).on('mouseenter', function() {

                prepareContent();

                angular.element(elem).popover({
                    placement: 'auto',
                    container: 'body',
                    mouseOffset: 20,
                    followMouse: false,
                    trigger: 'hover',
                    content: function() {
                        return scope.finalString;
                    }
                });
            });

            var unregister = $rootScope.$on("$stateChangeStart", function(event, toState, toParams, fromState, fromParams) {
                angular.element(elem).popover('hide');
            });

            function prepareContent() {
                var finalString = "";
                angular.forEach(scope.pageSchema.form.fields, function(formField) {
                    if (formField.type == "singleselect") {
                        finalString += $rootScope.getWord(formField.label) + ": ";
                        var selectedVal = scope.pageModel.searchForm[formField.field].DisplayLabel;
                        if (!(angular.isUndefined(selectedVal) || selectedVal === null)) {
                            finalString += selectedVal;
                        }

                        finalString += getPipe(formField);
                    }

                    if (formField.type == "multiselect" && scope.pageModel.searchForm[formField.field].length != 0) {
                        finalString += $rootScope.getWord(formField.label) + ": ";
                        angular.forEach(scope.pageModel.searchForm[formField.field], function(value, $valIndex) {
                            if (!(angular.isUndefined(value) || value === null)) {
                                finalString += value[formField.displayField];
                            }
                            if ($valIndex != (scope.pageModel.searchForm[formField.field].length - 1)) {
                                finalString += ", ";
                            }
                        });
                        finalString += getPipe(formField);
                    }

                    if (formField.type == "sayt" && scope.pageModel.searchForm[formField.field]) {
                        if (scope.pageModel.searchForm[formField.field].length != 0) {
                            finalString += $rootScope.getWord(formField.label) + ": ";
                            if (!(angular.isUndefined(formField) || formField === null)) {
                                finalString += scope.pageModel.searchForm[formField.field].ReferenceLabel;
                            }
                            finalString += getPipe(formField);
                        }
                    }

                    if (formField.type == "date" && scope.pageModel.searchForm[formField.field]) {
                        finalString += $rootScope.getWord(formField.label) + ": ";
                        if (!(angular.isUndefined(formField) || formField === null)) {
                            finalString += scope.getValue(scope.pageModel.searchForm[formField.field], formField.type, formField.format);
                        }
                        finalString += getPipe(formField);
                    }

                    if ((formField.type == "daterangepicker") && scope.pageModel.searchForm[formField.field]) {
                        finalString += $rootScope.getWord(formField.label) + ": ";
                        if (!(angular.isUndefined(formField) || formField === null)) {
                            //var fieldType = formField.options.singleDatePicker ? "dateSingle" : "daterangepicker";
                            finalString += scope.getValue(scope.pageModel.searchForm[formField.field], formField, formField.options.locale.format);
                        }
                        finalString += getPipe(formField);
                    }

                    if (formField.type === 'radio') {
                        finalString += $rootScope.getWord(formField.label) + ": ";
                        if (!(angular.isUndefined(formField) || formField === null)) {
                            finalString += scope.pageModel.searchForm[formField.field];
                        }
                        finalString += getPipe(formField);
                    }

                    if (formField.type === 'togglebtn') {
                        finalString += $rootScope.getWord(formField.label) + ": ";
                        if (!(angular.isUndefined(formField) || formField === null)) {
                            if (scope.pageModel.searchForm[formField.field]) {
                                finalString += 'Yes';
                            } else {
                                finalString += 'No';
                            }
                        }
                        finalString += getPipe(formField);
                    }
                });
                scope.finalString = finalString;
            }

            function getPipe(formField) {
                var str = "";
                if (scope.pageSchema.form.fields.length > scope.pageSchema.form.fields.indexOf(formField) + 1) {
                    str = "      |       ";
                }
                return str;
            }
        }
    }
}


// =========================================================================
// Tab Strip
// =========================================================================

angular.module('app').directive('brTabStrip', brTabStrip);
brTabStrip.$inject = ['$compile', '$timeout'];

function brTabStrip($compile, $timeout) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'app/base/partials/br.tab.strip.html',
        link: function(scope, elem, attrs) {
            if (attrs.options) {
                var options = scope.$eval(attrs.options);
                var ds = options.ds;
                var tabOptions = {};
                if (ds.type == 'custom') {
                    var tabOptions = scope.$eval(ds.value + '()');
                } else if (ds.type == 'local') {
                    tabOptions = options.ds.values;
                }
                scope.name = options.name;
                scope.options = tabOptions;
                scope.dataTextField = options.dataTextField;
            }

            scope.changeTabActive = function(tabData) {
                $timeout(function() {
                    scope.$emit('CHANGE_TAB_EVENT', tabData);
                }, 10);
            }
        }
    }

}


// =========================================================================
// Loading Button
// =========================================================================

angular.module('app').directive('brLoadButton', brLoadButton);
brLoadButton.$inject = [];

function brLoadButton() {
    return {
        restrict: 'AE',
        replace: true,
        scope: true,
        transclude: true,
        template: '<button type="submit" ladda-button="loading" data-style="slide-down" class="ladda-button"><span class = "ladda-label" ng-transclude></span></button>',
        link: function(scope, elem, attrs) {
            scope.loading = false;
            scope.clicked = false;

            elem.bind('click', function() {
                scope.clicked = true;
                scope.$eval(attrs.onClick);
            });

            scope.$on('LOADING_ON', function(event, data) {
                loadingOn();
            })

            scope.$on('LOADING_OFF', function(event, data) {
                loadingOff();
            })

            function loadingOn(data) {
                if (scope.clicked) {
                    scope.loading = true;
                }
            }

            function loadingOff() {
                scope.clicked = false;
                scope.loading = false;
            }


        }
    }

}

// =========================
// tooltip 
//=========================

angular.module('app').directive('tooltip', tooltip)
tooltip.$inject = [];

function tooltip() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            angular.element(element).click(function() {
                angular.element(element).tooltip('hide');
            })
        }
    }
};

// =========================
// Active
//=========================

angular.module('app').directive('brNgActive', brNgActive)
brNgActive.$inject = [];

function brNgActive() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            scope.$watch(function() {
                return angular.element(element).hasClass('active');
            }, function(value) {
                if (value == true) {
                    scope.$eval(attrs.brNgActive)
                }
            });

            angular.element(element).click(function() {
                scope.$eval(attrs.brNgActive);
            })

            // function isActive(value) {
            //     var classes = _.split(value, ' ');
            //     return _.contains(classes, 'active');
            // }
        }
    }
};

// =========================================================================
// ToolTip All
// =========================================================================
angular.module('app').directive('brTooltipNew', brTooltipNew);
brTooltipNew.$inject = ['$rootScope']

function brTooltipNew($rootScope) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            $(element).hover(function() {
                // on mouseenter
                $(element).tooltip('show');
            }, function() {
                // on mouseleave
                $(element).tooltip('hide');
            });
        }
    };
}


// =========================================================================
// Field
// =========================================================================
angular.module('app').directive('brEnquiry', brEnquiry);

brEnquiry.$inject = ['AttributeMetaService', '$timeout', 'SchemaService', '$window', '$filter', 'UserConfigService', 'ColumanMetaDataService', 'EnquiryConfigService', 'MappingService', '$log', 'AuthService', 'ModalService', '$injector', 'TasksService', 'NotifyService'];

function brEnquiry(AttributeMetaService, $timeout, SchemaService, $window, $filter, UserConfigService, ColumanMetaDataService, EnquiryConfigService, MappingService, $log, AuthService, ModalService, $injector, TasksService, NotifyService) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'app/base/partials/br.enquiry.html',
        compile: function(scope, elem, attrs) {
            return {
                pre: function(scope, elem, attr) {
                    function init() {

                    }
                    init();
                },
                post: function(scope, elem, attrs, ctrl) {

                    scope.$watch(function() {
                        return readAttribute('datasource');
                    }, function(arg0) {
                        prepareDataSource(arg0);
                    });

                    var originalEnquiryData = {}

                    scope.$watch('enquiryData', function(modifiedEnqData, oldEnqData) {
                        enableSaveAction(modifiedEnqData);
                        updateModifiedData(modifiedEnqData)
                    }, true);


                    function prepareDataSource(ds) {
                        if (!ds) {
                            scope.enquiryData = {}
                            scope.sections = []
                        } else if (ds.type == 'local') {
                            var data = ds.values;
                            if (angular.isArray(data)) {
                                if (data.length > 0) {
                                    scope.enquiryData = data[0];
                                } else {
                                    scope.enquiryData = {}
                                }
                            } else {
                                scope.enquiryData = data;
                            }
                            originalEnquiryData = angular.copy(scope.enquiryData);
                            scope.showScroll = false;
                            scope.sections = getSections(scope.enquiryData);
                            prepareEnquiryTitle();
                            prepareHeader();
                            prepareSections();
                            setEnquiryBodyHeight();
                        }
                    }

                    function setEnquiryBodyHeight() {
                        $timeout(adjustEnquiryBodyHeight, 100);
                    }

                    function adjustEnquiryBodyHeight() {
                        var modalBodyElem = angular.element(".enquiry-body");
                        var header = angular.element(".enquiry-header");
                        var applicableHeight = $window.innerHeight - 40 - 52 - header.innerHeight() - 75;
                        if (modalBodyElem.innerHeight() > applicableHeight) {
                            modalBodyElem.height(applicableHeight);
                            scope.showScroll = true;
                        }
                    }

                    function init() {
                        scope.preferences = getPreferences();
                        var options = readAttribute('options');
                        scope.type = options.type;
                        var metaData = AttributeMetaService.get(scope.type);
                        scope.fields = metaData.fields
                        scope.sections = getSections(scope.enquiryData);
                        scope.enquiryConfig = EnquiryConfigService.get();
                    }

                    function prepareHeader() {

                        var keyEnquiryDetails = getEnquiryTypeDetails('keyHeaders');

                        scope.keyHeaderAttrs = [];
                        angular.forEach(keyEnquiryDetails, function(item) {
                            if (item.type && item.type === "CUSTOM") {
                                var obj = {};
                                obj.type = item.type;
                                obj.DisplayLabel = item.DisplayLabel;
                                obj.ODSKey = scope.preferences.referenceTypes;
                                obj.referenceType = getRefenceType(scope.preferences.referenceTypes);
                                scope.keyHeaderAttrs.push(obj);
                            }
                            var keyAttribute = _.find(scope.fields, { ODSKey: item.field });
                            if (keyAttribute)
                                item.link ? keyAttribute["link"] = true : keyAttribute["link"] = false;

                            keyAttribute ? scope.keyHeaderAttrs.push(keyAttribute) : '';
                        });
                    }

                    function getEnquiryMapping(enqType) {
                        var type = "";
                        var options = readAttribute('options');
                        if (options.isMapping) {
                            type = MappingService.get(options.mapping, enqType);
                        } else {
                            type = enqType;
                        }
                        return type;
                    }

                    function prepareEnquiryTitle() {
                        var enquiryList = scope.enquiryConfig[scope.type];
                        var titles = enquiryList.titles;
                        var title = "";
                        _.each(titles, function(item, index) {
                            if (item.type == "CONST" && item.value) {
                                title += item.value;
                                title += getColon(titles, index);
                            } else if (item.type == "DYNAMIC" && item.field) {
                                title += scope.enquiryData[item.field] ? scope.enquiryData[item.field] : item.default;
                                title += getColon(titles, index);
                            }
                        })
                        scope.$parent.$parent.title = title;
                    }

                    function getColon(titles, index) {
                        var str = "";
                        if (titles.length > index + 1) {
                            str = " : ";
                        }
                        return str;
                    }

                    function getRefenceType(keyValue) {
                        var referenceType = ""
                        var key = "Instrument." + keyValue;
                        var field = ColumanMetaDataService.get(key);
                        if (field)
                            referenceType = field.DisplayLabel;
                        return referenceType;
                    }

                    function prepareSections() {
                        scope.keySectionsData = getEnquiryTypeDetails('keySections')

                        scope.keySectionTags = _.pluck(scope.keySectionsData, 'Tag');
                        scope.nonKeySections = _.difference(scope.sections, scope.keySectionTags);
                        scope.keySections = [];
                        _.each(scope.keySectionTags, function(section) {
                            var data = {}
                            data.tag = section;
                            data.attributes = prepareSectionAttributes(section);

                            prepareListOptions(section, 'components') ? data.components = prepareListOptions(section, 'components') : '';
                            prepareListOptions(section, 'displayType') ? data.displayType = prepareListOptions(section, 'displayType') : '';
                            prepareListOptions(section, 'ds') ? data.ds = prepareListOptions(section, 'ds') : '';
                            scope.keySections.push(data);
                        })
                    }

                    function prepareListOptions(section, type) {
                        var attrData = _.find(scope.keySectionsData, { Tag: section })[type];
                        return attrData;
                    }

                    function validateEnquiryType(enqType, enquiryList) {
                        var obj = {};
                        if (_.find(enquiryList.Types, { name: enqType })) {
                            obj = _.find(enquiryList.Types, { name: enqType });
                        } else {
                            obj = _.find(enquiryList.Types, function(item) {
                                return item.isDefault == true;
                            });
                        }
                        return obj;
                    }

                    function prepareSectionAttributes(section) {
                        var keySectionObj = _.find(scope.keySectionsData, { Tag: section });
                        var attributes = $filter('filter')(scope.fields, { 'Tags': section });
                        var keyAttributes = _.pluck(keySectionObj.attributes, 'field');
                        var nonKeyAttributes = _.difference(_.pluck(attributes, 'ODSKey'), keyAttributes);
                        var totalAttributes = _.union(prepeareKeyAttributes(keyAttributes, attributes), prepeareNonKeyAttributes(nonKeyAttributes, attributes));
                        return totalAttributes;
                    }

                    function prepeareKeyAttributes(keyAttributes, attributes) {
                        var attributesArray = [];
                        _.each(keyAttributes, function(key) {
                            var obj = {};
                            _.each(attributes, function(attr) {
                                if (key == attr.ODSKey) {
                                    obj.DisplayLabel = attr.DisplayLabel;
                                    obj.Datatype = attr.Datatype;
                                    obj.DisplayValue = scope.enquiryData[attr.ODSKey];
                                }
                            });
                            attributesArray.push(obj);
                        });
                        return attributesArray;
                    }

                    function prepeareNonKeyAttributes(nonKeyAttributes, attributes) {
                        var attributesArray = [];
                        _.each(nonKeyAttributes, function(key) {
                            _.each(attributes, function(attr) {
                                var obj = {};
                                if (key == attr.ODSKey && scope.enquiryData[attr.ODSKey]) {
                                    obj.DisplayLabel = attr.DisplayLabel;
                                    obj.Datatype = attr.Datatype;
                                    obj.DisplayValue = scope.enquiryData[attr.ODSKey];
                                    attributesArray.push(obj);
                                } else if (key == attr.ODSKey && attr.cardinality == "*") {
                                    var obj = {};
                                    var data = []
                                    var listData = scope.enquiryData[attr.container];
                                    listData ? data = listData[attr.ODSKey] : [];
                                    if (key == "Comment") {
                                        var commentList = _.sortBy(data, function(comment) {
                                            return new Date(comment.Date);
                                        }).reverse();
                                        obj.list = commentList;
                                        obj.ODSKey = key;
                                    } else
                                    if (key == "Description") {
                                        obj.list = data;
                                        obj.ODSKey = key;
                                    }
                                    attributesArray.push(obj);
                                }
                            });
                        });
                        var sotedArray = _.sortBy(attributesArray, function(o) {
                            return o.DisplayLabel;
                        })
                        return sotedArray;
                    }

                    function readAttribute(attrName) {
                        if (attrs[attrName]) {
                            return scope.$eval(attrs[attrName]);
                        }
                        return;
                    }

                    function getSections(data) {
                        var tagsList = _.pluck(scope.fields, 'Tags');
                        tagsList = tagsList.toString();
                        var list = angular.toJson(tagsList);
                        var sections = _.filter(_.sortBy(_.without(_.uniq(_.map(list.replace(/"/g, "").replace("[", "").replace("]", "").split(","), function(item) {
                            return item.trim();
                        })), "Header")));

                        var finalSections = [];
                        angular.forEach(sections, function(section) {
                            if (isSectionInclude(section, data)) {
                                finalSections.push(section);
                            }
                        })

                        return finalSections;
                    }

                    function isSectionInclude(section, data) {
                        var items = _.filter(scope.fields, function(item) {
                            return _.contains(_.map(item.Tags, function(tag) {
                                return tag.trim();
                            }), section);
                        });

                        var isInclude = false;
                        angular.forEach(items, function(item) {
                            if (!isInclude) {
                                if (data && data[item.ODSKey]) {
                                    isInclude = true;
                                }
                            }
                        })
                        return isInclude;
                    }

                    scope.priceDataFormatting = function(obj) {
                        var price = '';
                        if (obj) {
                            price += scope.enquiryData['SettlementCurrency'] ? scope.enquiryData['SettlementCurrency'] + ' ' : '';
                            if (obj.Price || obj.Price == 0) {
                                price += applyNumberFormat(obj.Price);
                            }
                        }
                        return price;
                    }

                    scope.amountDataFormatting = function(obj) {
                        var amount = '';
                        if (obj) {
                            amount += obj.Currency ? obj.Currency + ' ' : '';
                            if (obj.Value || obj.Value == 0) {
                                amount += applyNumberFormat(obj.Value);
                            }
                        }
                        return amount;
                    }

                    function applyNumberFormat(data) {
                        if (!data) {
                            if (data == 0) {
                                return data;
                            } else {
                                return;
                            }
                        }
                        var parts = data.toString().split(".");
                        if (scope.preferences.amtFormat == "HUNDRED") {
                            parts[0] = parts[0].replace(/(\d)(?=(\d\d)+\d$)/g, "$1" + scope.preferences.onScreenDelimiter);
                        } else {
                            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, scope.preferences.onScreenDelimiter);
                        }
                        return parts.join(scope.preferences.decimalSeperator);
                    }

                    function getPreferences() {
                        var prefs = '';
                        UserConfigService.getPreferences(function(preferences) {
                            prefs = preferences;
                        })
                        return prefs;
                    }

                    scope.isEditable = function(section, field) {
                        var editableItem = getEditableItem(section, field)
                        var hasAccess = false;
                        if (editableItem && editableItem.entitlement) {
                            hasAccess = AuthService.isActionEntitled(editableItem.entitlement.functionality, editableItem.entitlement.action);
                        }

                        var isAttributeEditable = false;
                        if (editableItem && editableItem.accessibility) {
                            var actionObj = editableItem.accessibility;
                            var service = $injector.get(actionObj.service);
                            isAttributeEditable = service[actionObj.method](originalEnquiryData);
                        }
                        return (_.isObject(editableItem) && hasAccess && isAttributeEditable);
                    }

                    scope.getEditableAttribute = function(section, field) {
                        var editableAttribute = getEditableItem(section, field)
                        return editableAttribute;
                    }

                    function getEditableItem(section, field) {
                        var items = getEnquiryTypeDetails('editableAttributes');
                        var editableItem = '';
                        if (items) {
                            if (section && field) {
                                editableItem = _.find(items, { 'section': section, 'field': field.ODSKey });
                            } else if (field) {
                                editableItem = _.find(items, { 'field': field.ODSKey });
                            }
                        }
                        return editableItem;
                    }

                    function getEnquiryTypeDetails(type) {
                        var enquiryList = scope.enquiryConfig[scope.type];
                        var enqType = "";
                        if (enquiryList.resource) {
                            enqType = scope.enquiryData[enquiryList.resource] ? scope.enquiryData[enquiryList.resource] : "";
                        } else {
                            enqType = "";
                        }

                        enqType = getEnquiryMapping(enqType);
                        var keyEnquiryDetails = validateEnquiryType(enqType, enquiryList)[type];
                        return keyEnquiryDetails;
                    }

                    function enableSaveAction(modifiedEnqData) {
                        var isEqual = _.isEqual(originalEnquiryData, modifiedEnqData);
                        ModalService.setActionEnabled(!isEqual);
                    }

                    /**
                     * updates the modified inlineEditable data to ModalService 
                     * @param {object} modifiedEnqData - The modifiedEnqData .                    
                     */
                    function updateModifiedData(modifiedEnqData) {

                        var modifiedFields = {};
                        _.forOwn(modifiedEnqData, function(value, key) {
                            if (!_.isEqual(value, originalEnquiryData[key])) {
                                modifiedFields[key] = value;
                                modifiedFields['Identifier'] = modifiedEnqData['Identifier'];
                            }
                        });
                        ModalService.updateInlineEditableData(modifiedFields);
                    }

                    scope.amend = function(cmp, section) {
                        section['Identifier'] = originalEnquiryData['Identifier'];
                        if (cmp && cmp.actionConfig) {
                            var actionObj = cmp.actionConfig.options;
                            var service = $injector.get(actionObj.service);
                            service[actionObj.method](section, function(resp) {
                                if (!resp.status) {
                                    NotifyService.notifyError(resp.message);
                                }
                            });
                        }
                    }
                    scope.isComponentDisabled = function(section) {
                        var disabled = false;
                        if (section.entitlement) {
                            var hasAccess = AuthService.isActionEntitled(section.entitlement.functionality, section.entitlement.action);
                            (!hasAccess) ? disabled = true: false;
                        } else {
                            var fields = _.pluck(section.components, 'field');
                            var isActionEnabled = false;
                            _.each(fields, function(field) {
                                if (field) {
                                    section[field] ? isActionEnabled = true : false;
                                }
                            });

                            var isEditable = false;
                            _.each(section.components, function(item) {
                                if (item && item.accessibility) {
                                    var actionObj = item.accessibility;
                                    var service = $injector.get(actionObj.service);
                                    isEditable = service[actionObj.method](originalEnquiryData);
                                } else if (item && item.defaultAccess) {
                                    isEditable = item.defaultAccess;
                                }
                            })

                            disabled = !isActionEnabled || !isEditable;
                        }
                        return disabled;
                    }

                    init();
                }
            }
        }
    }
};


// =========================================================================
// Modal Link
// =========================================================================

angular.module('app').directive('brModalLink', brModalLink);

brModalLink.$inject = ['$uibModal'];

function brModalLink($uibModal) {
    return {
        restrict: 'A',
        scope: true,
        link: function(scope, element, attrs) {
            angular.element(element).on('click', function() {
                $uibModal.open({
                    templateUrl: 'app/base/partials/br.modal.window.html',
                    controller: 'ModalInstanceController',
                    size: 'br-grid',
                    resolve: {
                        title: function() {
                            return scope.title;
                        },
                        name: function() {
                            return scope.name;
                        },
                        field: function() {
                            return scope.field;
                        },
                        dataRecord: function() {
                            return scope.dataRecord;
                        }
                    }
                });
            });

            scope.$watch(attrs.datarecord, function(value) {
                scope.dataRecord = value;
            })

            attrs.$observe('title', function(value) {
                scope.title = value;
            });

            attrs.$observe('name', function(value) {
                scope.name = value;
            });

            attrs.$observe('field', function(value) {
                scope.field = value;
            });

        }
    };
};

angular.module('app').controller('ModalInstanceController', ModalInstanceController);

ModalInstanceController.$inject = ['$scope', '$uibModalInstance', '$window', '$filter', '$log', '$rootScope', 'SchemaService', 'UserConfigService', 'QueryService', 'ApiService', 'title', 'name', 'field', 'dataRecord', 'NotifyService', 'SessionService', 'TasksService', 'AuthService', 'ModalService', 'PdfExportService', '$injector'];

function ModalInstanceController(scope, $uibModalInstance, $window, $filter, $log, $rootScope, SchemaService, UserConfigService, QueryService, ApiService, title, name, field, dataRecord, NotifyService, SessionService, TasksService, AuthService, ModalService, PdfExportService, $injector) {







    if (dataRecord.checkedCount) {
        var count = dataRecord.checkedCount;
        scope.title = title.split("-")[0]
        scope.title += "- Total " + count + " Task(s) selected"
    } else {
        scope.title = title;
    }
    if (dataRecord.values) {
        dataRecord = dataRecord.values;
    }


    $rootScope.$on('$stateChangeStart', function(e, toState, toParams, fromState, fromParams) {
        $log.log('closing the modal')
        $uibModalInstance.close();
    });

    scope.$on('modal.closing', function(event, reason, closed) {

    });

    scope.close = function() {
        $uibModalInstance.close();
    };

    scope.taskAction = function(param, text) {
        TasksService.openTaskModal(param);
    }



    scope.save = function(footerItem) {
        if (footerItem && footerItem.actionConfig && footerItem.actionConfig.type == "DYNAMIC") {
            var actionObj = footerItem.actionConfig.options;
            var modifiedModalData = ModalService.getInlineEditableData();
            var service = $injector.get(actionObj.service);
            service[actionObj.method](modifiedModalData, function(resp) {
                if (resp.status) {
                    message = $rootScope.getWord("saved.successMsg");
                    NotifyService.notifySuccess(message);
                } else {
                    NotifyService.notifyError(resp.message);
                }
            });
        }
    }

    function getSelectedTaskIds(data) {
        var list = [];
        for (var key in data) {
            if (data[key] && key != 'headerbox') {
                list.push(key)
            }
        }
        return list;
    }

    scope.export = function() {
        PdfExportService.downloadEnquiryPDF();
    }

    scope.goTop = function(fieldName) {
        $window.scrollTo(0, 0);
    }

    function loadModalOptions(name) {
        var modalList = SchemaService.get('modalConfig');
        var modal = _.find(modalList, { name: name });
        _.each(modal.components, function(item) {
            if (item.type === 'widget') {
                UserConfigService.getViewByScreen(modal.resource, function(view) {
                    item.grid.view = angular.copy(view);
                });
            }
        });
        scope.options = modal;
        if (scope.options.ds) {
            var queryObj = _.find(scope.options.queries, { name: scope.options.ds.query })
            loadData(queryObj, scope.options.ds);
        }
    }

    function loadData(queryObj, ds) {
        var params = { "field": field }
        var query = QueryService.prepareQuery(queryObj, dataRecord, {}, params);
        ApiService.get(query.baseUrl, query.params).then(function(resp) {
            if (resp.data.error) {
                NotifyService.notifyError(resp.data.error.data);
            } else {
                var dataSource = {};
                dataSource.type = "local";
                if (ds.outputField) {
                    dataSource.values = resp.data[ds.outputField];
                } else {
                    dataSource.values = resp.data;
                }

                dataSource = _.extend(dataSource, ds);
                scope.modalDS = dataSource;
            }

        });

    }

    scope.brmodal = {
        apiData: {},
        isValid: true
    }


    function init() {
        scope.user = SessionService.getUserName();

        loadModalOptions(name);

        angular.forEach(scope.options.components, function(cmp) {
            if (cmp.type === 'multiselect') {
                if (cmp.selectedValue) {
                    scope.brmodal[cmp.field] = cmp.selectedValue;
                } else {
                    scope.brmodal[cmp.field] = []
                }
            } else if (cmp.type === 'singleselect') {
                if (cmp.selectedValue) {
                    scope.brmodal[cmp.field] = cmp.selectedValue;
                } else {
                    scope.brmodal[cmp.field] = []
                }
            } else if (cmp.type === 'daterangepicker') {
                if (cmp.selectedValue == "T") {
                    scope.brmodal[cmp.field] = { "startDate": new Date(), "endDate": new Date() };
                } else {
                    scope.brmodal[cmp.field] = '';
                }
            } else if (cmp.type === 'date') {
                if (cmp.selectedValue == "T") {
                    scope.brmodal[cmp.field] = new Date(), cmp.format;
                } else {
                    scope.brmodal[cmp.field] = '';
                }
            } else if (cmp.type === 'textarea') {
                scope.brmodal[cmp.field] = cmp.selectedValue;
            }

            if (cmp.ds) {
                if (cmp.ds.type === 'local') {
                    scope.brmodal.apiData[cmp.field] = cmp.ds.values;
                } else if (cmp.ds.type === 'api') {
                    ApiService.find(cmp.ds.resource, cmp.ds.params).then(function(resp) {
                        scope.brmodal.apiData[cmp.field] = resp.data.data
                    })
                } else if (cmp.ds.type == 'configService') {
                    UserConfigService[cmp.ds.method](cmp.ds.defaultValues, function(resp) {
                        scope.brmodal.apiData[cmp.field] = resp;
                        initDefault(scope.brmodal.apiData[cmp.field], cmp);
                    })
                }
            }
        })
    }

    function initDefault(data, cmp) {
        var defaultValue = _.find(data, { "default": true })
        var dafault = [];
        if (cmp.type === "multiselect") {
            dafault.push(defaultValue);
        } else {
            dafault = defaultValue;
        }
        if (defaultValue) {
            scope.brmodal[cmp.field] = dafault;
        }
    }

    function validate() {
        var isValid = true;
        var cmp = scope.options.components;
        angular.forEach(cmp, function(cmpField) {
            if (isValid) {
                if (cmpField.required == true) {
                    if (isEmpty(cmpField, scope.brmodal[cmpField.field])) {
                        if (cmpField.errorMsg) {
                            NotifyService.notifyError($rootScope.getWord(cmpField.errorMsg));
                        } else {
                            NotifyService.notifyError($rootScope.getWord(scope.options.validationMsgs.mandatoryMsg));
                        }
                        isValid = false;
                    }
                }
            }
            // NotifyService.hide();
        })
        return isValid;
    }

    function isEmpty(field, value) {
        var type = field.type;
        if (type == 'date') {
            if (value) {
                return false;
            } else {
                return true;
            }
        } else {
            return _.isEmpty(value);
        }
    }

    init();

};
