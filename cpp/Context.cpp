#include "Context.h"

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

std::string contrast_fragment_source =
    "precision mediump float;                            \n"
    "varying vec2 v_texCoord;                            \n"
    "uniform sampler2D texture;                        \n"
    "uniform float alpha;  \n"
    "void main()                                         \n"
    "{                                                   \n"
    "  vec4 contrast = texture2D( texture, v_texCoord); \n"
    "  gl_FragColor = vec4( vec3(contrast), alpha);   \n"
    "}                                                   \n";

std::string brightness_fragment_source =
    "precision mediump float;                            \n"
    "varying vec2 v_texCoord;                            \n"
    "uniform sampler2D texture;                        \n"
    "uniform float brightness;  \n"
    "void main()                                         \n"
    "{                                                   \n"
    "  vec4 contrast = texture2D( texture, v_texCoord); \n"
    "  gl_FragColor = vec4( vec3(contrast) + vec3(brightness), 1.0 );   \n"
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


Context::Context (int w, int h, float a, float b, char *filter, char * id) {

    width = w;
    height = h;
    alpha = a;
    brightness = b;

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
    emscripten_webgl_make_context_current(context);

    // Compile shaders
    if (std::string(filter) == "textureLoad") {
        fragmentShader = CompileShader(GL_FRAGMENT_SHADER, &texture_load_fragment_source);
        vertexShader = CompileShader(GL_VERTEX_SHADER, &vertex_source);
    }
    else if (std::string(filter) == "Sharpen") {
        fragmentShader = CompileShader(GL_FRAGMENT_SHADER, &sharpen_fragment_source);
        vertexShader = CompileShader(GL_VERTEX_SHADER, &vertex_source);
    }
    else if (std::string(filter) == "Unsharp") {
        fragmentShader = CompileShader(GL_FRAGMENT_SHADER, &unsharp_fragment_source);
        vertexShader = CompileShader(GL_VERTEX_SHADER, &vertex_source);
    }
    else if (std::string(filter) == "Contrast") {
        fragmentShader = CompileShader(GL_FRAGMENT_SHADER, &contrast_fragment_source);
        vertexShader = CompileShader(GL_VERTEX_SHADER, &vertex_source);
    }
    else if (std::string(filter) == "Brightness") {
        fragmentShader = CompileShader(GL_FRAGMENT_SHADER, &brightness_fragment_source);
        vertexShader = CompileShader(GL_VERTEX_SHADER, &vertex_source);
    }
    else if (std::string(filter) == "edgeDetect") {
        fragmentShader = CompileShader(GL_FRAGMENT_SHADER, &edge_detect_fragment_source);
        vertexShader = CompileShader(GL_VERTEX_SHADER, &vertex_source);
    }

    // Build program
    programObject = glCreateProgram();

    glAttachShader(programObject, vertexShader);
    glAttachShader(programObject, fragmentShader);

    glBindAttribLocation(programObject, 0, "position");

    glLinkProgram(programObject);
    glValidateProgram(programObject);
}

Context::~Context (void) {
    emscripten_webgl_destroy_context(context);
}


void Context::run (uint8_t* buffer) {

    // Make the context current and use the program
    emscripten_webgl_make_context_current(context);
    glUseProgram( programObject );

    GLuint texId;
    GLuint vertexObject;
    GLuint indexObject;

    // Get the attribute/sampler locations
    GLint positionLoc = glGetAttribLocation(programObject, "position"); //position이라는 이름으로 바인딩된 lcation을 불러온다.
    GLint texCoordLoc = glGetAttribLocation(programObject, "texCoord");
    GLint textureLoc = glGetUniformLocation(programObject, "texture");

    // For "ERROR :GL_INVALID_OPERATION : glUniform1i: wrong uniform function for type"
    // https://www.khronos.org/registry/OpenGL-Refpages/es3.0/html/glUniform.xhtml
    float widthUniform = glGetUniformLocation(programObject, "width");
    float heightUniform = glGetUniformLocation(programObject, "height");
    float alphaUniform = glGetUniformLocation(programObject, "alpha");
    float brightnessUniform = glGetUniformLocation(programObject, "brightness");
    glUniform1f(widthUniform, (float) width);
    glUniform1f(heightUniform, (float) height);
    glUniform1f(alphaUniform, (float) alpha);
    glUniform1f(brightnessUniform, (float) brightness);


    // Generate a texture object
    glGenTextures(1, &texId); // texture 1개를 generate하고 이름을 저장
    glUniform1i(textureLoc, 0); // 초기화 (쓸모없음)

    // Bind it
    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_2D, texId); //texId에 있는 값(name)을 GL_TEXTURE_2D에 바인딩

    // Load the texture from the image buffer
    glTexImage2D( GL_TEXTURE_2D, 0, GL_RGBA, width, height, 0, GL_RGBA, GL_UNSIGNED_BYTE, buffer); // GL_TEXTURE_2D에 buffur의 data를 specify
    glTexParameteri( GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST); //텍스쳐가 폴리곤보다 크거나 작을때 사용할 값을 설정하는 필터
    glTexParameteri( GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);

    // Vertex data of texture bounds
    GLfloat vVertices[] = { -1.0,  1.0, 0.0, 0.0, 0.0, -1.0, -1.0, 0.0, 0.0, 1.0,
                             1.0, -1.0, 0.0, 1.0,  1.0, 1.0, 1.0, 0.0, 1.0,  0.0}; // UV좌표 (0,0)->(0,1)->(1,1)->(1,0) -> 모든 텍스쳐 그림
    GLushort indices[] = { 0, 1, 2, 0, 2, 3 };

    glGenBuffers(1, &vertexObject);
    glBindBuffer(GL_ARRAY_BUFFER, vertexObject);
    glBufferData(GL_ARRAY_BUFFER, sizeof(vVertices), vVertices, GL_STATIC_DRAW); // xyz, 텍스쳐xy

    glGenBuffers(1, &indexObject);
    glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, indexObject);
    glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(indices), indices, GL_STATIC_DRAW);

    // Set the viewport
    glViewport(0, 0, width, height);
    glClear(GL_COLOR_BUFFER_BIT);

    // Load and enable the vertex position and texture coordinates
    glVertexAttribPointer(positionLoc, 3, GL_FLOAT, GL_FALSE, 5 * sizeof(GLfloat), 0); // xyz 구성 = 3, float = GLFLOAT, no normalize, (3+2) * 4, address 0
    glVertexAttribPointer(texCoordLoc, 2, GL_FLOAT, GL_FALSE, 5 * sizeof(GLfloat), (GLvoid*) (3 * sizeof(GLfloat))); // x,y 구성 =2, float, no normalize, (3+2)*4, 0+3*4

    glEnableVertexAttribArray(positionLoc);
    glEnableVertexAttribArray(texCoordLoc);

    glEnable(GL_BLEND);
    glBlendFunc(GL_SRC_ALPHA, GL_DST_ALPHA);

    // Draw
    glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_SHORT, 0); // indice 순서로 삼각형을 그린다 =>사각형이 그려짐
}
