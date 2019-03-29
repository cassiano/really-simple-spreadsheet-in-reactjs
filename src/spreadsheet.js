import React from "react";
import Util from "./util";
import Cell from "./cell";
import CellVisualizer from "./cell_visualizer";
import PropTypes from "prop-types";
import "./set_functions";

class Spreadsheet extends React.Component {
  static DEBUG = true;

  constructor(props) {
    super(props);

    const cells = Array(props.initialRows)
      .fill()
      .map((_, row) =>
        Array(props.initialCols)
          .fill()
          .map((_, col) => new Cell(this, Util.asRef(row, col)))
      );

    this.state = {
      cells: cells
    };
  }

  // Initialize the spreadsheet with Fibonacci and Factorial sequences.
  componentDidMount() {
    this.setState((state, props) => {
      this.clonedCells = state.cells.map(row => row.map(cell => cell.clone()));

      // ///////////////
      // // Fibonacci //
      // ///////////////

      // const FIBONACCI_ROWS = 10;

      // this.cellAt(`B${FIBONACCI_ROWS}`, this.clonedCells); // Expand cells as needed (only once).

      // this.cellAt("A1", this.clonedCells).setValue("FIB(1)");
      // this.cellAt("B1", this.clonedCells).setValue(1);
      // this.cellAt("A2", this.clonedCells).setValue("FIB(2)");
      // this.cellAt("B2", this.clonedCells).setValue(1);

      // [...Array(FIBONACCI_ROWS - 2)].forEach((_, row) => {
      //   this.cellAt(Util.asRef(row + 2, 0), this.clonedCells).setValue(
      //     `FIB(${row + 3})`
      //   );

      //   this.cellAt(Util.asRef(row + 2, 1), this.clonedCells).setValue(
      //     `=B${row + 2}+B${row + 1}`
      //   );
      // });

      // ////////////////
      // // Factorials //
      // ////////////////

      // const FACTORIAL_ROWS = 10;

      // this.cellAt(`E${FACTORIAL_ROWS}`, this.clonedCells); // Expand cells as needed (only once).

      // this.cellAt("D1", this.clonedCells).setValue("1!");
      // this.cellAt("E1", this.clonedCells).setValue(1);

      // [...Array(FACTORIAL_ROWS - 1)].forEach((_, row) => {
      //   this.cellAt(Util.asRef(row + 1, 3), this.clonedCells).setValue(
      //     `${row + 2}!`
      //   );

      //   this.cellAt(Util.asRef(row + 1, 4), this.clonedCells).setValue(
      //     `=${row + 2}*E${row + 1}`
      //   );
      // });

      //////////////////////
      // Spiral Fibonacci //
      //////////////////////

      const BORDER_TOP_LEFT = "A1";
      const BORDER_BOTTOM_RIGHT = "H6";
      const [borderTopLeftRow, borderTopLeftCol] = Util.rowColFromRef(
        BORDER_TOP_LEFT
      );
      const [borderBottomRightRow, borderBottomRightCol] = Util.rowColFromRef(
        BORDER_BOTTOM_RIGHT
      );

      for (col = borderTopLeftCol + 1; col < borderBottomRightCol; col++) {
        this.cellAt(
          Util.asRef(borderTopLeftRow, col),
          this.clonedCells
        ).setValue("━━━━");
        this.cellAt(
          Util.asRef(borderBottomRightRow, col),
          this.clonedCells
        ).setValue("━━━━");
      }

      for (row = borderTopLeftRow + 1; row < borderBottomRightRow; row++) {
        this.cellAt(
          Util.asRef(row, borderTopLeftCol),
          this.clonedCells
        ).setValue("┃");
        this.cellAt(
          Util.asRef(row, borderBottomRightCol),
          this.clonedCells
        ).setValue("┃");
      }

      this.cellAt(BORDER_TOP_LEFT, this.clonedCells).setValue("┏");
      this.cellAt(
        Util.asRef(borderTopLeftRow, borderBottomRightCol),
        this.clonedCells
      ).setValue("┓");
      this.cellAt(BORDER_BOTTOM_RIGHT, this.clonedCells).setValue("┛");
      this.cellAt(
        Util.asRef(borderBottomRightRow, borderTopLeftCol),
        this.clonedCells
      ).setValue("┗");

      const directions = {
        right: {
          row: idx => idx,
          col: idx => idx + 1,
          turn: { right: "down", left: "up" }
        },
        down: {
          row: idx => idx + 1,
          col: idx => idx,
          turn: { right: "left", left: "right" }
        },
        left: {
          row: idx => idx,
          col: idx => idx - 1,
          turn: { right: "up", left: "down" }
        },
        up: {
          row: idx => idx - 1,
          col: idx => idx,
          turn: { right: "right", left: "left" }
        }
      };

      const walk = (direction, row, col) => [
        directions[direction].row(row),
        directions[direction].col(col)
      ];

      let visitedCells = [];
      let direction = "down";
      let cell = this.cellAt(
        Util.asRef(borderTopLeftRow + 1, borderTopLeftCol + 1),
        this.clonedCells
      );
      let nextCell, row, col, previousRow, previousCol;

      while (true) {
        [row, col] = Util.rowColFromRef(cell.ref);

        if (cell.value !== "") {
          break;
        }

        if (visitedCells.length < 2) {
          cell.setValue(1);
        } else {
          cell.setValue(
            `=${visitedCells[visitedCells.length - 2].ref}+${
              visitedCells[visitedCells.length - 1].ref
            }`
          );
        }

        visitedCells = visitedCells.concat(cell);

        [previousRow, previousCol] = [row, col];

        // Walk!
        [row, col] = walk(direction, row, col);

        // Did we reach the spreadsheet (lower) boundaries?
        nextCell =
          row < 0 || col < 0
            ? undefined
            : this.cellAt(Util.asRef(row, col), this.clonedCells);

        // Did we reach another filled cell?
        if (nextCell && nextCell.value === "") {
          // No. Keep on walking in the same direction.
          cell = nextCell;
        } else {
          // Yes! Backup one step, turn right/left and walk again.
          direction = directions[direction].turn.left;
          cell = this.cellAt(
            Util.asRef(...walk(direction, previousRow, previousCol)),
            this.clonedCells
          );
        }
      }

      return { cells: this.clonedCells };
    });
  }

