var Stime = 0;
var Csv = [];
function Mtime_js(index){
    Etime = performance.now();
    if (index == 0){ Csv += '' + Math.round((Etime-Stime)*100)/100; }
    else { Csv += "," + Math.round((Etime-Stime)*100)/100; }
    Stime = Etime;
    if (index == 20) { Csv += '\n'; console.log(Csv); }
}

var st, et;
function Itime_js(index){
    if (index == 0){
	st = performance.now();
    }
    else {
	et = performance.now();
	console.log(et-st);
    }
}
