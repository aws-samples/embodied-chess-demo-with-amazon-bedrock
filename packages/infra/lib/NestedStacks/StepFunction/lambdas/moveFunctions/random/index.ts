import { Chess } from "chess.js";

export const handler = async (event) => {
  console.log(event);
  const { SessionID, LatestMove, Session } = event;
  const { Item } = LatestMove;

  const SanList = Item.SanList?.S ? Item.SanList.S : "";

  const game = new Chess(Item.Move.S);
  const possibleMoves = game.moves();

  const randomIdx = Math.floor(Math.random() * possibleMoves.length);
  game.move(possibleMoves[randomIdx]);

  const NextSanList = `${SanList}${parseInt(Item.MoveCount.N) + 1}. ${
    possibleMoves[randomIdx]
  } `;

  return {
    SessionID,
    Action: "MOVE",
    PlayerOutput: { Move: game.fen(), SanList: NextSanList },
    LatestMove,
    Session,
  };
};
