var gWidth = 1920, gHeight = 1280, gSrc;

var FilterManager = WebGLFilter();

const loadImage = src => {
  dummyCanvas.hidden = true;
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
  wasmWebGlProcess(width, height, imgObj, index);
}

//loadImage('./images/image.png');
loadImage('../images/joan-miro.jpg');

Sharpen.addEventListener("click", () => {
  if (dummyCanvas.hidden) { dummyCanvas.hidden = !dummyCanvas.hidden; }
  PreviewCanvas.hidden = true;
  Run('SHARPEN');
});
Unsharp.addEventListener("click", () => {
  if (dummyCanvas.hidden) { dummyCanvas.hidden = !dummyCanvas.hidden; }
  PreviewCanvas.hidden = true;
  Run('UNSHARP');
});

Hidden.addEventListener('click', () => {
  PreviewCanvas.hidden = !PreviewCanvas.hidden;
  dummyCanvas.hidden = !dummyCanvas.hidden;
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

function wasmWebGlProcess(width, height, imgObj, index, loop = 1){
  var filter = FilterManager.wasmFilter(imgObj, width, height);
  for (var i = 0; i < loop; i ++){
    filter.Filter(index);
  }
}
