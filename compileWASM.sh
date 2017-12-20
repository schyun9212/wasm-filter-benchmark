. ~/emsdk/emsdk_env.sh --build=Release

CPP_FUNCS="[
  '_Brighten',
  '_Contrast',
  '_ConvFilter',
  '_Sharpen'
]"

echo "compiling C++ to WASM ..."
emcc -o ./lib/filter_c.js ./cpp/filter.cpp -lm -O3 -s WASM=1 \
  -s EXPORTED_FUNCTIONS="$CPP_FUNCS" \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s USE_WEBGL2=1 \
  -s FULL_ES3=1 \
  -s NO_EXIT_RUNTIME=1 \
  -std=c++1z \

sed -i 's/else{doRun()}/&script.dispatchEvent(doneEvent);/' lib/filter_c.js
