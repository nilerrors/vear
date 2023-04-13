#include "tokens.h"


class Lexer {
private:
    Token tokens[];
public:
    Lexer();
    Lexer(const char *file_path);
};
