let PreviewCTX;

var FilterManager = WebGLFilter();
var imgObj;

const loadImage = src => {
    while (container.childElementCount){ container.removeChild(container.lastChild); }
    const img = new Image();
    img.addEventListener("load", () => {
	const canvas = document.createElement('canvas');
	canvas.id = 'PreviewCanvas';
	canvas.width = 1920;
	canvas.height = 1080;
	PreviewCTX = canvas.getContext('2d');
	PreviewCTX.drawImage(img, 0, 0);
	container.appendChild(canvas);
	PreviewCanvas.hidden = true;
	imgObj = img;
    });
    img.src = src;
};

//loadImage('./images/image.png');
loadImage('./images/joan-miro.jpg');

convert.addEventListener("click", () => {
  while (container.lastChild.id != 'PreviewCanvas'){ container.removeChild(container.lastChild); }
  const width = PreviewCTX.canvas.width;
  const height = PreviewCTX.canvas.height;
  const imageData = PreviewCTX.getImageData(0, 0, width, height).data;

  // Filtering Process
  //jsProcess(width, height, imageData);
  //wasmProcess(width, height, imageData);

  //jsWebGlProcess(width, height, imageData, 1, 'SHARPEN');
  wasmWebGlProcess(width, height, imgObj, 2, 'SHARPEN');
});
fileInput.addEventListener("change", event => loadImage(URL.createObjectURL(event.target.files[0])))

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

