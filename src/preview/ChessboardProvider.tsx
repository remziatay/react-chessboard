import {
  createContext,
  use,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  fenStringToPositionObject,
  generateBoard,
  getPositionUpdates,
} from '../utils';
import {
  Arrow,
  SquareDataType,
  PieceRenderObject,
  PositionDataType,
  SquareHandlerArgs,
} from '../types';
import { defaultPieces } from '../pieces';
import {
  defaultAlphaNotationStyle,
  defaultArrowOptions,
  defaultBoardStyle,
  defaultDarkSquareNotationStyle,
  defaultDarkSquareStyle,
  defaultLightSquareNotationStyle,
  defaultLightSquareStyle,
  defaultNumericNotationStyle,
  defaultSquareStyle,
} from '../defaults';

type Defined<T> = T extends undefined ? never : T;

type ContextType = {
  // id
  id: Defined<ChessboardOptions['id']>;

  // chessboard options
  pieces: Defined<ChessboardOptions['pieces']>;

  boardOrientation: Defined<ChessboardOptions['boardOrientation']>;
  chessboardRows: Defined<ChessboardOptions['chessboardRows']>;
  chessboardColumns: Defined<ChessboardOptions['chessboardColumns']>;

  boardStyle: Defined<ChessboardOptions['boardStyle']>;
  squareStyle: Defined<ChessboardOptions['squareStyle']>;
  squareStyles: Defined<ChessboardOptions['squareStyles']>;
  darkSquareStyle: Defined<ChessboardOptions['darkSquareStyle']>;
  lightSquareStyle: Defined<ChessboardOptions['lightSquareStyle']>;
  darkSquareNotationStyle: Defined<
    ChessboardOptions['darkSquareNotationStyle']
  >;
  lightSquareNotationStyle: Defined<
    ChessboardOptions['lightSquareNotationStyle']
  >;
  alphaNotationStyle: Defined<ChessboardOptions['alphaNotationStyle']>;
  numericNotationStyle: Defined<ChessboardOptions['numericNotationStyle']>;
  showNotation: Defined<ChessboardOptions['showNotation']>;

  animationDurationInMs: Defined<ChessboardOptions['animationDurationInMs']>;
  showAnimations: Defined<ChessboardOptions['showAnimations']>;

  arrows: Defined<ChessboardOptions['arrows']>;
  arrowOptions: Defined<ChessboardOptions['arrowOptions']>;

  squareRenderer: ChessboardOptions['squareRenderer'];

  // internal state
  board: SquareDataType[][];
  isWrapped: boolean;
  currentPosition: PositionDataType;
  positionDifferences: ReturnType<typeof getPositionUpdates>;
};

const ChessboardContext = createContext<ContextType | null>(null);

export const useChessboardContext = () => use(ChessboardContext) as ContextType;

export type ChessboardOptions = {
  // id
  id?: string;

  // pieces and position
  pieces?: PieceRenderObject;
  position?: string | PositionDataType; // FEN string (or object position) to set up the board

  // board dimensions and orientation
  boardOrientation?: 'white' | 'black';
  chessboardRows?: number;
  chessboardColumns?: number;

  // board and squares styles
  boardStyle?: React.CSSProperties;
  squareStyle?: React.CSSProperties;
  squareStyles?: Record<string, React.CSSProperties>;
  darkSquareStyle?: React.CSSProperties;
  lightSquareStyle?: React.CSSProperties;

  // notation
  darkSquareNotationStyle?: React.CSSProperties;
  lightSquareNotationStyle?: React.CSSProperties;
  alphaNotationStyle?: React.CSSProperties;
  numericNotationStyle?: React.CSSProperties;
  showNotation?: boolean;

  // animation
  animationDurationInMs?: number;
  showAnimations?: boolean;

  // arrows
  arrows?: Arrow[];
  arrowOptions?: typeof defaultArrowOptions;

  // handlers
  squareRenderer?: ({
    piece,
    square,
    children,
  }: SquareHandlerArgs & { children?: React.ReactNode }) => React.JSX.Element;
};

