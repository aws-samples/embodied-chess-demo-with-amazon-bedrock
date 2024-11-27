from aws_lambda_powertools import Logger
from pydash import find
import boto3

bedrock_runtime = boto3.client("bedrock-runtime")

logger = Logger()


def amazon(board, model_id, tries, message_attempts):
    match tries:
        case 0:
            messages = [
                {
                    "role": "user",
                    "content": [
                        {
                            "text": f"""
Given the FEN position '{board.fen()}', provide the best move in Standard Algebraic Notation (SAN) and explain why it's the best move. Format your response exactly like this:

MOVE: [SAN notation]
JUSTIFICATION: [Your explanation]

Here's a few examples:

MOVE: e4
JUSTIFICATION: This is a sample explanation for the move e4.

MOVE: Nf3
JUSTIFICATION: This is a sample explanation for the move e4.

Keep the justification clear and concise in 1-2 sentences.""",
                        },
                    ],
                },
            ]
        case 1:
            messages = message_attempts
            messages.append(
                {
                    "role": "user",
                    "content": [
                        {
                            "text": f"""
I'm sorry but the move you suggest was not correct.
Provide me another Standard Algebraic Notation (SAN) move that is legal and explain why it's the best move. Format your response exactly like this:

MOVE: [SAN notation]
JUSTIFICATION: [Your explanation]

Keep the justification clear and concise in 1-2 sentences.""",
                        },
                    ],
                }
            )
        case 2:
            messages = message_attempts

            legal_moves = list(board.legal_moves)
            san_moves = []

            for move in legal_moves:
                san_move = board.san(move)
                san_moves.append(san_move)

            messages.append(
                {
                    "role": "user",
                    "content": [
                        {
                            "text": f"""
Select a Standard Algebraic Notation (SAN) only from this list {san_moves} and explain why it's the best move. Format your response exactly like this:

MOVE: [SAN notation]
JUSTIFICATION: [Your explanation]

Keep the justification clear and concise in 1-2 sentences.""",
                        },
                    ],
                }
            )
        case _:
            raise Exception("Max tries reached")

    logger.info({"Input": messages})
    response = bedrock_runtime.converse(modelId=model_id, messages=messages)
    logger.info({"Output": response})
    messages.append(response["output"]["message"])

    # Parse the response text to extract move and justification
    response_text = response["output"]["message"]["content"][0]["text"]

    try:
        lines = [line.strip() for line in response_text.split("\n") if line.strip()]

        move_line = find(lines, lambda x: "MOVE:" in x)
        justification_line = find(lines, lambda x: "JUSTIFICATION:" in x)

        next_move = move_line.split("MOVE:")[1].strip()
        justification = justification_line.split("JUSTIFICATION:")[1].strip()

        return (next_move, justification, messages)
    except Exception as parse_error:
        logger.error(f"Error parsing response: {parse_error}")
        return ("ERROR", "ERROR", messages)