function js_convFilter(data, width, height, kernel, divisor, bias=0, count=1) {
  const w = kernel[0].length;
  const h = kernel.length;
  const half = Math.floor(h / 2);
  var result = new Uint8ClampedArray(data.length);
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

function jsProcess(width, height, imageData){
    start = performance.now();
    const jsCanvas = document.createElement('canvas');
    jsCanvas.width = width
    jsCanvas.height = height;
    jsCanvas.id = 'jsCanvas';
    const jsCtx = jsCanvas.getContext('2d');
    let jsPixels = jsCtx.createImageData(width,height);

    ////////////////////////////////////////////////////////////////
    // JS sharpen
    //const jsResult = JSsharpen(imageData, width, height);

    // JS unsharp
    const jsResult = JSunsharp(imageData, width, height);
    ////////////////////////////////////////////////////////////////

    jsPixels.data.set(jsResult);
    jsCtx.putImageData(jsPixels, 0, 0);
    container.appendChild(jsCanvas);
    end = performance.now();
    console.log('[JS] Filtering Time : ' + Math.round((end - start)*100)/100 + ' ms');
    container.removeChild(jsCanvas);
}

function wasmProcess(width, height, imageData){

    var FilterData = new Object;

    // Memory allcation time
    let start = performance.now();
    FilterData.len = imageData.length;
    FilterData.mem = _malloc(FilterData.len);
    FilterData.out = _malloc(FilterData.len);
    HEAPU8.set(imageData, FilterData.mem);
    let end = performance.now();
    console.log('[WASM] AllocTime : ' + Math.round((end - start)*100)/100 + ' ms');

    start = performance.now();
    const wasmCanvas = document.createElement('canvas');
    wasmCanvas.width = width;
    wasmCanvas.height = height;
    wasmCanvas.id = 'wasmCanvas';
    const wasmCtx = wasmCanvas.getContext('2d');

    ///////////////////////////////////////////////////////////////
    // indexes for sharpen
    //const kernel = [[0, -1, 0], [-1, 5, -1], [0, -1, 0]];
    //const divisor = 1, bias = 0, count = 1;

    // indexes for unsharp
    const kernel = [[1, 4, 6, 4, 1], [4, 16, 24, 16, 4], [6, 24, -476, 24, 6], [4, 16, 24, 16, 4], [1, 4, 6, 4, 1]];
    const divisor = -256, bias = 0, count = 1;
    ///////////////////////////////////////////////////////////////

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
    //container.removeChild(wasmCanvas);
}

function createShader(GlCtx, type, source){
    var shader = GlCtx.createShader(type);
    GlCtx.shaderSource(shader, source);
    GlCtx.compileShader(shader);
    if (GlCtx.getShaderParameter(shader, GlCtx.COMPILE_STATUS)){
	return shader;
    }
    console.log("[Shader]Compile Error");
    GlCtx.deleteShader(shader);
    return null;
}

function createProgram(glCtx, vertexShader, fragmentShader){
    var program = glCtx.createProgram();

    glCtx.attachShader(program, vertexShader);
    glCtx.attachShader(program, fragmentShader);

    glCtx.bindAttribLocation( program, 0, "position");
    glCtx.linkProgram(program);

    if (glCtx.getProgramParameter(program, glCtx.LINK_STATUS)){
	return program;
    }
    console.log("[Program]No webgl program");
    glCtx.deleteProgram(program);
    return null;
}

function jsWebGlRun(glCtx, imageData, width, height, program){

    glCtx.useProgram( program );

    var positionLoc = glCtx.getAttribLocation( program, "position" );
    var texCoordLoc = glCtx.getAttribLocation( program, "texCoord" );
    var textureLoc = glCtx.getUniformLocation( program, "texture" );

    var widthUniform = glCtx.getUniformLocation( program, "width" );
    var heightUniform = glCtx.getUniformLocation( program, "height" );
    glCtx.uniform1f(widthUniform, width);
    glCtx.uniform1f(heightUniform, height);

    var texture = glCtx.createTexture();
    glCtx.bindTexture(glCtx.TEXTURE_2D, texture);
    glCtx.texImage2D(glCtx.TEXTURE_2D, 0, glCtx.RGBA, width, height, 0, glCtx.RGBA, glCtx.UNSIGNED_BYTE, new Uint8Array(imageData) );
    glCtx.texParameteri( glCtx.TEXTURE_2D, glCtx.TEXTURE_MIN_FILTER, glCtx.NEAREST);
    glCtx.texParameteri( glCtx.TEXTURE_2D, glCtx.TEXTURE_MAG_FILTER, glCtx.NEAREST);

    var vVertice = [ -1.0, 1.0, 0.0, 0.0, 0.0, -1.0, -1.0, 0.0, 0.0, 1.0,
	1.0, -1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 0.0];
    var indices = [ 0, 1, 2, 0, 2, 3 ];

    var vertexObj = glCtx.createBuffer();
    glCtx.bindBuffer(glCtx.ARRAY_BUFFER, vertexObj);
    glCtx.bufferData(glCtx.ARRAY_BUFFER, new Float32Array(vVertice), glCtx.STATIC_DRAW);

    var indexObj = glCtx.createBuffer();
    glCtx.bindBuffer(glCtx.ELEMENT_ARRAY_BUFFER, indexObj);
    glCtx.bufferData(glCtx.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), glCtx.STATIC_DRAW );

    glCtx.viewport(0, 0, width, height);
    glCtx.clear(glCtx.COLOR_BUFFER_BIT);

    glCtx.vertexAttribPointer(positionLoc, 3, glCtx.FLOAT, glCtx.FALSE, 5 * Float32Array.BYTES_PER_ELEMENT, 0);
    glCtx.vertexAttribPointer(texCoordLoc, 2, glCtx.FLOAT, glCtx.FALSE, 5 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);
    glCtx.enableVertexAttribArray(positionLoc);
    glCtx.enableVertexAttribArray(texCoordLoc);

    glCtx.drawElements(glCtx.TRIANGLES, 6, glCtx.UNSIGNED_SHORT, 0);
}


