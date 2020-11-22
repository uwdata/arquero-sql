import { visit } from "./visitors";

export function toSql(expr) {
  return visit(expr);
}