angular.module('app.mocks', ['ngMockE2E']).run(initMocks)
initMocks.$inject = ['$httpBackend'];

function initMocks($httpBackend) {}

angular.module('app.mocks').factory('MockService', MockService);
MockService.$inject = ['$http', '$httpBackend', '$rootScope'];

function MockService($http, $httpBackend, $rootScope) {
    var settings = {}
    var mocks = {}

    var service = {};
    service.init = function() {
        console.log('inside real MockService')
            // defaults();

        var promise = $http({
            method: 'GET',
            url: 'mocks.json'
        });

        promise.success(function(data, status, headers, conf) {
            console.log('mocks inited')
            settings = data || {}
            load();
        });

        return promise;
    }

    service.enabled = function() {
        return settings && settings.enabled;
    }

    service.register = function(name, loader) {
        mocks[name] = loader;
        load();
    }

    service.unregister = function(name) {
        if (mocks[name]) {
            delete mocks[name];
            load();
        }
    }

    service.log = function(url) {
        if (!$rootScope.requestsMade) $rootScope.requestsMade = []

        if (!_.includes($rootScope.requestsMade, url)) {
            $rootScope.requestsMade.push(url)
        }
    }

    function load() {
        _.each(settings.mocks, function(item) {
            if (item.enabled && mocks[item.name]) {
                mocks[item.name]();
            }
        })
    }

    return service;
};


angular.module('app.mocks').factory('MockQueryService', MockQueryService);
MockQueryService.$inject = [];

