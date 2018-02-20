var gWidth = 1920, gHeight = 1280, gSrc;

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
  document.getElementById('Filter').innerHTML = 'Filter : ' + index;
  jsWebGlProcess(width, height, imageData, index);
}

//loadImage('./images/image.png');
loadImage('../images/joan-miro.jpg');

Sharpen.addEventListener("click", () => {
  if (dummyCanvas.hidden) { dummyCanvas.hidden = !dummyCanvas.hidden; }
  PreviewCanvas.hidden = true;
  if (dummyCanvas.childElementCount) { dummyCanvas.removeChild(dummyCanvas.firstChild); }
  Run('SHARPEN');
});
Unsharp.addEventListener("click", () => {
  if (dummyCanvas.hidden) { dummyCanvas.hidden = !dummyCanvas.hidden; }
  PreviewCanvas.hidden = true;
  if (dummyCanvas.childElementCount) { dummyCanvas.removeChild(dummyCanvas.firstChild); }
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
  var start, end;
  var result = '';
  var alpha = 1.0;

  start =  performance.now();
  glCtx.useProgram( program );
  end = performance.now();
  result += '2,' + Math.round((end-start)*100)/100 + '\n';

  start =  performance.now();
  var positionLoc = glCtx.getAttribLocation( program, "position" );
  var texCoordLoc = glCtx.getAttribLocation( program, "texCoord" );
  var textureLoc = glCtx.getUniformLocation( program, "texture" );
  end = performance.now();
  result += '3,' + Math.round((end-start)*100)/100 + '\n';

  start =  performance.now();
  var widthUniform = glCtx.getUniformLocation( program, "width" );
  var heightUniform = glCtx.getUniformLocation( program, "height" );
  var alphaUniform = glCtx.getUniformLocation( program, "alpha" );
  glCtx.uniform1f(widthUniform, width);
  glCtx.uniform1f(heightUniform, height);
  glCtx.uniform1f(alphaUniform, alpha );
  end = performance.now();
  result += '4,' + Math.round((end-start)*100)/100 + '\n';

  start =  performance.now();
  var texture = glCtx.createTexture();
  end = performance.now();
  result += '5,' + Math.round((end-start)*100)/100 + '\n';

  start =  performance.now();
  glCtx.bindTexture(glCtx.TEXTURE_2D, texture);
  end = performance.now();
  result += '6,' + Math.round((end-start)*100)/100 + '\n';

  start =  performance.now();
  glCtx.texParameteri( glCtx.TEXTURE_2D, glCtx.TEXTURE_MIN_FILTER, glCtx.NEAREST);
  glCtx.texParameteri( glCtx.TEXTURE_2D, glCtx.TEXTURE_MAG_FILTER, glCtx.NEAREST);
  end = performance.now();
  result += '7,' + Math.round((end-start)*100)/100 + '\n';

  var test = new Uint8Array(16777216);
  var offset = 5262896;
  for (var i = 0 ; i < test.length; i++){
    test[i] = 0;
  }
  for (var i = offset ; i < offset+imageData.length ; i++){
    test[i] = imageData[i-offset];
  }
  start =  performance.now();
  //glCtx.texImage2D(glCtx.TEXTURE_2D, 0, glCtx.RGBA, width, height, 0, glCtx.RGBA, glCtx.UNSIGNED_BYTE, imageData );
  glCtx.texImage2D(glCtx.TEXTURE_2D, 0, glCtx.RGBA, width, height, 0, glCtx.RGBA, glCtx.UNSIGNED_BYTE, test, offset );
  end = performance.now();
  result += '8,' + Math.round((end-start)*100)/100 + '\n';


  // draw
  var vVertice = [ -1.0, 1.0, 0.0, 0.0, 0.0, -1.0, -1.0, 0.0, 0.0, 1.0,
    1.0, -1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 0.0];
  var indices = [ 0, 1, 2, 0, 2, 3 ];

  start =  performance.now();
  var vertexObj = glCtx.createBuffer();
  end = performance.now();
  result += '9,' + Math.round((end-start)*100)/100 + '\n';

  start =  performance.now();
  glCtx.bindBuffer(glCtx.ARRAY_BUFFER, vertexObj);
  end = performance.now();
  result += '10,' + Math.round((end-start)*100)/100 + '\n';

  var b = new Float32Array(vVertice);
  //glCtx.bufferData(glCtx.ARRAY_BUFFER, new Float32Array(vVertice), glCtx.STATIC_DRAW);
  start =  performance.now();
  glCtx.bufferData(glCtx.ARRAY_BUFFER, b, glCtx.STATIC_DRAW);
  end = performance.now();
  result += '11,' + Math.round((end-start)*100)/100 + '\n';

  start =  performance.now();
  var indexObj = glCtx.createBuffer();
  end = performance.now();
  result += '12,' + Math.round((end-start)*100)/100 + '\n';

  start =  performance.now();
  glCtx.bindBuffer(glCtx.ELEMENT_ARRAY_BUFFER, indexObj);
  end = performance.now();
  result += '13,' + Math.round((end-start)*100)/100 + '\n';

  start =  performance.now();
  glCtx.bufferData(glCtx.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), glCtx.STATIC_DRAW );
  end = performance.now();
  result += '14,' + Math.round((end-start)*100)/100 + '\n';

  start =  performance.now();
  glCtx.viewport(0, 0, width, height);
  end = performance.now();
  result += '15,' + Math.round((end-start)*100)/100 + '\n';

  start =  performance.now();
  glCtx.clear(glCtx.COLOR_BUFFER_BIT);
  end = performance.now();
  result += '16,' + Math.round((end-start)*100)/100 + '\n';

  start =  performance.now();
  glCtx.vertexAttribPointer(positionLoc, 3, glCtx.FLOAT, glCtx.FALSE, 5 * Float32Array.BYTES_PER_ELEMENT, 0);
  end = performance.now();
  result += '17,' + Math.round((end-start)*100)/100 + '\n';

  start =  performance.now();
  glCtx.vertexAttribPointer(texCoordLoc, 2, glCtx.FLOAT, glCtx.FALSE, 5 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);
  end = performance.now();
  result += '18,' + Math.round((end-start)*100)/100 + '\n';

  start =  performance.now();
  glCtx.enableVertexAttribArray(positionLoc);
  end = performance.now();
  result += '19,' + Math.round((end-start)*100)/100 + '\n';

  start =  performance.now();
  glCtx.enableVertexAttribArray(texCoordLoc);
  end = performance.now();
  result += '20,' + Math.round((end-start)*100)/100 + '\n';

  start =  performance.now();
  glCtx.drawElements(glCtx.TRIANGLES, 6, glCtx.UNSIGNED_SHORT, 0);
  end = performance.now();
  result += '21,' + Math.round((end-start)*100)/100 + '\n';

  console.log(result);
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
  let result = 'Get Context Time : ' + Math.round((end-start)*100)/100 + ' ms';
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
  result = 'Compile Time : ' + Math.round((end-start)*100)/100 + ' ms';
  document.getElementById('compileTime').innerHTML = result;
  //console.log('[JS with WebGL] Compile Time : ' + Math.round((end - start)*100)/100 + ' ms');

  var imgD = new Uint8Array(imageData);
  for (k=0 ; k < loop; k++){
    start = performance.now();
    jsWebGlRun(jsGlCtx, imgD, width, height, jsWebGlProgram[Tags[index]]);
    end = performance.now();
    result = 'Filtering Time : ' + Math.round((end-start)*100)/100 + ' ms';
    document.getElementById('FilteringTime').innerHTML = result;
    //console.log('[JS with WebGL] Filtering Time : ' + Math.round((end - start)*100)/100 + ' ms');
  }
}
