import chess
import boto3

from aws_lambda_powertools.utilities.typing import LambdaContext
from aws_lambda_powertools import Logger, Tracer

from models.ai21 import ai21
from models.amazon import amazon
from models.anthropic import anthropic
from models.cohere import cohere
from models.meta import meta
from models.mistral import mistral

from utils import send_to_appsync
from stockfish import Stockfish

bedrock_runtime = boto3.client("bedrock-runtime")

logger = Logger()
tracer = Tracer()


@logger.inject_lambda_context(log_event=True)
@tracer.capture_lambda_handler
def handler(event: dict, context: LambdaContext) -> str:
    latest_move = event["LatestMove"]["Item"]
    current_fen = latest_move["Move"]["S"]
    current_board = chess.Board(current_fen)
    print(current_board)

    # Parse input SanList
    san_list = latest_move["SanList"]["S"] if "SanList" in latest_move else None

    # ***************************************************************** #
    # ***************************** Turn ****************************** #
    # ***************************************************************** #

    # True means it's white's turn false if Black
    turn = current_board.turn
    logger.info({"Turn": "White" if turn else "Black"})
    model_id = (
        event["Session"]["Item"]["WhiteID"]["S"]
        if turn
        else event["Session"]["Item"]["BlackID"]["S"]
    )
    logger.info({"Generating move with model": model_id})

    # ***************************************************************** #
    # ************************* Predict Move ************************** #
    # ***************************************************************** #

    next_move, justification, message_attempts = predict_next_move(
        model_id, san_list, current_board
    )

    send_to_appsync(
        event["SessionID"], justification, f'{model_id}#{"w" if turn else "b"}'
    )

    next_move_num = int(event["LatestMove"]["Item"]["MoveCount"]["N"]) + 1
    next_san_list = f"{san_list if san_list else ''}{str(next_move_num)}. {next_move} "

    return {
        "SanList": next_san_list,
        "Move": current_board.fen(),
        "Messages": message_attempts,
    }


def predict_next_move(model_id, san_list, board):
    message_attempts = []
    original_board = board
    current_fen = original_board.fen()
    color_indicator = current_fen.split()[1]

    # Convert 'w' or 'b' to full word
    next_move_color = "WHITE" if color_indicator == "w" else "BLACK"

    for tries in range(3):
        match model_id.split(".")[0]:
            case "ai21":
                next_move, justification, message_attempts = ai21(
                    board, model_id, tries, message_attempts
                )
            case "amazon":
                next_move, justification, message_attempts = amazon(
                    board, model_id, tries, message_attempts
                )
            case "anthropic":
                print("Anthropic model")
                next_move, justification, message_attempts = anthropic(
                    board, model_id, tries, message_attempts
                )
            case "cohere":
                next_move, justification, message_attempts = cohere(
                    board, model_id, tries, message_attempts
                )
            case "meta":
                next_move, justification, message_attempts = meta(
                    board, model_id, tries, message_attempts
                )
            case "mistral":
                next_move, justification, message_attempts = mistral(
                    board, model_id, tries, message_attempts
                )
            case _:
                raise Exception(f"model_id not supported {model_id}")

        try:
            print(f"Validating move: {next_move}")
            board.push_san(next_move)
            logger.info(
                {"Tries": tries + 1, "Move": next_move, "Justification": justification}
            )
            return (next_move, justification, message_attempts)
        except Exception as e:
            logger.info({"Error": e})

    # If number of tries is > 3 - then generate a random move
    print("Looks like I need a little help... lets use stockfish")

    stockfish = Stockfish("/opt/bin/stockfish")
    stockfish.set_fen_position(board.fen())
    best_move = stockfish.get_best_move()
    stockfish_move = board.san(chess.Move.from_uci(best_move))

    logger.info({"Stockfish": stockfish_move})
    board.push_san(stockfish_move)

    messages = [
        {
            "role": "user",
            "content": [
                {
                    "text": f"""
Why is {stockfish_move} a strong move for {next_move_color} in this position: {original_board.fen()}?
Keep the justification clear and concise in 1-2 sentences.""",
                },
            ],
        },
    ]

    response = bedrock_runtime.converse(
        modelId=model_id,
        messages=messages,
    )
    response_text = response["output"]["message"]["content"][0]["text"]

    justification = "Helper(Base) - " + response_text

    return (stockfish_move, justification, message_attempts)
