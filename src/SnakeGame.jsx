import React, {PropTypes} from "react"
import {Observable} from 'rxjs';
import _ from "underscore"

import Vector from "./Vector"
import Board from "./Board"
import style from "./style"

class SnakeGame extends React.Component {
  constructor(...args) {
    super(...args);

    this.state = {
      snakePositions: [this.props.initialSnakePosition],
      fruitPosition: Vector.random(this.props.boardSize),
      score: 0
    };
  }

  inputStreams() {
    const tick$ = Observable.interval(100);
    const key$ = Observable
      .fromEvent(document.body, 'keyup')
      .map(e => e.keyCode);
    const left$ = key$.filter(key => key === 37);
    const right$ = key$.filter(key => key === 39);

    return {tick$, left$, right$};
  }

  snakeHeadPositions({tick$, left$, right$}) {
    const {boardSize, initialSnakePosition, initialSnakeDirection} = this.props;

    const leftRotation$ = left$.mapTo(Vector.rotateLeft);
    const rightRotation$ = right$.mapTo(Vector.rotateRight);
    const action$ = Observable.merge(leftRotation$, rightRotation$);
    const direction$ = action$
      .scan((pos, action) => action(pos), initialSnakeDirection)
      .startWith(initialSnakeDirection);
    const snakeHeadPosition$ = tick$
      .withLatestFrom(direction$, (_, dir) => dir)
      .scan((pos, dir) => pos.add(dir).mod(boardSize), initialSnakePosition);

    return snakeHeadPosition$;
  }

  componentDidMount() {
    const snakeHeadPosition$ = this.snakeHeadPositions(this.inputStreams());
    const snake$ = snakeHeadPosition$
      .scan((snake, head) => {
        const biggerSnake = snake.concat([head]);
        return _.last(biggerSnake, this.props.initialSnakeLength + this.state.score);
      }, []);
    const collision$ = snake$
      .map(snake => snake.filter(el => el.equals(snake[0])).length)
      .do(x => console.log(x))
      .filter(collisions => collisions > 1);

    collision$.subscribe(x => console.log('Game Over'));

    const fruitEatenEvent$ = snakeHeadPosition$
      .filter(head => head.equals(this.state.fruitPosition));

    fruitEatenEvent$.subscribe(() => {
      this.setState({
        fruitPosition: Vector.random(this.props.boardSize),
        score: this.state.score + 1
      });
    });

    this.subscription = snake$.subscribe(pos => {
      // console.log(pos);
      return this.setState({snakePositions: pos});
    });
  }

  componentWillUnmount() {
    this.subscription.unsubscribe();
  }

  render() {
    const {boardSize} = this.props;
    const {fruitPosition, snakePositions} = this.state;

    return (
      <div className={style.game}>
        <div className={style.log}>Score: {this.state.score}</div>
        <Board size={boardSize} fruitPosition={fruitPosition} snakePositions={snakePositions}/>
      </div>
    );
  }
}

SnakeGame.propTypes = {
  boardSize: PropTypes.instanceOf(Vector)
};

SnakeGame.defaultProps = {
  initialSnakePosition: new Vector(0, 0),
  initialSnakeDirection: new Vector(0, 1),
  initialSnakeLength: 3
};

export default SnakeGame;