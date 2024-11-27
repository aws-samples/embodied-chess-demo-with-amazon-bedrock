import chess from "js-chess-engine";
import { Chess } from "chess.js";

export const handler = async (event) => {
  const { SessionID, LatestMove, Session } = event;
  const { Item } = LatestMove;
  const SanList = Item.SanList?.S ? Item.SanList.S : "";

  // Get the Current Move
  const modelId =
    LatestMove.Item.Move.S.split(" ")[1] === "w"
      ? Session.Item.WhiteID.S
      : Session.Item.BlackID.S;

  const newMove = chess.aiMove(LatestMove.Item.Move.S, modelId.split("-")[1]);

  const from = Object.keys(newMove)[0];
  const to = Object.values(newMove)[0];

  const newFen = chess.move(LatestMove.Item.Move.S, from, to);

  const chessjs = new Chess(LatestMove.Item.Move.S);
  const { san } = chessjs.move({
    from: from.toLowerCase(),
    to: to.toLowerCase(),
  });

  const NextSanList = `${SanList}${parseInt(Item.MoveCount.N) + 1}. ${san} `;

  return {
    SessionID,
    Action: "MOVE",
    LatestMove,
    Session,
    PlayerOutput: { Move: newFen, SanList: NextSanList },
  };
};
