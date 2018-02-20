#include "Context.h"

extern "C"{
    extern void Mtime_js(int a);
    extern void Itime_js(int a);
}

// Shaders
std::string vertex_source =
    "attribute vec4 position;   \n"
    "attribute vec2 texCoord;   \n"
    "varying vec2 v_texCoord;     \n"
    "void main()                  \n"
    "{                            \n"
    "   gl_Position = position; \n"
    "   v_texCoord = texCoord;  \n"
    "}                            \n";

std::string texture_load_fragment_source =
    "precision mediump float;                            \n"
    "varying vec2 v_texCoord;                            \n"
    "uniform sampler2D texture;                        \n"
    "void main()                                         \n"
    "{                                                   \n"
    "  gl_FragColor = texture2D( texture, v_texCoord );   \n"
    "}                                                   \n";

std::string brightness_fragment_source =
    "precision mediump float;                            \n"
    "varying vec2 v_texCoord;                            \n"
    "uniform sampler2D texture;                        \n"
    "uniform float alpha;  \n"
    "void main()                                         \n"
    "{                                                   \n"
    "  vec4 brightness = texture2D( texture, v_texCoord); \n"
    "  gl_FragColor = vec4( vec3(brightness), alpha);   \n"
    "}                                                   \n";

std::string edge_detect_fragment_source =
    "precision mediump float;                            \n"
    "varying vec2 v_texCoord;                            \n"
    "uniform sampler2D texture;                        \n"
    "uniform float width;  \n"
    "uniform float height;  \n"
    "void main()                                         \n"
    "{                                                   \n"
    "  vec4 pixel = texture2D(texture, v_texCoord);              \n"
    "  vec4 n[9];\n"

    "  float w = 1.0 / width;\n"
    "  float h = 1.0 / height;\n"

    "  n[0] = texture2D(texture, v_texCoord + vec2(0.0, 0.0) );\n"
    "  n[1] = texture2D(texture, v_texCoord + vec2(w, 0.0) );\n"
    "  n[2] = texture2D(texture, v_texCoord + vec2(2.0*w, 0.0) );\n"
    "  n[3] = texture2D(texture, v_texCoord + vec2(0.0*w, h) );\n"
    "  n[4] = texture2D(texture, v_texCoord + vec2(w, h) );\n"
    "  n[5] = texture2D(texture, v_texCoord + vec2(2.0*w, h) );\n"
    "  n[6] = texture2D(texture, v_texCoord + vec2(0.0, 2.0*h) );\n"
    "  n[7] = texture2D(texture, v_texCoord + vec2(w, 2.0*h) );\n"
    "  n[8] = texture2D(texture, v_texCoord + vec2(2.0*w, 2.0*h) );\n"

    "  vec4 sobel_x = n[2] + (2.0*n[5]) + n[8] - (n[0] + (2.0*n[3]) + n[6]);\n"
    "  vec4 sobel_y = n[0] + (2.0*n[1]) + n[2] - (n[6] + (2.0*n[7]) + n[8]);\n"

    "  float avg_x = (sobel_x.r + sobel_x.g + sobel_x.b) / 3.0;\n"
    "  float avg_y = (sobel_y.r + sobel_y.g + sobel_y.b) / 3.0;\n"

    "  sobel_x.r = avg_x;\n"
    "  sobel_x.g = avg_x;\n"
    "  sobel_x.b = avg_x;\n"
    "  sobel_y.r = avg_y;\n"
    "  sobel_y.g = avg_y;\n"
    "  sobel_y.b = avg_y;\n"

    "  vec3 sobel = vec3(sqrt((sobel_x.rgb * sobel_x.rgb) + (sobel_y.rgb * sobel_y.rgb)));\n"
    "  gl_FragColor = vec4( sobel, 1.0 );   \n"
    "}                                                   \n";

