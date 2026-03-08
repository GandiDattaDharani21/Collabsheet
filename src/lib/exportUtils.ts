import { CellData } from "@/types/spreadsheet";

/**
 * Converts spreadsheet grid data to a CSV string and triggers a download.
 */
export function exportToCSV(
  cells: Record<string, CellData>,
  computedValues: Record<string, string | number>,
  fileName: string = "spreadsheet-export"
) {
  // Determine the range of the sheet (simple A-Z, 1-50 for now)
  const COLS = 26;
  const ROWS = 50;

  let csvContent = "";

  for (let r = 1; r <= ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) {
      const colLetter = String.fromCharCode(65 + c);
      const cellId = `${colLetter}${r}`;
      
      // Use computed value if available, otherwise raw value
      let value = computedValues[cellId] !== undefined ? computedValues[cellId] : (cells[cellId]?.value || "");
      
      // Escape commas and quotes for CSV
      let finalValue = value.toString();
      if (finalValue.includes(",") || finalValue.includes('"') || finalValue.includes("\n")) {
        finalValue = `"${finalValue.replace(/"/g, '""')}"`;
      }
      row.push(finalValue);
    }
    csvContent += row.join(",") + "\n";
  }

  // Create document download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${fileName}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
