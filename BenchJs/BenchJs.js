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
  document.getElementById('Filter').innerHTML = 'Filter : ' + index;
  jsProcess(width, height, imageData, index);
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
    const jsCanvas = document.createElement('canvas');
    jsCanvas.width = width
    jsCanvas.height = height;
    jsCanvas.id = 'jsCanvas';
    const jsCtx = jsCanvas.getContext('2d');
    let jsPixels = jsCtx.createImageData(width,height);

    ////////////////////////////////////////////////////////////////
    let start = performance.now();
    var jsResult;
    if (index == 'SHARPEN'){
    // JS sharpen
      jsResult = JSsharpen(imageData, width, height);
    }
    else if (index == 'UNSHARP'){
    // JS unsharp
      jsResult = JSunsharp(imageData, width, height);
    }
    let end = performance.now();
    let result ='Filtering Time : ' +  Math.round((end-start)*100)/100 + ' ms';
    document.getElementById('FilteringTime').innerHTML = result;
    ////////////////////////////////////////////////////////////////

    jsPixels.data.set(jsResult);
    jsCtx.putImageData(jsPixels, 0, 0);
    container.appendChild(jsCanvas);
    //console.log('[JS] Filtering Time : ' + Math.round((end - start)*100)/100 + ' ms');

    if (i != loop-1) { container.removeChild(jsCanvas); }
  }
}