function MockQueryService() {

    var MockQueryService = {};

    var operations = {
        "EQ": function(operand1, operand2) {
            return operand1 === operand2;
        },
        "GT": function(operand1, operand2) {
            return operand1 > operand2;
        },
        "LT": function(operand1, operand2) {
            return operand1 < operand2;
        },
        "GE": function(operand1, operand2) {
            return operand1 >= operand2;
        },
        "LE": function(operand1, operand2) {
            return operand1 <= operand2;
        },
        "IN": function(operand1, operand2) {
            return _.contains(operand2, operand1);
        },
        "NE": function(operand1, operand2) {
            return operand1 != operand2;
        }
    }


    MockQueryService.find = function(data, url) {
        var params = urlParse(url);
        var filterObj = getFilter(params.filter);
        var result = applyFilter(data, filterObj, "AND");
        return result;
    }

    function applyFilter(data, filterObj, cond) {
        var result = _.filter(data, function(row) {

            var orMatch = (applyOrFilter(row, filterObj.orFilter, cond)) ? true : false;
            var inMatch = (applyInFilter(row, filterObj.inFilter, cond)) ? true : false;
            var eqMatch = (applyCondFilter(row, filterObj.eqFilter, operations["EQ"], cond)) ? true : false;
            var gtMatch = (applyCondFilter(row, filterObj.gtFilter, operations["GT"], cond)) ? true : false;
            var ltMatch = (applyCondFilter(row, filterObj.ltFilter, operations["LT"], cond)) ? true : false;
            var geMatch = (applyCondFilter(row, filterObj.geFilter, operations["GE"], cond)) ? true : false;
            var leMatch = (applyCondFilter(row, filterObj.leFilter, operations["LE"], cond)) ? true : false;
            var neMatch = (applyCondFilter(row, filterObj.neFilter, operations["NE"], cond)) ? true : false;

            if (cond == "AND") {
                return inMatch && eqMatch && gtMatch && ltMatch && geMatch && leMatch && orMatch && neMatch;
            } else if (cond == "OR") {
                return inMatch || eqMatch || gtMatch || ltMatch || geMatch || leMatch || orMatch || neMatch;
            } else {
                return true;
            }

        });
        return result;
    }


    function applyOrFilter(row, orFilter, cond) {

        if (orFilter.length == 0) {
            return (cond == "AND") ? true : false;
        }

        for (var i = 0; i < orFilter.length; i++) {
            var item = orFilter[i];
            var data = [];
            data.push(row);
            var result = applyFilter(data, item, "OR")
            if (result.length == 0) {
                return false;
            }
        }
        return true;
    }

    function applyInFilter(row, inFilter, cond) {

        if (inFilter.length == 0) {
            return (cond == "AND") ? true : false;
        }

        var result = (cond == "AND") ? true : false;

        for (var i = 0; i < inFilter.length; i++) {
            var item = inFilter[i];
            if (!_.contains(item.values, row[item.field])) {
                result = (cond == "AND") ? result && false : result || false;
            } else {
                result = (cond == "AND") ? result && true : result || true;
            }
        }
        return result;
    }

    function applyCondFilter(row, eqFilter, fn, cond) {

        if (eqFilter.length == 0) {
            return (cond == "AND") ? true : false;
        }

        var result = (cond == "AND") ? true : false;

        for (var i = 0; i < eqFilter.length; i++) {
            var item = eqFilter[i];

            // Need to "remove" this code when CAEvent Integration is done
            if (item.values[0] === "null") {
                if (!fn(row[item.field], null)) {
                    result = (cond == "AND") ? result && false : result || false;
                } else {
                    result = (cond == "AND") ? result && true : result || true;
                }
            } else {
                if (!fn(row[item.field], item.values[0])) {
                    result = (cond == "AND") ? result && false : result || false;
                } else {
                    result = (cond == "AND") ? result && true : result || true;
                }
            }

            // Need to "add" this code when CAEvent Integration is done

            /*if (!fn(row[item.field], item.values[0])) {
                result = (cond == "AND") ? result && false : result || false;
            } else {
                result = (cond == "AND") ? result && true : result || true;
            }*/

        }
        return result;
    }


    function urlParse(url) {
        var urlObj = _.object(_.compact(_.map(url.split("?")[1].split("&"), function(param) {
            if (param) {
                return param.split("=");
            }
        })));

        return urlObj;
    }

    function getFilterObj(splitArray) {
        var filterObj = {};
        var inStr = " IN ",
            eqStr = " EQ ",
            geStr = " GE ",
            leStr = " LE ",
            gtStr = " GT ",
            ltStr = " LT ",
            orStr = " OR ",
            neStr = " NE ";
        var inArr = [],
            eqArr = [],
            geArr = [],
            leArr = [],
            gtArr = [],
            ltArr = [],
            orArr = [],
            neArr = [];
        angular.forEach(splitArray, function(item) {
            if (item.indexOf(orStr) > 0) {
                orArr.push(parseOrCond(item))
            } else if (item.indexOf(inStr) > 0) {
                inArr.push(parseCond(item, inStr));
            } else if (item.indexOf(eqStr) > 0) {
                eqArr.push(parseCond(item, eqStr));
            } else if (item.indexOf(geStr) > 0) {
                geArr.push(parseCond(item, geStr));
            } else if (item.indexOf(leStr) > 0) {
                leArr.push(parseCond(item, leStr));
            } else if (item.indexOf(gtStr) > 0) {
                gtArr.push(parseCond(item, gtStr));
            } else if (item.indexOf(ltStr) > 0) {
                ltArr.push(parseCond(item, ltStr));
            } else if (item.indexOf(neStr) > 0) {
                neArr.push(parseCond(item, neStr));
            }
        });

        filterObj.inFilter = inArr;
        filterObj.eqFilter = eqArr;
        filterObj.geFilter = geArr;
        filterObj.leFilter = leArr;
        filterObj.gtFilter = gtArr;
        filterObj.ltFilter = ltArr;
        filterObj.orFilter = orArr;
        filterObj.neFilter = neArr;
        return filterObj;
    }

    function getFilter(filterParam) {
        var andSplitArray = decodeURIComponent(filterParam.replace(/\+/g, " ")).split("AND");
        return getFilterObj(andSplitArray);
    }

    function parseOrCond(item) {
        var orArray = item.split(" OR ");
        var orObj = getFilterObj(orArray);
        return orObj;
    }

    function parseCond(item, splitString) {
        var filterArray = item.split(splitString);
        var tempObj = {};
        tempObj.field = filterArray[0].substring(filterArray[0].lastIndexOf(".") + 1);
        tempObj.values = _.map(filterArray[1].replace("(", "").replace(")", "").replace(/\"/g, "").split(","), function(item) {
            return item.trim();
        });
        return tempObj;
    }

    return MockQueryService;
};

angular.module('app').run(positionsMock)
positionsMock.$inject = ['$httpBackend', 'MockQueryService', 'MockService'];

