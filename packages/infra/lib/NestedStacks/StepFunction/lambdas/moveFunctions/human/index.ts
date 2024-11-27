import { Ic } from "isepic-chess";

export const handler = async (event, context) => {
  console.log(event);
  const { LatestMove, Move } = event;
  const { Item } = LatestMove;

  const isepic = Ic.initBoard({ fen: Item.Move.S });
  const isepicMove = isepic.playMove(Move);

  const SanList = Item.SanList?.S ? Item.SanList.S : "";

  const NextSanList = `${SanList}${parseInt(Item.MoveCount.N) + 1}. ${
    isepicMove.san
  } `;

  return { Move, SanList: NextSanList };
};
