import { ASTNode, NodeType } from "./parser.ts";
import { TokenType } from "./token.ts";

export class Formatter {
  private ast: ASTNode;

  constructor(ast: ASTNode) {
    this.ast = ast;
  }

  format(children?: ASTNode[]): string {
    let tabs = 0;
    let code = "";
    function push(c: string | undefined) {
      code += tab(false) + c ?? "";
    }

    function newLine(p = true): string {
      if (p) push("\n");
      return "\n";
    }

    function tab(p = true): string {
      if (p) push("  ".repeat(tabs));
      return "  ".repeat(tabs);
    }

    function space(p = true): string {
      if (p) push(" ");
      return " ";
    }

    function pushTab(): number {
      return ++tabs;
    }

    function popTab(): number {
      return --tabs;
    }

    for (
      const child
        of (children != undefined ? children : this.ast.children ?? [])
    ) {
      if (!child.children || child.children && child.children.length > 0) {
        child.children = (child.children ?? []).filter((c) =>
          c.type != NodeType.NEWLINE && c.type != NodeType.SPACING
        );
      }
      if (child.type == NodeType.SPACING || child.type == NodeType.NEWLINE) {
        continue;
      } else if (child.type == NodeType.IMPORT) {
        push(child.value.token.value);
        push(" ");
        push(
          child.value.from.token.type == TokenType.STRING
            ? child.value.from.token.value
            : undefined,
        );
        if (child.value.includes) {
          if (child.value.includes.constructor.name == "Array") {
            push(":{");
            newLine();
            pushTab();
            for (const include of child.value.includes) {
              push(include);
              newLine();
            }
            popTab();
            push("}");
          } else if (child.value.includes.everything) {
            push(":{*}");
          }
          newLine();
          newLine();
        }
      } else if (child.type == NodeType.ENUM) {
        push("enum");
        space();
        push(child.value.name.name);
        space();
        push("{");
        if (child.children && child.children.length > 0) {
          newLine();
          pushTab();
          for (const enum_val of child.children) {
            push(
              enum_val.type == NodeType.ENUM_VAL
                ? enum_val.value.name.name
                : undefined,
            );
            newLine();
          }
          popTab();
        }
        push("}");
        newLine();
        newLine();
      } else if (child.type == NodeType.FN) {
        push("fn");
        space();
        push(child.value.name.name);
        push("(");
        if (child.value.parameters && child.value.parameters.length > 0) {
          newLine();
          pushTab();
          for (const parameter of child.value.parameters) {
            push(parameter.name.name);
            space();
            push(parameter.type.name);
            newLine();
          }
          popTab();
        }
        push(")");
        space();
        if (child.value.returnType) {
          push(child.value.returnType.type);
          space();
        }
        if (!child.children || child.children.length == 0) {
          push("{}");
        } else if (child.children.length == 1) {
          push("->");
          space();
          push(this.format(child.children));
        } else if (child.children.length > 0) {
          push("{");
          newLine();
          pushTab();
          for (const line of this.format(child.children).split("\n")) {
            if (line.length > 0) {
              push(line);
              newLine();
            }
          }
          popTab();
          push("}");
        }
        newLine();
        newLine();
      }
    }
    return code;
  }
}
