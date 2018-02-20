function WebGLFilter(){

  // wasm WebGL Filtering
  let start = performance.now();
  const wasmWebGlCanvas = document.createElement('canvas');
  wasmWebGlCanvas.id = 'wasmWebGlCanvas';
  const memID = _malloc(wasmWebGlCanvas.id.length + 1);
  Module.stringToUTF8(wasmWebGlCanvas.id, memID, wasmWebGlCanvas.id.length + 1);
  dummyCanvas.appendChild(wasmWebGlCanvas);
  _CreateShader(memID);
  let end = performance.now();
  let result = 'Compile Time : ' + Math.round((end-start)*100)/100 + ' ms';
  document.getElementById('compileTime').innerHTML = result;
  //console.log('[WASM with WebGL] Compile Time : ' + Math.round((end-start)*100)/100 + ' ms');

  var tags = {
    'LOAD' : 0,
    'SHARPEN' : 1,
    'UNSHARP' : 2,
    'BRIGHTNESS' : 3,
    'EDGEDECTION' : 4
  };

  return  {
    wasmFilter : function(imgObj, width, height){

      let start = performance.now();
      FilterData = new Object();

      /* A preview canvas to get image pixel data */
      var offscreenCanvas = document.createElement('canvas');
      var context = offscreenCanvas.getContext('2d');

      context.canvas.width = width;
      context.canvas.height = height;

      // draw image to canvas
      context.drawImage(imgObj, 0, 0, width, height);

      // get pixel data from canvas
      var pixels = context.getImageData(0, 0, context.canvas.width, context.canvas.height);

      // store wasm mem data
      FilterData.len = pixels.data.length;
      FilterData.mem = _malloc(FilterData.len);
      HEAPU8.set(pixels.data, FilterData.mem);
      let end = performance.now();
      let result = 'Allocation Time : ' + Math.round((end-start)*100)/100 + ' ms';
      document.getElementById('copyTime').innerHTML = result;
      //console.log('Allocation Time : ' + Math.round((end-start)*100)/100 + ' ms');

      return {
	Filter : function (tag, alpha = 1.0){
	  start = performance.now();
	  wasmWebGlCanvas.width = width;
	  wasmWebGlCanvas.height = height;
	  _Filter(FilterData.mem, width, height, alpha, tags[tag]);
	  end = performance.now();
	  let result = 'Filtering Time : ' + Math.round((end-start)*100)/100 + ' ms';
	  document.getElementById('FilteringTime').innerHTML = result;
	  //console.log('Filtering Time : ' + Math.round((end-start)*100)/100 + ' ms');
	},
	getImage : function(){
	  return HEAPU8.subarray(FilterData.mem, FilterData.mem + FilterData.len);
	}
      }
    }
  }
}
