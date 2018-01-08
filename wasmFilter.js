function wasmFilter(image, width, height, index){
    var FilterData = new Object;

    /* A preview canvas to get image pixel data */
    var offscreenCanvas = document.createElement('canvas');
    var context = offscreenCanvas.getContext('2d');

    context.canvas.width = width;
    context.canvas.height = height;

    // draw image to canvas
    context.drawImage(image, 0, 0, width, height);

    // get pixel data from canvas
    var pixels = context.getImageData(0, 0, context.canvas.width, context.canvas.height);

    // store wasm mem data
    FilterData.len = pixels.data.length;
    FilterData.mem = _malloc(FilterData.len);
    FilterData.out = _malloc(FilterData.len);
    HEAPU8.set(pixels.data, FilterData.mem);

    /* target canvas used by webgl */
    const targetCanvas = document.createElement('canvas');
    targetCanvas.width = width;
    targetCanvas.height = height;
    targetCanvas.id = "glCanvas_"+ index;
    const memID = _malloc(targetCanvas.id.length + 1);
    Module.stringToUTF8(targetCanvas.id, memID, targetCanvas.id.length + 1);
    const GLcontext = targetCanvas.getContext("webgl2");
    dummyCanvas.appendChild(targetCanvas);

    return {
	contrast : function( alpha ){
	    _Contrast(FilterData.mem, FilterData.len, alpha );
	},
	brightness : function( brightness ){
	    _Brighten(FilterData.mem, FilterData.len, brightness);
	},
	conv : function ( kernel, divisor, bias, count){
	    const kWidth = kernel[0].length;
	    const kHeight = kernel.length;
	    const kLen = kWidth * kHeight;
	    const flatKernel = kernel.reduce((acc, cur) => acc.concat(cur));
	    const memKernel = _malloc(kLen * Float32Array.BYTES_PER_ELEMENT);
	    HEAPF32.set(flatKernel, memKernel / Float32Array.BYTES_PER_ELEMENT);
	    _ConvFilter(FilterData.mem, width, height, memKernel, kWidth, kHeight, divisor, bias, count, FilterData.out);
	    _free(memKernel);
	    const temp = FilterData.out;
	    FilterData.out = FilterData.mem;
	    FilterData.mem = temp;
	},
	sharpen : function (){
	    kernel = [[0, -1, 0], [-1, 5, -1], [0, -1, 0]];
	    var divisor = 1, bias = 0, count = 1;
	    this.conv(kernel, divisor, bias, count);
	},
	unsharp : function (){
	    kernel = [[1, 4, 6, 4, 1], [4, 16, 24, 16, 4], [6, 24, -476, 24, 6], [4, 16, 24, 16, 4], [1, 4, 6, 4, 1]];
	    var divisor = -256, bias = 0, count = 1;
	    this.conv(kernel, divisor, bias, count);
	},
	getImage : function(){
	    return HEAPU8.subarray(FilterData.mem, FilterData.mem + FilterData.len);
	},
	glSharpen : function (){
	  const filter = "Sharpen";
	  const memFilter = _malloc(filter.length+1);
	  Module.stringToUTF8(filter, memFilter, filter.length+1);
	  _Sharpen(FilterData.mem, width, height, memFilter, memID, index);
	  _free(memFilter);
	},
	glGetImage : function(){
	    // return Canvas? ImageData?
	    return targetCanvas;
	}
    }
}

function JSsharpen(data, width, height){
    kernel = [[0, -1, 0], [-1, 5, -1], [0, -1, 0]];
    var divisor = 1, bias = 0, count = 1;
    return js_convFilter(data, width, height, kernel, divisor, bias, count);
}

function JSunsharp(data, width, height){
    kernel = [[1, 4, 6, 4, 1], [4, 16, 24, 16, 4], [6, 24, -476, 24, 6], [4, 16, 24, 16, 4], [1, 4, 6, 4, 1]];
    var divisor = -256, bias = 0, count = 1;
    return js_convFilter(data, width, height, kernel, divisor, bias, count);
}

function jsShadow(context, layerlevel, shadowPixel) {
	context.shadowColor = 'black';
	context.fillStyle = "black";
	context.shadowBlur = 100;

	var cssRulesInOffsetWidth = context.canvas.width;
	var cssRulesInOffsetHeight = context.canvas.height;
	var i = 0;
	for(i = 0; i < layerlevel ; i++) {
		context.fillRect(shadowPixel, shadowPixel, cssRulesInOffsetWidth - shadowPixel * 2, cssRulesInOffsetHeight - shadowPixel * 2); // shadow effect
	}
}

function js_convFilter(data, width, height, kernel, divisor, bias=0, count=1) {
  const w = kernel[0].length;
  const h = kernel.length;
  const half = Math.floor(h / 2);
  var result = [];
  for (let i = 0; i < count; i += 1) {
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const px = (y * width + x) * 4;  // pixel index
        let r = 0, g = 0, b = 0;

        for (let cy = 0; cy < h; ++cy) {
          for (let cx = 0; cx < w; ++cx) {
            const cpx = ((y + (cy - half)) * width + (x + (cx - half))) * 4;
            r += data[cpx + 0] * kernel[cy][cx];
            g += data[cpx + 1] * kernel[cy][cx];
            b += data[cpx + 2] * kernel[cy][cx];
          }
        }

        result[px + 0] = (1 / divisor) * r + bias;
        result[px + 1] = (1 / divisor) * g + bias;
        result[px + 2] = (1 / divisor) * b + bias;
	result[px + 3] = data[px + 3];
      }
    }
  }
  return result;
}
