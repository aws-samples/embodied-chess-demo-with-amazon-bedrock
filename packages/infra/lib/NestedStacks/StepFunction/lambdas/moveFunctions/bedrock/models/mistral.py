from aws_lambda_powertools import Logger
from pydash import find
import boto3

bedrock_runtime = boto3.client("bedrock-runtime")

logger = Logger()


def mistral(board, model_id, tries, message_attempts):

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

    try:
        response = bedrock_runtime.converse(
            modelId=model_id,
            messages=messages,
            toolConfig={
                "tools": [
                    {
                        "toolSpec": {
                            "name": "chess_move",
                            "description": "Prints the next best move to make in SAN notation and justification as to why this is the best move.",
                            "inputSchema": {
                                "json": {
                                    "type": "object",
                                    "properties": {
                                        "next_move": {
                                            "type": "string",
                                            "description": "The next best move to make providing only the SAN notation.",
                                        },
                                        "justification": {
                                            "type": "string",
                                            "description": "A short justification as to why this is the best move.",
                                        },
                                    },
                                    "required": ["next_move", "justification"],
                                }
                            },
                        }
                    }
                ],
                "toolChoice": {"tool": {"name": "chess_move"}},
            },
        )

        logger.info({"Output": response})
        params = response["output"]["message"]["content"][0]["toolUse"]["input"]

        messages.append(
            {
                "role": "assistant",
                "content": [
                    {
                        "text": f"MOVE: {params['next_move']}\nJUSTIFICATION: {params['justification']}"
                    }
                ],
            }
        )

        return (params["next_move"], params["justification"], messages)
    except bedrock_runtime.exceptions.ValidationException as e:
        if "This model doesn't support tool use" in str(e):
            logger.info("Model doesn't support tools, retrying without tools")

            # Retry without tools
            response = bedrock_runtime.converse(
                modelId=model_id,
                messages=messages,
            )
            logger.info({"Output": response})
            messages.append(response["output"]["message"])

            # Parse the response text to extract move and justification
            response_text = response["output"]["message"]["content"][0]["text"]

            try:
                lines = [
                    line.strip() for line in response_text.split("\n") if line.strip()
                ]

                move_line = find(lines, lambda x: "MOVE:" in x)
                justification_line = find(lines, lambda x: "JUSTIFICATION:" in x)

                next_move = move_line.split("MOVE:")[1].strip()
                justification = justification_line.split("JUSTIFICATION:")[1].strip()

                return (next_move, justification, messages)
            except Exception as parse_error:
                logger.error(f"Error parsing response: {parse_error}")
                return ("ERROR", "ERROR", messages)
        else:
            raise
