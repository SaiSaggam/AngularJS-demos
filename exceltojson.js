var xls2json = require("xls-to-json");

function init() {
    xls2json({
        input: "allowances.xlsx", // input xls 
        output: "data.json", // output json 
        sheet: "October" // specific sheetname 
    }, function(err, result) {
        if (err) {
            console.error(err);
        } else {
            console.log(result);
        }
    });
}

init();
