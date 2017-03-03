import React, {PropTypes} from "react"
import {range} from "underscore"

import Vector from "./Vector"
import style from "./style"
import classNames from "classnames"

class Board extends React.Component {
  render() {
    const {size, snakePositions, fruitPosition} = this.props;
    const rows = range(size.y).map(y => {
      const cells = range(size.x).map(x => {
        const pos = new Vector(x, y);
        return (
          <div
            className={classNames(style.cell, {
              [style.snake]: snakePositions.find(s => pos.equals(s)),
              [style.fruit]: fruitPosition.equals(pos)
            })}
            key={`${y}_${x}`}
          />
        );
      });

      return <div className={style.row} key={y}>{cells}</div>;
    });

    return (
      <div>
        {rows}
      </div>
    );
  }
}

Board.propTypes = {
  size: PropTypes.instanceOf(Vector).isRequired,
  snakePositions: PropTypes.arrayOf(PropTypes.instanceOf(Vector)).isRequired,
  fruitPosition: PropTypes.instanceOf(Vector).isRequired
};

export default Board;