var Module = {};
var wam;

function loadWASM(){
    return new Promise((resolve, reject) => {
	fetch('../lib/filter_c.wasm')
	    .then(response => response.arrayBuffer())
	    .then(buffer => {

		Module.wasmBinary = buffer;

		script = document.createElement('script');
		doneEvent = new Event('done');
		script.addEventListener('done', buildWam);

		script.src = '../lib/filter_c.js';
		document.head.appendChild(script);

		function buildWam() {
		    const wam = {};

		    resolve(wam);
		};
	    });
    });
}

var a = performance.now();
loadWASM().then(module => {
    wam = module;
    let b = performance.now();
    let result = 'WASM Loading Time : ' + (Math.round((b-a)*100)/100) + ' ms';
    document.getElementById('loadingTime').innerHTML = result;
    //console.log("[WASM] JS Loading time : " + Math.round((b-c)*100)/100 + ' ms');
    script = document.createElement('script');
    script.src = './BenchWasm.js';
    document.head.appendChild(script);

});

