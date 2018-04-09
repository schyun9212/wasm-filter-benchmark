# WebAssembly Benchmark Applications

***

## How to use

1. Install emscripten toolchain (Linux 16.04)

``` bash
$ git clone https://github.com/juj/emsdk.git
$ cd emsdk
$ ./emsdk install --build=Release sdk-incoming-64bit binaryen-master-64bit
$ ./emsdk activate --build=Release sdk-incoming-64bit binaryen-master-64bit
$ source ./emsdk_env.sh --build=Release
```
[reference site](http://webassembly.org/getting-started/developers-guide/)

2. Clone the repository

``` bash
$ git clone https://github.com/schyun9212/wasm-benchmark-app.git
```

3. Run compile script

``` bash
$ ./compileWASM.sh
```

4. Open local server

``` bash
$ sudo npm install -g http-server
$ http-server
```

5. Enter the IP address in the browser and connect.