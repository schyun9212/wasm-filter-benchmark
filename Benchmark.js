let PreviewCTX;

const loadImage = src => {
    while (container.childElementCount){ container.removeChild(container.lastChild); }
    const img = new Image();
    img.addEventListener("load", () => {
	const canvas = document.createElement('canvas');
	canvas.id = 'PreviewCanvas';
	canvas.height = img.height;
	canvas.width = img.width;
	PreviewCTX = canvas.getContext('2d');
	PreviewCTX.drawImage(img, 0, 0);
	container.appendChild(canvas);
    });
    img.src = src;
};

window.addEventListener('load', () => {

    loadImage('./image.png');

    convert.addEventListener("click", () => {
	while (container.lastChild.id != 'PreviewCanvas'){ container.removeChild(container.lastChild); }
	var FilterData = new Object;
	const width = PreviewCTX.canvas.width;
	const height = PreviewCTX.canvas.height;
	const imageData = PreviewCTX.getImageData(0, 0, width, height).data;

	let start = performance.now();
	FilterData.len = imageData.length;
	FilterData.mem = _malloc(FilterData.len);
	FilterData.out = _malloc(FilterData.len);
	HEAPU8.set(imageData, FilterData.mem);
	let end = performance.now();
	console.log('[WASM] AllocTime : ' + Math.round((end - start)*100)/100 + ' ms');

	/* js Filtering */
	start = performance.now();
	const jsCanvas = document.createElement('canvas');
	jsCanvas.width = width
	jsCanvas.height = height;
	jsCanvas.id = 'jsCanvas';
	const jsCtx = jsCanvas.getContext('2d');
	let jsPixels = jsCtx.createImageData(width,height);
	const jsResult = JSsharpen(imageData, width, height);
	jsPixels.data.set(jsResult);
	jsCtx.putImageData(jsPixels, 0, 0);
	container.appendChild(jsCanvas);
	end = performance.now();
	console.log('[JS] Filtering Time : ' + Math.round((end - start)*100)/100 + ' ms');

	/* wasm WebGL Filtering */
	start = performance.now();
	const wasmWebGlCanvas = document.createElement('canvas');
	wasmWebGlCanvas.width = width;
	wasmWebGlCanvas.height = height;
	wasmWebGlCanvas.id = 'wasmWebGlCanvas';
	const memID = _malloc(wasmWebGlCanvas.id.length + 1);
	Module.stringToUTF8(wasmWebGlCanvas.id, memID, wasmWebGlCanvas.id.length + 1);
	const wasmGlCtx = wasmWebGlCanvas.getContext('webgl2');
	container.appendChild(wasmWebGlCanvas);

	const filter = "Sharpen";
	const memFilter = _malloc(filter.length+1);
	Module.stringToUTF8(filter, memFilter, filter.length+1);
	_Sharpen(FilterData.mem, width, height, memFilter, memID, 0);
	end = performance.now();
	console.log('[WASM with WebGL] Filtering Time : ' + Math.round((end - start)*100)/100 + ' ms');
	_free(memFilter);

	/* wasm Filtering */
	start = performance.now();
	const wasmCanvas = document.createElement('canvas');
	wasmCanvas.width = width;
	wasmCanvas.height = height;
	wasmCanvas.id = 'wasmCanvas';
	const wasmCtx = wasmCanvas.getContext('2d');

	const divisor = 1, bias = 0, count = 1;
	const kernel = [[0, -1, 0], [-1, 5, -1], [0, -1, 0]];
	const kWidth = kernel[0].length, kHeight = kernel.length;
	const kLen = kWidth * kHeight;
	const flatKernel = kernel.reduce((acc, cur) => acc.concat(cur));
	const memKernel = _malloc(kLen * Float32Array.BYTES_PER_ELEMENT);
	HEAPF32.set(flatKernel, memKernel / Float32Array.BYTES_PER_ELEMENT);
	_ConvFilter(FilterData.mem, width, height, memKernel, kWidth, kHeight, divisor, bias, count, FilterData.out);
	_free(memKernel);
	let wasmPixels = wasmCtx.createImageData(width, height);
	const wasmResult = HEAPU8.subarray(FilterData.out, FilterData.out + FilterData.len);
	wasmPixels.data.set(wasmResult);
	wasmCtx.putImageData(wasmPixels, 0, 0);
	container.appendChild(wasmCanvas);
	end = performance.now();
	console.log('[WASM] Filtering Time : ' + Math.round((end - start)*100)/100 + ' ms');

	/* free memory */
	_free(FilterData.mem);


    });
    fileInput.addEventListener("change", event => loadImage(URL.createObjectURL(event.target.files[0])))
});
