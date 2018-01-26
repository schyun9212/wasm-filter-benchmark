#include <emscripten.h>
#include <string>
#include <GLES2/gl2.h>
#include <EGL/egl.h>
extern "C" {
  #include "html5.h"
}

#include "Context.cpp"
#include <math.h>
#include <stdlib.h>
#include <stdio.h>
#include <iostream>

Context* contexts;

extern "C" {

  void CreateShader(char *id){
    if (contexts){ delete contexts; }
    contexts = new Context(id);
  }

  void Filter(uint8_t *data, int width, int height, float alpha, int index){
    contexts->run(data, width, height, alpha, index);
  }

  void Contrast (uint8_t* data, int len, float alpha) {
    for (int i = 0; i < len; i += 4) {
      data[i] = data[i]*alpha;
      data[i+1] = data[i+1]*alpha;
      data[i+2] = data[i+2]*alpha;
    }
  }

  void Brighten (uint8_t* data, int len, int brightness) {
    if (brightness < 0){
      for (int i = 0; i < len; i += 4) {
        data[i] + brightness < 0 ? data[i] = 0 : data[i] += brightness;
        data[i+1] + brightness < 0 ? data[i+1] = 0 : data[i+1] += brightness;
        data[i+2] + brightness < 0 ? data[i+2] = 0 : data[i+2] += brightness;
      }
    }
    else if (brightness > 0){
      for (int i = 0; i < len; i += 4) {
        data[i] + brightness > 255 ? data[i] = 255 : data[i] += brightness;
        data[i+1] + brightness > 255 ? data[i+1] = 255 : data[i+1] += brightness;
        data[i+2] + brightness > 255 ? data[i+2] = 255 : data[i+2] += brightness;
      }
    }
  }

  void ConvFilter (uint8_t* data, int width, int height, float* kern, int kWidth, int kHeight, float divisor, float bias, int count, uint8_t* out) {

    float r, g, b;
    int yy, xx, imageOffset, kernelOffset, pix;
    int kCenterY = floor(kHeight / 2);
    int kCenterX = floor(kWidth / 2);
    for (int i = 0; i < count; ++i) {
      for (int y = kCenterY; y < height - kCenterY; ++y) {
        for (int x = kCenterX; x < width - kCenterX; ++x) {
          r = 0;
          g = 0;
          b = 0;
          for (int ky = 0; ky < kHeight; ++ky) {
            // yy = kHeight - 1 - ky;
            for (int kx = 0; kx < kWidth; ++kx) {
              // xx = kWidth - 1 - kx;
              imageOffset = (width * (y - kCenterY + ky) + (x - kCenterX + kx)) * 4;
              kernelOffset = kWidth * ky + kx;
              // access correct index by offsetting x and y by the current kernel index
              r += data[imageOffset + 0] * kern[kernelOffset];
              g += data[imageOffset + 1] * kern[kernelOffset];
              b += data[imageOffset + 2] * kern[kernelOffset];
            }
          }
          pix = (width * y + x) * 4;
          out[pix + 0] =  ((r / divisor)>255.0) ? 255.0 : ((r / divisor)<0.0) ? 0.0 : r / divisor;
          out[pix + 1] =  ((g / divisor)>255.0) ? 255.0 : ((g / divisor)<0.0) ? 0.0 : g / divisor;
          out[pix + 2] =  ((b / divisor)>255.0) ? 255.0 : ((b / divisor)<0.0) ? 0.0 : b / divisor;
          out[pix + 3] = data[pix + 3];
        }
      }
    }
  }

}
