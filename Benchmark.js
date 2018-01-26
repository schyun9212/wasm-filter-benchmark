let PreviewCTX;

let TimeCheck = '';

var FilterManager = WebGLFilter();

const loadImage = src => {
  while (container.childElementCount){ container.removeChild(container.lastChild); }
  const img = new Image();
  img.addEventListener("load", () => {
    const canvas = document.createElement('canvas');
    canvas.id = 'PreviewCanvas';
    canvas.width = 640;
    canvas.height = 480;
    PreviewCTX = canvas.getContext('2d');
    PreviewCTX.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);
    container.appendChild(canvas);
    PreviewCanvas.hidden = true;
    imgObj = img;

    Run();

  });
  img.src = src;
};

function Run(){
  while (container.lastChild.id != 'PreviewCanvas'){ container.removeChild(container.lastChild); }
  const width = PreviewCTX.canvas.width;
  const height = PreviewCTX.canvas.height;
  const imageData = PreviewCTX.getImageData(0, 0, width, height).data;

  // Filtering Process
  //jsProcess(width, height, imageData, 'UNSHARP', 5);
  //wasmProcess(width, height, imageData, 'UNSHARP', 5);

  jsWebGlProcess(width, height, imageData, 'UNSHARP');
  //wasmWebGlProcess(width, height, imgObj, 'UNSHARP');
}

//loadImage('./images/image.png');
loadImage('./images/joan-miro.jpg');

convert.addEventListener("click", () => {
  Run();
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

function jsProcess(width, height, imageData, index, loop = 1){
  for (var i = 0 ; i < loop ; i++){
    let start = performance.now();
    const jsCanvas = document.createElement('canvas');
    jsCanvas.width = width
    jsCanvas.height = height;
    jsCanvas.id = 'jsCanvas';
    const jsCtx = jsCanvas.getContext('2d');
    let jsPixels = jsCtx.createImageData(width,height);

    ////////////////////////////////////////////////////////////////
    var jsResult;
    if (index == 'SHARPEN'){
    // JS sharpen
      jsResult = JSsharpen(imageData, width, height);
    }
    else if (index == 'UNSHARP'){
    // JS unsharp
      jsResult = JSunsharp(imageData, width, height);
    }
    ////////////////////////////////////////////////////////////////

    jsPixels.data.set(jsResult);
    jsCtx.putImageData(jsPixels, 0, 0);
    container.appendChild(jsCanvas);
    let end = performance.now();
    console.log('[JS] Filtering Time : ' + Math.round((end - start)*100)/100 + ' ms');

    if (i != loop-1) { container.removeChild(jsCanvas); }
  }
}

function wasmProcess(width, height, imageData, index, loop = 1){

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
  var kernel, divisor, bias, count;
  if (index == 'SHARPEN'){
  // indexes for sharpen
    kernel = [[0, -1, 0], [-1, 5, -1], [0, -1, 0]];
    divisor = 1, bias = 0, count = 1;
  }
  else if (index == 'UNSHARP'){
    // indexes for unsharp
    kernel = [[1, 4, 6, 4, 1], [4, 16, 24, 16, 4], [6, 24, -476, 24, 6], [4, 16, 24, 16, 4], [1, 4, 6, 4, 1]];
    divisor = -256, bias = 0, count = 1;
  }
  ///////////////////////////////////////////////////////////////

  for (var i = 0 ; i < loop ; i++){
    start = performance.now();
    const kWidth = kernel[0].length, kHeight = kernel.length;
    const kLen = kWidth * kHeight;
    const flatKernel = kernel.reduce((acc, cur) => acc.concat(cur));
    const memKernel = _malloc(kLen * Float32Array.BYTES_PER_ELEMENT);
    HEAPF32.set(flatKernel, memKernel / Float32Array.BYTES_PER_ELEMENT);
    _ConvFilter(FilterData.mem, width, height, memKernel, kWidth, kHeight, divisor, bias, count, FilterData.out);
    _free(memKernel);
    end = performance.now();
    console.log('[WASM] Filtering Time : ' + Math.round((end - start)*100)/100 + ' ms');
  }
  let wasmPixels = wasmCtx.createImageData(width, height);
  const wasmResult = HEAPU8.subarray(FilterData.out, FilterData.out + FilterData.len);
  wasmPixels.data.set(wasmResult);
  wasmCtx.putImageData(wasmPixels, 0, 0);
  container.appendChild(wasmCanvas);
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
  glCtx.texParameteri( glCtx.TEXTURE_2D, glCtx.TEXTURE_MIN_FILTER, glCtx.NEAREST);
  glCtx.texParameteri( glCtx.TEXTURE_2D, glCtx.TEXTURE_MAG_FILTER, glCtx.NEAREST);

  glCtx.texImage2D(glCtx.TEXTURE_2D, 0, glCtx.RGBA, width, height, 0, glCtx.RGBA, glCtx.UNSIGNED_BYTE, imageData );


  // draw
  var vVertice = [ -1.0, 1.0, 0.0, 0.0, 0.0, -1.0, -1.0, 0.0, 0.0, 1.0,
    1.0, -1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 0.0];
  var indices = [ 0, 1, 2, 0, 2, 3 ];

  var vertexObj = glCtx.createBuffer();

  glCtx.bindBuffer(glCtx.ARRAY_BUFFER, vertexObj);

  var b = new Float32Array(vVertice);
  //glCtx.bufferData(glCtx.ARRAY_BUFFER, new Float32Array(vVertice), glCtx.STATIC_DRAW);
  glCtx.bufferData(glCtx.ARRAY_BUFFER, b, glCtx.STATIC_DRAW);

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


function jsWebGlProcess(width, height, imageData, index, loop = 1){
  const jsWebGlCanvas = document.createElement('canvas');
  jsWebGlCanvas.width = width;
  jsWebGlCanvas.height = height;
  jsWebGlCanvas.id = 'jsWebGlCanvas';
  //container.appendChild(jsWebGlCanvas);
  dummyCanvas.appendChild(jsWebGlCanvas);

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
  end = performance.now();
  console.log('[JS with WebGL] Get Context Time : ' + Math.round((end-start)*100)/100 + ' ms');

  start = performance.now();
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

  var imgD = new Uint8Array(imageData);
  for (k=0 ; k < loop; k++){
    start = performance.now();
    jsWebGlRun(jsGlCtx, imgD, width, height, jsWebGlProgram[Tags[index]]);
    end = performance.now();
    console.log('[JS with WebGL] Filtering Time : ' + Math.round((end - start)*100)/100 + ' ms');
  }
}

function wasmWebGlProcess(width, height, imgObj, index, loop = 1){
  var filter = FilterManager.wasmFilter(imgObj, width, height);
  for (var i = 0; i < loop; i ++){
    filter.Filter(index);
  }
}

