from aws_lambda_powertools.utilities.typing import LambdaContext
from aws_lambda_powertools import Logger, Tracer

from stockfish import Stockfish

logger = Logger()
tracer = Tracer()


@logger.inject_lambda_context(log_event=True)
@tracer.capture_lambda_handler
def handler(event: dict, context: LambdaContext) -> str:
    session_id = event.get("SessionID")
    latest_move = event.get("LatestMove")
    session = event.get("Session")

    item = latest_move.get("Item", {})
    san_list = item.get("SanList", {}).get("S", "") if item.get("SanList") else ""

    # Get the Current Move
    current_move = item.get("Move", {}).get("S", "")
    color = current_move.split(" ")[1]
    model_id = (
        session.get("Item", {}).get("WhiteID", {}).get("S")
        if color == "w"
        else session.get("Item", {}).get("BlackID", {}).get("S")
    )

    # Create a chess board from the current position
    stockfish = Stockfish(
        path="/opt/bin/stockfish",
        parameters={"UCI_Elo": model_id},
    )
    stockfish.set_fen_position(current_move)

    new_move = stockfish.get_best_move()
    stockfish.make_moves_from_current_position([new_move])

    next_san_list = f"{san_list}{int(item['MoveCount']['N']) + 1}. {new_move} "

    return {
        "SessionID": session_id,
        "Action": "MOVE",
        "LatestMove": latest_move,
        "Session": session,
        "PlayerOutput": {
            "Move": stockfish.get_fen_position(),
            "SanList": next_san_list,
        },
    }
