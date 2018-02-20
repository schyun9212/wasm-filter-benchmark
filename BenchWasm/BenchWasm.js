var gWidth = 1920, gHeight = 1280, gSrc;

const loadImage = src => {
  while (container.childElementCount){ container.removeChild(container.lastChild); }
  const img = new Image();
  img.addEventListener("load", () => {
    const canvas = document.createElement('canvas');
    canvas.id = 'PreviewCanvas';
    canvas.width = gWidth;
    canvas.height = gHeight;
    PreviewCTX = canvas.getContext('2d');
    PreviewCTX.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);
    container.appendChild(canvas);
    //PreviewCanvas.hidden = true;
    imgObj = img;
  });
  img.src = src;
  gSrc = src;
};

function Run(index){
  while (container.lastChild.id != 'PreviewCanvas'){ container.removeChild(container.lastChild); }
  const width = PreviewCTX.canvas.width;
  const height = PreviewCTX.canvas.height;
  const imageData = PreviewCTX.getImageData(0, 0, width, height).data;

  // Filtering Process
  document.getElementById('Filter').innerHTML = 'Filter : '+ index;
  wasmProcess(width, height, imageData, index);
}

//loadImage('./images/image.png');
loadImage('../images/joan-miro.jpg');

Sharpen.addEventListener("click", () => {
  Run('SHARPEN');
});
Unsharp.addEventListener("click", () => {
  Run('UNSHARP');
});

Hidden.addEventListener('click', () => {
  PreviewCanvas.hidden = !PreviewCanvas.hidden;
});

himage.addEventListener("click", () => {
  gWidth = 1920; gHeight = 1280;
  loadImage(gSrc);
});
mimage.addEventListener("click", () => {
  gWidth = 1280; gHeight = 960;
  loadImage(gSrc);
});
simage.addEventListener("click", () => {
  gWidth = 640; gHeight = 480;
  loadImage(gSrc);
});

fileInput.addEventListener("change", event => loadImage(URL.createObjectURL(event.target.files[0])))

function wasmProcess(width, height, imageData, index, loop = 1){

  var FilterData = new Object;

  // Memory allcation time
  let start = performance.now();
  FilterData.len = imageData.length;
  FilterData.mem = _malloc(FilterData.len);
  FilterData.out = _malloc(FilterData.len);
  HEAPU8.set(imageData, FilterData.mem);
  let end = performance.now();
  let result = 'Allocation Time : ' + Math.round((end-start)*100)/100 + ' ms';
  document.getElementById('copyTime').innerHTML = result;
  //console.log('[WASM] AllocTime : ' + Math.round((end - start)*100)/100 + ' ms');

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
    result = 'Filtering Time : ' + (Math.round((end-start)*100)/100) + ' ms';
    document.getElementById('FilteringTime').innerHTML = result;
    //console.log('[WASM] Filtering Time : ' + Math.round((end - start)*100)/100 + ' ms');
  }
  let wasmPixels = wasmCtx.createImageData(width, height);
  const wasmResult = HEAPU8.subarray(FilterData.out, FilterData.out + FilterData.len);
  wasmPixels.data.set(wasmResult);
  wasmCtx.putImageData(wasmPixels, 0, 0);
  container.appendChild(wasmCanvas);
}
