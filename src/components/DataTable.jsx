import { formatDateTime, formatValue, tableLabel } from "../lib/format.js";
import { StatusBadge } from "./StatusBadge.jsx";

const DATE_COLUMNS = new Set(["created_at", "createdAt", "updated_at", "updatedAt"]);

function renderCell(row, column, wrap) {
  if (column === "status") return <StatusBadge status={row[column]} />;
  if (DATE_COLUMNS.has(column)) return formatDateTime(row[column]);

  const value = row[column];
  if (wrap && value && typeof value === "string" && value.length > 24) {
    return (
      <span className="cell-wrap-text" title={value}>
        {value}
      </span>
    );
  }

  return (
    <>
      {formatValue(value)}
      {column === "isLeader" && row.isLeader && <span className="inline-badge">팀장</span>}
    </>
  );
}

export function DataTable({ rows, columns, actions, compact = false, fluid = false, wrap = false }) {
  const wrapClass = [
    "table-wrap",
    compact && "table-wrap-compact",
    fluid && "table-wrap-fluid",
    wrap && "table-wrap-wrap"
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapClass}>
      <table className={wrap ? "table-fixed-layout" : ""}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} className={wrap ? `col-${column}` : ""}>
                {tableLabel(column)}
              </th>
            ))}
            {actions && <th>관리</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((column) => (
                <td key={column} className={wrap ? `col-${column}` : ""}>
                  {renderCell(row, column, wrap)}
                </td>
              ))}
              {actions && <td className="row-actions">{actions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <p className="empty-line">표시할 데이터가 없습니다.</p>}
    </div>
  );
}
