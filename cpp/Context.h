class Context {
public:
    Context (char * id);

    ~Context (void);

    void run (uint8_t* buffer, int width, int height, float alpha, int index);

private:
    GLuint programObject[5];

    EMSCRIPTEN_WEBGL_CONTEXT_HANDLE context;

};
