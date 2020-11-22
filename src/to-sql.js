import { visit } from "./visitors";

export function toSql(query) {
  return visit(query.toAST());
}