std::string sharpen_fragment_source =
    "precision mediump float;                            \n"
    "varying vec2 v_texCoord;                            \n"
    "uniform sampler2D texture;                        \n"
    "uniform float width;  \n"
    "uniform float height;  \n"
    "void main()                                         \n"
    "{                                                   \n"
    "  vec4 pixel = texture2D(texture, v_texCoord);              \n"
    "  vec4 n[9];\n"

    "  float w = 1.0 / width;\n"
    "  float h = 1.0 / height;\n"

    "  n[0] = texture2D(texture, v_texCoord + vec2(0.0, 0.0) );\n"
    "  n[1] = texture2D(texture, v_texCoord + vec2(w, 0.0) );\n"
    "  n[2] = texture2D(texture, v_texCoord + vec2(2.0*w, 0.0) );\n"
    "  n[3] = texture2D(texture, v_texCoord + vec2(0.0*w, h) );\n"
    "  n[4] = texture2D(texture, v_texCoord + vec2(w, h) );\n"
    "  n[5] = texture2D(texture, v_texCoord + vec2(2.0*w, h) );\n"
    "  n[6] = texture2D(texture, v_texCoord + vec2(0.0, 2.0*h) );\n"
    "  n[7] = texture2D(texture, v_texCoord + vec2(w, 2.0*h) );\n"
    "  n[8] = texture2D(texture, v_texCoord + vec2(2.0*w, 2.0*h) );\n"

    "  vec4 sharpen = (5.0*n[4]) - n[1] - n[3] - n[5] - n[7];\n"

    "  gl_FragColor = vec4( vec3(sharpen), 1.0 );   \n"
    "}                                                   \n";

std::string unsharp_fragment_source =
    "precision mediump float;                            \n"
    "varying vec2 v_texCoord;                            \n"
    "uniform sampler2D texture;                        \n"
    "uniform float width;  \n"
    "uniform float height;  \n"
    "void main()                                         \n"
    "{                                                   \n"
    "  vec4 pixel = texture2D(texture, v_texCoord);              \n"
    "  vec4 n[25];\n"

    "  float w = 1.0 / width;\n"
    "  float h = 1.0 / height;\n"

    "  n[0] = texture2D(texture, v_texCoord + vec2(0.0, 0.0) );\n"
    "  n[1] = texture2D(texture, v_texCoord + vec2(w, 0.0) );\n"
    "  n[2] = texture2D(texture, v_texCoord + vec2(2.0*w, 0.0) );\n"
    "  n[3] = texture2D(texture, v_texCoord + vec2(3.0*w, 0.0) );\n"
    "  n[4] = texture2D(texture, v_texCoord + vec2(4.0*w, 0.0) );\n"
    "  n[5] = texture2D(texture, v_texCoord + vec2(0.0, h) );\n"
    "  n[6] = texture2D(texture, v_texCoord + vec2(w, h) );\n"
    "  n[7] = texture2D(texture, v_texCoord + vec2(2.0*w, h) );\n"
    "  n[8] = texture2D(texture, v_texCoord + vec2(3.0*w, h) );\n"
    "  n[9] = texture2D(texture, v_texCoord + vec2(4.0*w, h) );\n"
    "  n[10] = texture2D(texture, v_texCoord + vec2(0, 2.0*h) );\n"
    "  n[11] = texture2D(texture, v_texCoord + vec2(w, 2.0*h) );\n"
    "  n[12] = texture2D(texture, v_texCoord + vec2(2.0*w, 2.0*h) );\n"
    "  n[13] = texture2D(texture, v_texCoord + vec2(3.0*w, 2.0*h) );\n"
    "  n[14] = texture2D(texture, v_texCoord + vec2(4.0*w, 2.0*h) );\n"
    "  n[15] = texture2D(texture, v_texCoord + vec2(0, 3.0*h) );\n"
    "  n[16] = texture2D(texture, v_texCoord + vec2(w, 3.0*h) );\n"
    "  n[17] = texture2D(texture, v_texCoord + vec2(2.0*w, 3.0*h) );\n"
    "  n[18] = texture2D(texture, v_texCoord + vec2(3.0*w, 3.0*h) );\n"
    "  n[19] = texture2D(texture, v_texCoord + vec2(4.0*w, 3.0*h) );\n"
    "  n[20] = texture2D(texture, v_texCoord + vec2(0, 4.0*h) );\n"
    "  n[21] = texture2D(texture, v_texCoord + vec2(w, 4.0*h) );\n"
    "  n[22] = texture2D(texture, v_texCoord + vec2(2.0*w, 4.0*h) );\n"
    "  n[23] = texture2D(texture, v_texCoord + vec2(3.0*w, 4.0*h) );\n"
    "  n[24] = texture2D(texture, v_texCoord + vec2(4.0*w, 4.0*h) );\n"

    "  vec4 unsharp = n[0] + 4.0*n[1] + 6.0*n[2] + 4.0*n[3] + n[4]\n"
    "               + 4.0*n[5] + 16.0*n[6] + 24.0*n[7] + 16.0*n[8] + 4.0*n[9]\n"
    "               + 6.0*n[10] + 24.0*n[11] - 476.0*n[12] + 24.0*n[13] + 6.0*n[14]\n"
    "               + 4.0*n[15] + 16.0*n[16] + 24.0*n[17] + 16.0*n[18] + 4.0*n[19]\n"
    "               + n[20] + 4.0*n[21] + 6.0*n[22] + 4.0*n[23] + n[24];\n"
    "  gl_FragColor = vec4( vec3(unsharp)*vec3(-0.0039), 1.0 );   \n"
    "}                                                   \n";


