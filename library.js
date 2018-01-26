mergeInto(LibraryManager.library, {
    Stime: 0,
    Csv: [],
    Mtime_js__deps: [
        'Csv',
        'Stime'
    ],
    Mtime_js: function (index) {
        Etime = performance.now();
        if (index == 0) {
            _Csv += '' + Math.round((Etime - _Stime) * 100) / 100;
        } else {
            _Csv += ',' + Math.round((Etime - _Stime) * 100) / 100;
        }
        _Stime = Etime;
        if (index == 20) {
            _Csv += '\n';
            console.log(_Csv);
        }
    }
});