  static rows(cells = this.clonedCells) {
    return cells.length;
  }

  static cols(cells = this.clonedCells) {
    return Math.max(...cells.filter(row => Boolean).map(row => row.length)); // Ignore empty rows.
  }

  cellAt(ref, cells = this.clonedCells) {
    const [row, col] = Util.rowColFromRef(ref);

    if (
      row >= Spreadsheet.rows(cells) ||
      col >= Spreadsheet.cols(cells) ||
      !cells[row] ||
      !cells[row][col]
    ) {
      cells[row] = cells[row] || [];
      cells[row][col] = new Cell(this, Util.asRef(row, col));

      // Fill blank cells.
      for (let r = 0; r < Spreadsheet.rows(cells); r++) {
        cells[r] = cells[r] || [];

        for (let c = 0; c < Spreadsheet.cols(cells); c++) {
          if (!cells[r][c]) {
            cells[r][c] = new Cell(this, Util.asRef(r, c));
          }
        }
      }
    }

    return cells[row][col];
  }

  detectAffectedCells(cells, currentCell, value) {
    if (currentCell.value === value) {
      return new Set();
    }

    let affectedCells = new Set([currentCell.ref]);
    let formulaRefs = new Set();

    if (Util.isFormula(value)) {
      formulaRefs = Util.findRefsInFormula(value);
    }

    let removedRefs = currentCell.observedCells.diff(formulaRefs);

    affectedCells.concat(formulaRefs);
    affectedCells.concat(removedRefs);

    const allObservers = this.directAndIndirectObservers(
      currentCell.ref,
      cells
    );

    affectedCells.concat(allObservers);

    return affectedCells;
  }

  directAndIndirectObservers(ref, cells, visited = new Set()) {
    visited.add(ref);

    const observers = this.cellAt(ref, cells).observerCells;

    if (observers.size === 0) {
      return new Set();
    }

    const observersOfObservers = [...observers].reduce(
      (acc, ref2) =>
        visited.has(ref2)
          ? acc
          : acc.concat(this.directAndIndirectObservers(ref2, cells, visited)),
      new Set()
    );

    return new Set(observers).concat(observersOfObservers);
  }

  handleBlur(event, row, col) {
    const value = event.target.value;

    this.setState((state, props) => {
      const currentCell = state.cells[row][col];
      const affectedCells = this.detectAffectedCells(
        state.cells,
        currentCell,
        value
      );

      // console.log(`Affected cells: ${[...affectedCells]}`);

      // Clone only previously recalculated, touched or (possibly) affected cells.
      this.clonedCells = state.cells.map(row =>
        row.map(cell =>
          cell.recalculated || cell.touched || affectedCells.has(cell.ref)
            ? cell.clone({ recalculated: false, touched: false })
            : cell
        )
      );

      const currentClonedCell = this.clonedCells[row][col];

      currentClonedCell.setValue(value);

      return { cells: this.clonedCells };
    });
  }

  render() {
    const numCols = Spreadsheet.cols(this.state.cells);
    const numRows = Spreadsheet.rows(this.state.cells);

    const headerRow = [...Array(numCols)].map((_, col) => (
      <td key={col} align="center">
        {Util.colAsRef(col)}
      </td>
    ));

    const dataRows = [...Array(numRows)].map((_, row) => (
      <tr key={row}>
        <td
          align="center"
          style={{ backgroundColor: "lightGray", fontWeight: "bold" }}
        >
          {Util.rowAsRef(row)}
        </td>
        {[...Array(numCols)].map((_, col) => (
          <td key={col}>
            <CellVisualizer
              cell={this.state.cells[row][col]}
              cols={numCols}
              rows={numRows}
              index={col + row * numCols + 1}
              onBlur={e => this.handleBlur(e, row, col)}
            />
          </td>
        ))}
      </tr>
    ));

    let currentStateInfo;

    if (Spreadsheet.DEBUG) {
      currentStateInfo = (
        <pre>
          Spreadsheet: {JSON.stringify(this.state, jsonStringifyReplacer, 2)}
        </pre>
      );
    }

    return (
      <div>
        <table id="spreadsheet" border="1" cellSpacing="0" cellPadding="2">
          <thead style={{ backgroundColor: "lightGray", fontWeight: "bold" }}>
            <tr>
              <td />
              {headerRow}
            </tr>
          </thead>
          <tbody>{dataRows}</tbody>
        </table>
        {currentStateInfo}
      </div>
    );
  }
}

///////////////
// PropTypes //
///////////////

Spreadsheet.propTypes = {
  initialRows: PropTypes.number.isRequired,
  initialCols: PropTypes.number.isRequired
};

function jsonStringifyReplacer(key, value) {
  if (value instanceof Spreadsheet) {
    return undefined; // Ignore it.
  } else if (value instanceof Set) {
    return [...value];
  }

  return value;
}

export default Spreadsheet;
