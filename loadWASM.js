var Module = {};
var wam;

function loadWASM(){
    return new Promise((resolve, reject) => {
	fetch('./lib/filter_c.wasm')
	    .then(response => response.arrayBuffer())
	    .then(buffer => {
		Module.wasmBinary = buffer;

		script = document.createElement('script');
		doneEvent = new Event('done');
		script.addEventListener('done', buildWam);

		script.src = './lib/filter_c.js';
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
    console.log("[WASM]Loading time : " + Math.round((b-a)*100)/100);
    let script = document.createElement('script');
    script.src = './wasmFilter.js';
    document.head.appendChild(script);
});
