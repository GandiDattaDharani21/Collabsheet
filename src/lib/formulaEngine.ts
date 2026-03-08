/**
 * Lightweight formula parser and evaluator for the spreadsheet.
 * Supports:
 * - Basic arithmetic: +, -, *, /
 * - Cell references: A1, B2, etc.
 * - SUM function: =SUM(A1:A5)
 * - Circular dependency detection
 */

export interface CellValueProvider {
  (cellId: string, evaluationStack: string[]): string | number;
}

export class FormulaEngine {
  /**
   * Extracts all cell references from a formula.
   */
  static extractDependencies(formula: string): string[] {
    if (!formula.startsWith('=')) return [];
    
    const dependencies: Set<string> = new Set();
    const expression = formula.substring(1).trim();

    // Match single cell references (e.g., A1, B22)
    const cellMatches = expression.match(/[A-Z]+[0-9]+/g) || [];
    cellMatches.forEach(dep => dependencies.add(dep));

    // Match ranges (e.g., A1:B5)
    const rangeMatches = expression.match(/[A-Z]+[0-9]+:[A-Z]+[0-9]+/g) || [];
    rangeMatches.forEach(range => {
      const [start, end] = range.split(':');
      const startCol = start.match(/[A-Z]+/)?.[0];
      const startRow = parseInt(start.match(/[0-9]+/)?.[0] || '0');
      const endCol = end.match(/[A-Z]+/)?.[0];
      const endRow = parseInt(end.match(/[0-9]+/)?.[0] || '0');

      if (startCol && endCol) {
        for (let r = Math.min(startRow, endRow); r <= Math.max(startRow, endRow); r++) {
          for (let c = startCol.charCodeAt(0); c <= endCol.charCodeAt(0); c++) {
            dependencies.add(String.fromCharCode(c) + r);
          }
        }
      }
    });

    return Array.from(dependencies);
  }

  /**
   * Evaluates a formula string.
   * Formulas must start with "=".
   * evaluationStack is used to detect circular dependencies.
   */
  static evaluate(
    formula: string, 
    getCellValue: CellValueProvider, 
    currentCellId: string,
    evaluationStack: string[] = []
  ): string | number {
    if (!formula.startsWith('=')) {
      return formula;
    }

    // Circular dependency detection
    if (evaluationStack.includes(currentCellId)) {
      return '#REF!';
    }

    const nextStack = [...evaluationStack, currentCellId];
    const expression = formula.substring(1).trim();

    // 1. Single cell reference check (e.g., =A1) - return original type
    if (/^[A-Z]+[0-9]+$/i.test(expression)) {
      return getCellValue(expression.toUpperCase(), nextStack);
    }

    try {
      // 2. Handle SUM function as a replacement (supports =SUM(A1:A5) + 10)
      let processedExpression = expression.replace(/SUM\(([A-Z]+[0-9]+:[A-Z]+[0-9]+)\)/gi, (match, range) => {
        const sumResult = this.evaluateSum(range, getCellValue, nextStack);
        return sumResult.toString();
      });

      // 3. Handle simple arithmetic and cell references (convert to numbers)
      const resolvedExpression = processedExpression.replace(/[A-Z]+[0-9]+/gi, (match) => {
        const value = getCellValue(match.toUpperCase(), nextStack);
        if (value === '#REF!') throw new Error('CIRCULAR');
        return this.toNumber(value).toString();
      });

      // 4. Sanitize: only allow numbers, operators, parens, dots, and spaces
      if (!/^[0-9+\-*/().\s]+$/.test(resolvedExpression)) {
        return '#ERROR!';
      }

      // eslint-disable-next-line no-new-func
      const result = new Function(`return ${resolvedExpression}`)();
      
      if (typeof result === 'number') {
        if (isNaN(result) || !isFinite(result)) return '#NUM!';
        return Number(result.toFixed(2));
      }
      return result?.toString() || '';
    } catch (error: any) {
      if (error.message === 'CIRCULAR') return '#REF!';
      console.error('Formula evaluation error:', error);
      return '#ERROR!';
    }
  }

  private static evaluateSum(
    range: string, 
    getCellValue: CellValueProvider, 
    evaluationStack: string[]
  ): number | string {
    const [start, end] = range.split(':');
    if (!start || !end) return 0;

    const startCol = start.match(/[A-Z]+/i)?.[0].toUpperCase();
    const startRow = parseInt(start.match(/[0-9]+/)?.[0] || '0');
    const endCol = end.match(/[A-Z]+/i)?.[0].toUpperCase();
    const endRow = parseInt(end.match(/[0-9]+/)?.[0] || '0');

    if (!startCol || !endCol || isNaN(startRow) || isNaN(endRow)) return 0;

    let total = 0;
    
    for (let r = Math.min(startRow, endRow); r <= Math.max(startRow, endRow); r++) {
      for (let c = startCol.charCodeAt(0); c <= endCol.charCodeAt(0); c++) {
        const cellId = String.fromCharCode(c) + r;
        const val = getCellValue(cellId, evaluationStack);
        if (val === '#REF!') return '#REF!';
        total += this.toNumber(val);
      }
    }

    return Number(total.toFixed(2));
  }

  static toNumber(value: string | number): number {
    if (typeof value === 'number') return value;
    if (!value || value === '#REF!' || value === '#ERROR!') return 0;
    
    // Remove commas and other common non-numeric chars for parsing
    const sanitized = value.toString().replace(/,/g, '').trim();
    const parsed = parseFloat(sanitized);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Shifts cell references in a formula based on row/column insertions or deletions.
   */
  static shiftReferences(
    formula: string,
    type: 'row' | 'col',
    index: number,
    amount: number
  ): string {
    if (!formula.startsWith('=')) return formula;

    return formula.replace(/([A-Z]+)([0-9]+)/g, (match, col, rowStr) => {
      const row = parseInt(rowStr);
      const colIndex = col.charCodeAt(0) - 65; // Simple A-Z handling

      if (type === 'row') {
        if (row >= index) {
          const newRow = row + amount;
          return newRow > 0 ? `${col}${newRow}` : '#REF!';
        }
      } else {
        if (colIndex >= index) {
          const newColIndex = colIndex + amount;
          if (newColIndex < 0) return '#REF!';
          return `${String.fromCharCode(65 + newColIndex)}${row}`;
        }
      }
      return match;
    });
  }
}
