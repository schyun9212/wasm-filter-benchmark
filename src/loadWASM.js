var Module = {};
var wam;

function loadWASM(){
    return new Promise((resolve, reject) => {
	fetch('../lib/filter_c.wasm')
	    .then(response => response.arrayBuffer())
	    .then(buffer => {
		c = performance.now();
		console.log("[WASM] File I/O time : " + Math.round((c-a)*100)/100 + ' ms');

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

var c;
var a = performance.now();
loadWASM().then(module => {
    wam = module;
    let b = performance.now();
    console.log("[WASM] JS Loading time : " + Math.round((b-c)*100)/100 + ' ms');
    script = document.createElement('script');
    script.src = './src/wasmFilter.js';
    script.onload = function(){
	loadScript('./Benchmark.js');
    }
    document.head.appendChild(script);

    function loadScript(src){
	script = document.createElement('script');
	script.src = src;
	document.head.appendChild(script);
    }
});