function jsWebGlProcess(width, height, imageData, loop, index){
    const jsWebGlCanvas = document.createElement('canvas');
    jsWebGlCanvas.width = width;
    jsWebGlCanvas.height = height;
    jsWebGlCanvas.id = 'jsWebGlCanvas';
    container.appendChild(jsWebGlCanvas);

    var Tags = {
	'LOAD' : 0,
	'SHARPEN' : 1,
	'UNSHARP' : 2,
	'BRIGHTNESS' : 3,
	'EDGEDECTION' : 4
    };

    start = performance.now();
    var vertexShaderSource;
    vertexShaderSource = document.getElementById('vertexShader').text;

    var fragmentShaderSource = [];
    fragmentShaderSource[0] = document.getElementById('LfragmentShader').text;
    fragmentShaderSource[1] = document.getElementById('SfragmentShader').text;
    fragmentShaderSource[2] = document.getElementById('UfragmentShader').text;
    fragmentShaderSource[3] = document.getElementById('BfragmentShader').text;
    fragmentShaderSource[4] = document.getElementById('EfragmentShader').text;

    const jsGlCtx = jsWebGlCanvas.getContext('webgl2');
    var vertexShader = createShader(jsGlCtx, jsGlCtx.VERTEX_SHADER, vertexShaderSource);
    var fragmentShader = [];
    var k = 0;
    for (k = 0; k < 5 ; k++){
	fragmentShader[k] = createShader(jsGlCtx, jsGlCtx.FRAGMENT_SHADER, fragmentShaderSource[k]);
    }

    var jsWebGlProgram = [];
    for (k =0 ; k < 5 ; k++){
	jsWebGlProgram[k] = createProgram(jsGlCtx, vertexShader, fragmentShader[k]);
    }
    end = performance.now();
    console.log('[JS with WebGL] Compile Time : ' + Math.round((end - start)*100)/100 + ' ms');

    var Total = 0;
    for (var i = 0 ; i < loop ; i++){
	start = performance.now();
	jsWebGlRun(jsGlCtx, imageData, width, height, jsWebGlProgram[Tags[index]]);
	end = performance.now();
	console.log('[JS with WebGL] Filtering Time : ' + Math.round((end - start)*100)/100 + ' ms');
	Total += end - start;
    }
    console.log('Iteration : ' + loop);
    console.log('[JS with WebGL] Total Filtering Time : ' + Math.round(Total*100)/100 );

  console.log(imageData);
  start = performance.now();
  var a = new Uint8Array(imageData.length);
  end = performance.now();
  console.log(end-start);
  start = performance.now();
  jsGlCtx.readPixels(0, 0, width, height, jsGlCtx.RGBA, jsGlCtx.UNSIGNED_BYTE, a);
  end = performance.now();
  console.log(a);
  console.log('[JS with WebGL] Piexel Read Time : ' + Math.round((end - start)*100)/100 + ' ms');
}

function wasmWebGlProcess(width, height, imgObj, loop, index){
  var filter = FilterManager.wasmFilter(imgObj, width, height);
  var Total = 0;
  let start, end;
  for (var i = 0 ; i < loop ; i++){
    start = performance.now();
    filter.Filter(index);
    end = performance.now();
    console.log('[WASM with WebGL] Filtering Time : ' + Math.round((end - start)*100)/100 + ' ms');
    Total += end - start;
  }
  console.log('Iteration : ' + loop);
  console.log('[JS with WebGL] Total Filtering Time : ' + Math.round(Total*100)/100 );
}

/*
function wasmWebGlProcess(width, height, FilterData, loop){
    const wasmWebGlCanvas = document.createElement('canvas');
    wasmWebGlCanvas.width = width;
    wasmWebGlCanvas.height = height;
    wasmWebGlCanvas.id = 'wasmWebGlCanvas';
    const memID = _malloc(wasmWebGlCanvas.id.length + 1);
    Module.stringToUTF8(wasmWebGlCanvas.id, memID, wasmWebGlCanvas.id.length + 1);
    //const wasmGlCtx = wasmWebGlCanvas.getContext('webgl2');
    container.appendChild(wasmWebGlCanvas);

    let alpha = 1.0;
    let brightness = 0;

    start = performance.now();
    //const filter = "Sharpen";
    const filter = "Unsharp";
    //const filter = "Brightness";
    //brightness = 40/255;
    //const filter = "Contrast";
    //alpha = 0.3;

    const memFilter = _malloc(filter.length+1);
    Module.stringToUTF8(filter, memFilter, filter.length+1);
    _CreateShader(width, height, alpha, brightness, memFilter, memID, 0);
    end = performance.now();
    console.log('[WASM with WebGL] Compile Time : ' + Math.round((end - start)*100)/100 + ' ms');

    var Total = 0;
    for (var i = 0 ; i < loop ; i++){
	start = performance.now();
	_Sharpen(FilterData.mem, 0);
	end = performance.now();
	console.log('[WASM with WebGL] Filtering Time : ' + Math.round((end - start)*100)/100 + ' ms');
	Total += end - start;
    }
    console.log('Iteration : ' + loop);
    console.log('[WASM width WebGL] Total : ' + Math.round(Total*100)/100 );

    _free(memID);
    _free(memFilter);
}
*/
