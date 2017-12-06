import React, {PropTypes} from "react"
import {Observable} from 'rxjs';
import _ from "underscore"

import Vector from "./Vector"
import Board from "./Board"
import style from "./style"

class SnakeGame extends React.Component {
  constructor(...args) {
    super(...args);

    this.initialState = {
      beataSnakePositions: [this.props.initialBeataSnakePosition],
      adamSnakePositions: [this.props.initialAdamSnakePosition],
      fruitPosition: Vector.random(this.props.boardSize),
      adamScore: 0,
      beataScore: 0
    };

    this.state = this.initialState;

    this.subscriptions = [];
  }

  inputStreams() {
    const tick$ = Observable.interval(100);
    const key$ = Observable
      .fromEvent(document.body, 'keyup')
      .map(e => e.keyCode);

    const beataPlayerControls = this.createPlayerControls(key$, 37, 39);
    const adamPlayerControls = this.createPlayerControls(key$, 65, 68);
    return {tick$, beataPlayerControls, adamPlayerControls};
  }

  createPlayerControls(key$, leftKey, rightKey) {
    return {
      left$: key$.filter(key => key === leftKey),
      right$: key$.filter(key => key === rightKey)
    }
  }

  snakeHeadPositions({tick$, playerControls, initialSnakePosition}) {
    const {boardSize, initialSnakeDirection} = this.props;

    const leftRotation$ = playerControls.left$.mapTo(Vector.rotateLeft);
    const rightRotation$ = playerControls.right$.mapTo(Vector.rotateRight);
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
    this.initStreams();
  }

  playerBitten(length, playerName) {
    switch(playerName) {
      case 'adam': return this.setState({adamScore: length - this.props.initialSnakeLength});
      case 'beata': return this.setState({beataScore: length - this.props.initialSnakeLength});
    }

    // this.unsubscribe();
    // this.setState(this.initialState);
    // this.initStreams();
  }

  initStreams() {
    const {tick$, beataPlayerControls, adamPlayerControls} = this.inputStreams();
    const beataSnakeHeadPosition$ = this.snakeHeadPositions({
      tick$, playerControls: beataPlayerControls, initialSnakePosition: this.props.initialBeataSnakePosition
    });
    const adamSnakeHeadPosition$ = this.snakeHeadPositions({
      tick$, playerControls: adamPlayerControls, initialSnakePosition: this.props.initialAdamSnakePosition
    });

    const beataSnake$ = this.buildSnake$(beataSnakeHeadPosition$, () => this.state.beataScore);
    const adamSnake$ = this.buildSnake$(adamSnakeHeadPosition$, () => this.state.adamScore);

    const beataCollision$ = beataSnakeHeadPosition$.combineLatest(adamSnake$)
      .map(([beataHead, adamSnake]) => {
        const adamLength = adamSnake.length;
        const adamBitten = adamSnake.slice(0, -1).findIndex(el => el.equals(beataHead));
        return adamBitten != -1 && (adamLength - adamBitten);
      })
      .filter(bitten => bitten);

    this.subscriptions.push(
      beataCollision$.subscribe((length) => this.playerBitten(length, 'adam'))
    );

    const adamCollision$ = adamSnakeHeadPosition$.combineLatest(beataSnake$)
      .map(([adamHead, beataSnake]) => {
        const beataLength = beataSnake.length;
        const beataBitten = beataSnake.slice(0, -1).findIndex(el => el.equals(adamHead));
        return beataBitten != -1 && (beataLength - beataBitten);
      })
      .filter(bitten => bitten);

    this.subscriptions.push(
      adamCollision$.subscribe((length) => this.playerBitten(length, 'beata'))
    );

    const rand$ = tick$.map(() => Vector.random(this.props.boardSize));

    const fruitEatenEvent$ = this.buildPlayerFruitEatenEvent(beataSnake$, 'beata')
      .merge(this.buildPlayerFruitEatenEvent(adamSnake$, 'adam'))
      .do((tag) => console.log(tag));

    const fruit$ = fruitEatenEvent$.withLatestFrom(rand$);
    fruit$.subscribe(([playerName, pos]) => {
      this.setState({
        fruitPosition: pos,
        ...this.setScore(playerName)
      });
    });

    this.subscriptions.push(
      beataSnake$.subscribe(pos => {
        return this.setState({beataSnakePositions: pos});
      })
    );
    this.subscriptions.push(
      adamSnake$.subscribe(pos => {
        return this.setState({adamSnakePositions: pos});
      })
    );
  }

  setScore(playerName) {
    switch(playerName) {
      case 'beata': return {beataScore: this.state.beataScore + 1};
      case 'adam': return {adamScore: this.state.adamScore + 1};
    }
  }

  buildPlayerFruitEatenEvent(snake$, playerName) {
    return snake$
      .filter(snake => snake[snake.length - 1].equals(this.state.fruitPosition))
      .do(snake => console.log('BANG', snake[snake.length - 1], this.state.fruitPosition))
      .map(() => playerName);
  }

  buildSnake$(snakeHeadPosition$, currentScore) {
    return snakeHeadPosition$
      .scan((snake, head) => {
        const biggerSnake = snake.concat([head]);
        return _.last(biggerSnake, this.props.initialSnakeLength + currentScore());
      }, []);
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  unsubscribe() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  render() {
    const {boardSize} = this.props;
    const {fruitPosition, beataSnakePositions, adamSnakePositions} = this.state;

    return (
      <div className={style.game}>
        <div className={style.log}>Beata's Score: {this.state.beataScore}</div>
        <div className={style.log}>Adam's Score: {this.state.adamScore}</div>
        <Board size={boardSize} fruitPosition={fruitPosition} beataSnakePositions={beataSnakePositions} adamSnakePositions={adamSnakePositions} />
      </div>
    );
  }
}

SnakeGame.propTypes = {
  boardSize: PropTypes.instanceOf(Vector)
};

SnakeGame.defaultProps = {
  initialBeataSnakePosition: new Vector(19, 0),
  initialAdamSnakePosition: new Vector(0, 0),
  initialSnakeDirection: new Vector(0, 1),
  initialSnakeLength: 3
};

export default SnakeGame;