function positionsMock($httpBackend, MockQueryService, MockService) {


    $httpBackend.when('GET', '/gptm-ui/api/Query?&asOfDate=2016-06-10&filter=Position.Entity+IN+(%22CMP2%22)+AND+Position.Ledger+IN+(%22SettleDated%22)+AND+Position.Instrument.DFReference+EQ+%22INSTR_A%22+AND+Position.PositionType+IN+(%22AutoBorrow%22)+AND+Position.PositionLedgerCategory+IN+(%22Cash%22)+AND+Position.LongOrShort+IN+(%22Long%22,%22Short%22)+AND+Position.Position+NE+0&lens=annotate&outputFormat=json&page=1&pivotBy=ledger&resource=positions&select=Position.Instrument.PEReference,Position.PositionTypeGroup,Position.PositionType,Position.Position,Position.Entity.PEReference,Position.Party1.Name,Position.Instrument.ShortName,Position.Instrument.DFReference,Position.Entity.DFReference,Position.Party1.DFReference&size=100').respond(function(method, url, data) {
        //console.info('Positions report mock called')
        MockService.log(url)

        var data = { "elapsed": 64.324, "timestamp": "14695378209259550", "count": 0, "page": 1, "size": 10, "Position": [] }
        return [200, data, {}];
    });

    $httpBackend.when('GET', '/gptm-ui/api/Query?&asOfDate=2016-06-28&filter=Position.Entity+IN+(%22CMP2%22)+AND+Position.Ledger+IN+(%22Projected%22,%22SettleDated%22,%22TradeDated%22)+AND+Position.PositionType+IN+(%22Book%22)+AND+Position.PositionLedgerCategory+IN+(%22Cash%22)+AND+Position.LongOrShort+IN+(%22Long%22,%22Short%22)+AND+Position.Position+NE+0&lens=annotate&outputFormat=json&page=1&pivotBy=ledger&resource=positions&select=Position.Instrument.PEReference,Position.PositionTypeGroup,Position.PositionType,Position.Position,Position.Entity.PEReference,Position.Party1.Name,Position.Instrument.ShortName,Position.Instrument.DFReference,Position.Entity.DFReference,Position.Party1.DFReference&size=100').respond(function(method, url, data) {
        // console.info('Positions report mock called')
        MockService.log(url)
        var data = { "elapsed": 562.073, "timestamp": "14697939611766670", "count": 72, "page": 1, "size": 10, "Position": [{ "PositionTypeGroup": "Inventory", "PositionType": "Book", "xxxPositionYYYYMMDD": null, "SettleDatedPosition20160628": -2275.420000000000048, "TradeDatedPosition20160628": -2275.420000000000048, "Instrument": { "PEReference": "AUD", "ShortName": "Australian Dollar", "DFReference": "AUD" }, "Entity": null, "Party1": { "Name": "BOOK_XXX_Name", "DFReference": "BOOK_XXX" } }, { "PositionTypeGroup": "Inventory", "PositionType": "Book", "xxxPositionYYYYMMDD": null, "SettleDatedPosition20160628": 5600, "TradeDatedPosition20160628": 5600, "Instrument": { "PEReference": "EUR", "ShortName": "Euro", "DFReference": "Euro" }, "Entity": null, "Party1": { "Name": "BOOK_X_Name", "DFReference": "BOOK_X" } }] }
        return [200, data, {}];
    });

    $httpBackend.when('GET', '/gptm-ui/api/Query?&asOfDate=2016-06-28&filter=Position.Entity+IN+(%22CMP2%22)+AND+Position.Ledger+IN+(%22Projected%22,%22SettleDated%22,%22TradeDated%22)+AND+Position.PositionType+IN+(%22Book%22)+AND+Position.PositionLedgerCategory+IN+(%22Cash%22)+AND+Position.LongOrShort+IN+(%22Long%22,%22Short%22)+AND+Position.Position+NE+0&lens=annotate&outputFormat=json&page=1&pivotBy=ledger&resource=positions&select=Position.Instrument.PEReference,Position.PositionTypeGroup,Position.PositionType,Position.Position,Position.Entity.PEReference,Position.Party1.Name,Position.Instrument.ShortName,Position.Instrument.DFReference,Position.Entity.DFReference,Position.Party1.DFReference&size=10000').respond(function(method, url, data) {
        // console.info('positions_pdf_export report mock called')
        MockService.log(url)
        var data = { "elapsed": 562.073, "timestamp": "14697939611766670", "count": 72, "page": 1, "size": 10, "Position": [{ "PositionTypeGroup": "Inventory", "PositionType": "Book", "xxxPositionYYYYMMDD": null, "SettleDatedPosition20160628": -2275.420000000000048, "TradeDatedPosition20160628": -2275.420000000000048, "Instrument": { "PEReference": "AUD", "ShortName": "Australian Dollar", "DFReference": "AUD" }, "Entity": null, "Party1": { "Name": "BOOK_XXX_Name", "DFReference": "BOOK_XXX" } }, { "PositionTypeGroup": "Inventory", "PositionType": "Book", "xxxPositionYYYYMMDD": null, "SettleDatedPosition20160628": 5600, "TradeDatedPosition20160628": 5600, "Instrument": { "PEReference": "EUR", "ShortName": "Euro", "DFReference": "Euro" }, "Entity": null, "Party1": { "Name": "BOOK_X_Name", "DFReference": "BOOK_X" } }] }
        return [200, data, {}];
    });

    $httpBackend.when('GET', '/gptm-ui/api/Query?&asOfDate=2016-06-28&filter=Position.Entity+IN+(%22CMP2%22)+AND+Position.Ledger+IN+(%22Projected%22,%22SettleDated%22,%22TradeDated%22)+AND+Position.PositionType+IN+(%22Book%22)+AND+Position.PositionLedgerCategory+IN+(%22Cash%22)+AND+Position.LongOrShort+IN+(%22Long%22,%22Short%22)+AND+Position.Position+NE+0&lens=annotate&outputFormat=json&page=1&pivotBy=ledger&resource=positions&select=Position.Instrument.PEReference,Position.PositionTypeGroup,Position.PositionType,Position.Position,Position.Entity.PEReference,Position.Party1.Name,Position.Instrument.ShortName,Position.Instrument.DFReference,Position.Entity.DFReference,Position.Party1.DFReference&size=72').respond(function(method, url, data) {
        // console.info('positions_export report mock called')
        MockService.log(url)
        var data = { "elapsed": 562.073, "timestamp": "14697939611766670", "count": 72, "page": 1, "size": 10, "Position": [{ "PositionTypeGroup": "Inventory", "PositionType": "Book", "xxxPositionYYYYMMDD": null, "SettleDatedPosition20160628": -2275.420000000000048, "TradeDatedPosition20160628": -2275.420000000000048, "Instrument": { "PEReference": "AUD", "ShortName": "Australian Dollar", "DFReference": "AUD" }, "Entity": null, "Party1": { "Name": "BOOK_XXX_Name", "DFReference": "BOOK_XXX" } }, { "PositionTypeGroup": "Inventory", "PositionType": "Book", "xxxPositionYYYYMMDD": null, "SettleDatedPosition20160628": 5600, "TradeDatedPosition20160628": 5600, "Instrument": { "PEReference": "EUR", "ShortName": "Euro", "DFReference": "Euro" }, "Entity": null, "Party1": { "Name": "BOOK_X_Name", "DFReference": "BOOK_X" } }] }
        return [200, data, {}];
    });



    // $httpBackend.whenGET(/.*Query.*resource=positions.*/).respond(function(method, url, data) {
    //     var positionsData = [{ "PositionTypeGroup": "Inventory", "PositionType": "Book", "xxxPositionYYYYMMDD": null, "SettleDatedPosition20160628": -2275.420000000000048, "TradeDatedPosition20160628": -2275.420000000000048, "Instrument": { "ProcessingSystemReference": "AUD", "ShortName": "Australian Dollar", "DFReference": "AUD" }, "Entity": null, "Party1": { "Name": "BOOK_XXX_Name", "DFReference": "BOOK_XXX" } }, { "PositionTypeGroup": "Inventory", "PositionType": "Book", "xxxPositionYYYYMMDD": null, "SettleDatedPosition20160628": 5600, "TradeDatedPosition20160628": 5600, "Instrument": { "ProcessingSystemReference": "EUR", "ShortName": "Euro", "DFReference": "EUR" }, "Entity": null, "Party1": { "Name": "BOOK_X_Name", "DFReference": "BOOK_X" } }]

    //     var result = MockQueryService.find(positionsData, url);
    //     var resultObj = {};
    //     resultObj.count = result.length;
    //     resultObj.elapsed = 100.100;
    //     resultObj.page = 1;
    //     resultObj.size = 30;
    //     resultObj.Position = result;
    //     return [200, resultObj, {}];
    // });

    function loader() {

    }

    MockService.register('positions', loader);
};
angular.module('app').run(passMock)
passMock.$inject = ['$httpBackend', 'MockQueryService', 'MockService'];

function passMock($httpBackend, MockQueryService, MockService) {
    $httpBackend.whenGET(/.*/).passThrough()
    $httpBackend.whenPOST(/.*/).passThrough()
    $httpBackend.whenPUT(/.*/).passThrough()
    $httpBackend.whenPATCH(/.*/).passThrough()
    $httpBackend.whenDELETE(/.*/).passThrough()
};
