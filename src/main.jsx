import React from "react"

import Vector from "./Vector"
import SnakeGame from "./SnakeGame"
import Board from "./Board"

// 0. Setup
// - Vector
// - styles
// - index.html

// 1. Static board
// - propTypes: component API, checked by React
// - React warnings: class vs className, lack of keys
// - classNames function

// 2. SnakeGame
// - composition
// - state: component is still a function
// - random fruit in state

// 3. Snake's moving
// - component lifecycle (componentDidMount)
// - ticks stream (onValue, log)
// - initial position & direction (defaultProps)
// - directions stream v1 (map marble)
// - heads stream (scan marble)
// - setState

// 4. Snake's changing direction
// - (refactor componentDidMount into inputStreams and snakeHeadPositions)
// - keys stream (filter marble)
// - actions stream (merge marble)
// - directions stream - snake's head is moving on key press (scan marble again)
// - snake's head is moving (sampledBy marble)

// 5. Snake is 3 cells long
// - slidingWindow

// 6. Snake eats fruits
// - fruitEatenEvents stream
// - score on fruitEatenEvent
// - new random fruit on fruitEatenEvent
// - slidingWindow doesn't work?
// - snake is getting bigger (scan marble again)
