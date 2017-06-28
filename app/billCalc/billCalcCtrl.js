"use strict";

angular.module('app.billCalc').controller('BillCalcController', BillCalcController);
BillCalcController.$inject = ['$scope', '$state', '$q', '$timeout', 'BillsConfigService'];

function BillCalcController(scope, $state, $q, $timeout, BillsConfigService) {
    scope.message = "Bill Calucaution Screen Called"

    scope.signout = function() {
        $state.go('login');
    }

    scope.billCalculationPerHead = function(data) {
        scope.showDetails = false;
        var uniqueNames = getUniqueNames();
        var getIndividualBills = getIndividualSum(uniqueNames);
        scope.finalBills = getIndividualBills;
        var totalAmount = getTotalAmount(scope.finalBills);
        scope.totalCount = totalAmount;
        scope.showDetails = true;
    }

    function getTotalAmount(finalBills) {
        var individualAmounts = _.pluck(finalBills, "Amount");
        var finalBill = 0;
        _.each(individualAmounts, function(amountItem) {
            finalBill += amountItem;
        });

        return finalBill;
    }

    function getIndividualSum(names) {
        var finalArr = [];
        var billsData = getBillData();
        _.each(names, function(name) {
            var individualBills = _.filter(billsData, function(billItem) {
                return billItem.Name === name
            });
            var getSumOfIndividualBill = getSumOfBills(individualBills);
            var obj = {};
            obj.Name = name;
            obj.Amount = getSumOfIndividualBill;
            finalArr.push(obj);
        })
        return finalArr;
    }

    function getSumOfBills(individualBills) {
        var stringAmounts = _.pluck(individualBills, 'Amount');
        var amounts = stringToNumberConversion(stringAmounts);
        var finalSum = 0;
        _.each(amounts, function(amount) {
            finalSum = finalSum + amount;
        })
        return finalSum;
    }

    function stringToNumberConversion(stringAmounts) {
        var finalArr = [];
        _.each(stringAmounts, function(amount) {
            var amt = parseInt(amount);
            finalArr.push(amt);
        })
        return finalArr;
    }

    function getUniqueNames() {
        var uniqueNames = _.uniq(getBillData(), "Name");
        uniqueNames = _.pluck(uniqueNames, 'Name');;
        return uniqueNames;
    }

    function getBillForEachPerson() {
        var bills = scope.bills;
        console.log('Bill Details ', bills);
    }

    function getBillData() {
        var billsData = BillsConfigService.get();
        return billsData;
    }

    function init() {
        var billData = getBillData();
        scope.bills = billData;
    }

    init();

}