export function ChessboardProvider({
  children,
  options,
}: React.PropsWithChildren<{ options?: ChessboardOptions }>) {
  const {
    // id
    id = 'chessboard',

    // pieces and position
    pieces = defaultPieces,
    position = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR',

    // board dimensions and orientation
    boardOrientation = 'white',
    chessboardRows = 8,
    chessboardColumns = 8,

    // board and squares styles
    boardStyle = defaultBoardStyle(chessboardColumns),
    squareStyle = defaultSquareStyle,
    squareStyles = {},
    darkSquareStyle = defaultDarkSquareStyle,
    lightSquareStyle = defaultLightSquareStyle,

    // notation
    darkSquareNotationStyle = defaultDarkSquareNotationStyle,
    lightSquareNotationStyle = defaultLightSquareNotationStyle,
    alphaNotationStyle = defaultAlphaNotationStyle,
    numericNotationStyle = defaultNumericNotationStyle,
    showNotation = true,

    // animation
    animationDurationInMs = 300,
    showAnimations = true,

    // arrows
    arrows = [],
    arrowOptions = defaultArrowOptions,

    // handlers
    squareRenderer,
  } = options || {};

  // the current position of pieces on the chessboard
  const [currentPosition, setCurrentPosition] = useState(
    typeof position === 'string'
      ? fenStringToPositionObject(position, chessboardRows, chessboardColumns)
      : position,
  );

  // calculated differences between current and incoming positions
  const [positionDifferences, setPositionDifferences] = useState<
    ReturnType<typeof getPositionUpdates>
  >({});

  // position we are animating to, if a new position comes in before the animation completes, we will use this to set the new position
  const [waitingForAnimationPosition, setWaitingForAnimationPosition] =
    useState<PositionDataType | null>(null);

  // the animation timeout whilst waiting for animation to complete
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // if the position changes, we need to recreate the pieces array
  useEffect(() => {
    const newPosition =
      typeof position === 'string'
        ? fenStringToPositionObject(position, chessboardRows, chessboardColumns)
        : position;

    // if no animation, just set the position
    if (!showAnimations) {
      setCurrentPosition(newPosition);
      return;
    }

    // save copy of the waiting for animation position so we can use it later but clear it from state so we don't use it in the next animation
    const currentWaitingForAnimationPosition = waitingForAnimationPosition;

    // if we are waiting for an animation to complete from a previous move, set the saved position to immediately end the animation
    if (currentWaitingForAnimationPosition) {
      setCurrentPosition(currentWaitingForAnimationPosition);
      setWaitingForAnimationPosition(null);
    }

    // get list of position updates as pieces to potentially animate
    const positionUpdates = getPositionUpdates(
      currentWaitingForAnimationPosition ?? currentPosition, // use the saved position if it exists, otherwise use the current position
      newPosition,
      chessboardColumns,
      boardOrientation,
    );

    setPositionDifferences(positionUpdates);
    setWaitingForAnimationPosition(newPosition);

    // start animation timeout
    const newTimeout = setTimeout(() => {
      setCurrentPosition(newPosition);
      setPositionDifferences({});
      setWaitingForAnimationPosition(null);
    }, animationDurationInMs);

    // update the ref to the new timeout
    animationTimeoutRef.current = newTimeout;

    // clear timeout on unmount
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [position]);

  // if the dimensions change, we need to recreate the pieces array
  useEffect(() => {
    setCurrentPosition(
      typeof position === 'string'
        ? fenStringToPositionObject(position, chessboardRows, chessboardColumns)
        : position,
    );
  }, [chessboardRows, chessboardColumns, boardOrientation]);

  // only redraw the board when the dimensions or board orientation change
  const board = useMemo(
    () => generateBoard(chessboardRows, chessboardColumns, boardOrientation),
    [chessboardRows, chessboardColumns, boardOrientation],
  );

  return (
    <ChessboardContext.Provider
      value={{
        // chessboard options
        id,

        pieces,

        boardOrientation,
        chessboardRows,
        chessboardColumns,

        boardStyle,
        squareStyle,
        squareStyles,
        darkSquareStyle,
        lightSquareStyle,

        darkSquareNotationStyle,
        lightSquareNotationStyle,
        alphaNotationStyle,
        numericNotationStyle,
        showNotation,

        animationDurationInMs,
        showAnimations,

        arrows,
        arrowOptions,

        squareRenderer,

        // internal state
        board,
        isWrapped: true,
        currentPosition,
        positionDifferences,
      }}
    >
      {children}
    </ChessboardContext.Provider>
  );
}
