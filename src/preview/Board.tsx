import { Arrows } from './Arrows';
import { Piece } from './Piece';
import { Square } from './Square';
import { useChessboardContext } from './ChessboardProvider';
import { defaultBoardStyle } from '../defaults';

export function Board() {
  const { board, boardStyle, chessboardColumns, currentPosition, id } =
    useChessboardContext();

  return (
    <>
      <div
        id={`${id}-board`}
        style={{ ...defaultBoardStyle(chessboardColumns), ...boardStyle }}
      >
        {board.map((row) =>
          row.map((square) => {
            const piece = currentPosition[square.squareId];

            return (
              <Square key={square.squareId} {...square}>
                {piece ? <Piece {...piece} position={square.squareId} /> : null}
              </Square>
            );
          }),
        )}

        <Arrows />
      </div>
    </>
  );
}