GLuint CompileShader (GLenum type, std::string *source) {

    const GLchar* sourceString[1];
    GLint sourceStringLengths[1];

    sourceString[0] = source->c_str();
    sourceStringLengths[0] = source->length();
    //printf("type : %d\n", type);
    GLuint shader = glCreateShader(type);

    if (shader == 0) {
        return 0;
    }

    // Assign and compile the source to the shader object
    glShaderSource(shader, 1, sourceString, sourceStringLengths);
    glCompileShader(shader);

    // Check if there were errors
    int infoLen = 0;
    glGetShaderiv( shader, GL_INFO_LOG_LENGTH, &infoLen );

    if (infoLen > 1) {

        char infoLog[infoLen];

        // And print them out
        glGetShaderInfoLog( shader, infoLen, NULL, infoLog );
        printf("%s\n", infoLog);

        free ( infoLog );
    }

    return shader;
}


Context::Context (char * id) {

    //printf("[Context] id : %s, filter : %s\n",id, filter);
    // Context configurations
    EmscriptenWebGLContextAttributes attrs;
    attrs.explicitSwapControl = 0;
    attrs.depth = 1;
    attrs.stencil = 1;
    attrs.antialias = 1;
    attrs.majorVersion = 2;
    attrs.minorVersion = 0;

    context = emscripten_webgl_create_context(id, &attrs);
    Mtime_js(0);
    emscripten_webgl_make_context_current(context);
    Mtime_js(21);

    GLuint vertexShader;
    GLuint fragmentShader;

    // Compile shaders
    int i;
    for (i = 0; i < 5; i++){
        switch(i){
            case 0:
                fragmentShader = CompileShader(GL_FRAGMENT_SHADER, &texture_load_fragment_source);
                vertexShader = CompileShader(GL_VERTEX_SHADER, &vertex_source);
                break;
            case 1:
                fragmentShader = CompileShader(GL_FRAGMENT_SHADER, &sharpen_fragment_source);
                vertexShader = CompileShader(GL_VERTEX_SHADER, &vertex_source);
                break;
            case 2:
                fragmentShader = CompileShader(GL_FRAGMENT_SHADER, &unsharp_fragment_source);
                vertexShader = CompileShader(GL_VERTEX_SHADER, &vertex_source);
                break;
            case 3:
                fragmentShader = CompileShader(GL_FRAGMENT_SHADER, &brightness_fragment_source);
                vertexShader = CompileShader(GL_VERTEX_SHADER, &vertex_source);
                break;
            case 4:
                fragmentShader = CompileShader(GL_FRAGMENT_SHADER, &edge_detect_fragment_source);
                vertexShader = CompileShader(GL_VERTEX_SHADER, &vertex_source);
                break;
        }
        // Build program
        programObject[i] = glCreateProgram();

        glAttachShader(programObject[i], vertexShader);
        glAttachShader(programObject[i], fragmentShader);

        glBindAttribLocation(programObject[i], 0, "position");

        glLinkProgram(programObject[i]);
        glValidateProgram(programObject[i]);
    }
    //emscripten_webgl_make_context_current(context);
}

Context::~Context (void) {
    emscripten_webgl_destroy_context(context);
}


