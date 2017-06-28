angular.module('app').factory('BillsConfigService', BillsConfigService);

BillsConfigService.$inject = ['$log', '$http'];

function BillsConfigService($log, $http) {
    var service = {};
    var billsData = {};

    function setBillsCoreConfig(data) {
        billsData.billsConfig = data;
    }

    function getBillsCoreConfig() {
        return billsData.billsConfig;
    }

    service.init = function() {
        return $http.get('data.json').then(function(res) {
            var billsConfigDef = res.data || {};
            setBillsCoreConfig(billsConfigDef);
        });
    }

    service.get = function() {
        var billsConfigDef = getBillsCoreConfig();
        return billsConfigDef;
    }

    return service;

}
