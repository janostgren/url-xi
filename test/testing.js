var testName = "KLKL KL  xx"
var r = testName.replace(/\s/g, '_')
console.info(r)


let min_ts_utc = timestamps_utc.reduce(function (a, b) {
    return Math.min(a, b);
});
uxs.setVar('min_ts_utc', min_ts_utc);
let severity_arr = uxs.getVar('severity_arr');
let ok_count = severity_arr.filter(function (item) {
    if (item === 'I')
        return true;
    else
        return false;
});