void Context::run (uint8_t* buffer, int width, int height, float alpha, int index) {

    Itime_js(0);

    // Make the context current and use the program
    Mtime_js(0);
    emscripten_webgl_make_context_current(context);
    Mtime_js(1);
    glUseProgram( programObject[index] );
    Mtime_js(2);

    GLuint texId;
    GLuint vertexObject;
    GLuint indexObject;

    // Get the attribute/sampler locations
    GLint positionLoc = glGetAttribLocation(programObject[index], "position"); //position이라는 이름으로 바인딩된 lcation을 불러온다.
    GLint texCoordLoc = glGetAttribLocation(programObject[index], "texCoord");
    GLint textureLoc = glGetUniformLocation(programObject[index], "texture");

    Mtime_js(3);

    // For "ERROR :GL_INVALID_OPERATION : glUniform1i: wrong uniform function for type"
    // https://www.khronos.org/registry/OpenGL-Refpages/es3.0/html/glUniform.xhtml
    float widthUniform = glGetUniformLocation(programObject[index], "width");
    float heightUniform = glGetUniformLocation(programObject[index], "height");
    float alphaUniform = glGetUniformLocation(programObject[index], "alpha");
    glUniform1f(widthUniform, (float) width);
    glUniform1f(heightUniform, (float) height);
    glUniform1f(alphaUniform, (float) alpha);

    Mtime_js(4);


    // Generate a texture object
    glGenTextures(1, &texId); // texture 1개를 generate하고 이름을 저장
    Mtime_js(5);
    glUniform1i(textureLoc, 0); // 초기화
    Mtime_js(5);
    glActiveTexture(GL_TEXTURE0);

    Mtime_js(5);

    // Bind it
    glBindTexture(GL_TEXTURE_2D, texId); //texId에 있는 값(name)을 GL_TEXTURE_2D에 바인딩

    Mtime_js(6);

    // Load the texture from the image buffer
    glTexImage2D( GL_TEXTURE_2D, 0, GL_RGBA, width, height, 0, GL_RGBA, GL_UNSIGNED_BYTE, buffer); // GL_TEXTURE_2D에 buffur의 data를 specify

    Mtime_js(7);

    glTexParameteri( GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST); //텍스쳐가 폴리곤보다 크거나 작을때 사용할 값을 설정하는 필터
    glTexParameteri( GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);

    Mtime_js(8);

    // Vertex data of texture bounds
    GLfloat vVertices[] = { -1.0,  1.0, 0.0, 0.0, 0.0, -1.0, -1.0, 0.0, 0.0, 1.0,
                             1.0, -1.0, 0.0, 1.0,  1.0, 1.0, 1.0, 0.0, 1.0,  0.0}; // UV좌표 (0,0)->(0,1)->(1,1)->(1,0) -> 모든 텍스쳐 그림
    GLushort indices[] = { 0, 1, 2, 0, 2, 3 };

    glGenBuffers(1, &vertexObject);
    Mtime_js(9);
    glBindBuffer(GL_ARRAY_BUFFER, vertexObject);
    Mtime_js(10);
    glBufferData(GL_ARRAY_BUFFER, sizeof(vVertices), vVertices, GL_STATIC_DRAW); // xyz, 텍스쳐xy
    Mtime_js(11);

    glGenBuffers(1, &indexObject);
    Mtime_js(12);
    glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, indexObject);
    Mtime_js(13);
    glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(indices), indices, GL_STATIC_DRAW);
    Mtime_js(14);

    // Set the viewport
    glViewport(0, 0, width, height);
    Mtime_js(15);
    glClear(GL_COLOR_BUFFER_BIT);
    Mtime_js(16);

    // Load and enable the vertex position and texture coordinates
    glVertexAttribPointer(positionLoc, 3, GL_FLOAT, GL_FALSE, 5 * sizeof(GLfloat), 0); // xyz 구성 = 3, float = GLFLOAT, no normalize, (3+2) * 4, address 0
    Mtime_js(17);
    glVertexAttribPointer(texCoordLoc, 2, GL_FLOAT, GL_FALSE, 5 * sizeof(GLfloat), (GLvoid*) (3 * sizeof(GLfloat))); // x,y 구성 =2, float, no normalize, (3+2)*4, 0+3*4
    Mtime_js(18);

    glEnableVertexAttribArray(positionLoc);
    Mtime_js(19);
    glEnableVertexAttribArray(texCoordLoc);
    Mtime_js(20);

    /*
    glEnable(GL_BLEND);
    glBlendFunc(GL_SRC_ALPHA, GL_DST_ALPHA);
    */
    // Draw
    glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_SHORT, 0); // indice 순서로 삼각형을 그린다 =>사각형이 그려짐
    Mtime_js(21);

    Itime_js(1);
}
