import { memo } from 'react';

import { useChessboardContext } from './ChessboardProvider';
import {
  defaultAlphaNotationStyle,
  defaultDarkSquareNotationStyle,
  defaultDarkSquareStyle,
  defaultLightSquareNotationStyle,
  defaultLightSquareStyle,
  defaultNumericNotationStyle,
  defaultSquareStyle,
} from '../defaults';
import { SquareDataType } from '../types';
import { columnIndexToChessColumn } from '../utils';

type SquareProps = {
  children?: React.ReactNode;
  squareId: SquareDataType['squareId'];
  isLightSquare: SquareDataType['isLightSquare'];
};

export const Square = memo(function Square({
  children,
  squareId,
  isLightSquare,
}: SquareProps) {
  const {
    id,
    boardOrientation,
    chessboardColumns,
    chessboardRows,
    currentPosition,
    squareStyle,
    squareStyles,
    darkSquareStyle,
    lightSquareStyle,
    darkSquareNotationStyle,
    lightSquareNotationStyle,
    alphaNotationStyle,
    numericNotationStyle,
    showNotation,
    squareRenderer,
  } = useChessboardContext();

  const column = squareId.match(/^[a-z]+/)?.[0];
  const row = squareId.match(/\d+$/)?.[0];

  return (
    <div
      id={`${id}-square-${squareId}`}
      style={{
        ...defaultSquareStyle,
        ...squareStyle,
        ...(isLightSquare
          ? { ...defaultLightSquareStyle, ...lightSquareStyle }
          : { ...defaultDarkSquareStyle, ...darkSquareStyle }),
      }}
      data-column={column}
      data-row={row}
      data-square={squareId}
    >
      {showNotation ? (
        <span
          style={
            isLightSquare
              ? {
                  ...defaultLightSquareNotationStyle,
                  ...lightSquareNotationStyle,
                }
              : {
                  ...defaultDarkSquareNotationStyle,
                  ...darkSquareNotationStyle,
                }
          }
        >
          {row ===
            (boardOrientation === 'white'
              ? '1'
              : chessboardRows.toString()) && (
            <span
              style={{ ...defaultAlphaNotationStyle, ...alphaNotationStyle }}
            >
              {column}
            </span>
          )}
          {column ===
            (boardOrientation === 'white'
              ? 'a'
              : columnIndexToChessColumn(
                  0,
                  chessboardColumns,
                  boardOrientation,
                )) && (
            <span
              style={{
                ...defaultNumericNotationStyle,
                ...numericNotationStyle,
              }}
            >
              {row}
            </span>
          )}
        </span>
      ) : null}

      {squareRenderer?.({
        piece: currentPosition[squareId] ?? null,
        square: squareId,
        children,
      }) || (
        <div
          style={{
            width: '100%',
            height: '100%',
            ...squareStyles[squareId],
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
});
