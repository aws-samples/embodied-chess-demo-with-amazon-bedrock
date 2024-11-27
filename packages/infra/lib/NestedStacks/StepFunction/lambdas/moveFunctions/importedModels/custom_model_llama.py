import re
import json
import boto3
import time
import random
from botocore.exceptions import ClientError

from aws_lambda_powertools import Logger

logger = Logger()

bedrock_runtime = boto3.client("bedrock-runtime")


def invoke_bedrock_model(model_id, request_body):
    max_retries = 5
    base_delay = 1
    attempts = 0

    while attempts < max_retries:
        try:
            return bedrock_runtime.invoke_model(
                modelId=model_id, body=json.dumps(request_body)
            )
        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            if error_code in [
                "ModelNotReadyException",
                "ThrottlingException",
                "RequestLimitExceeded",
            ]:
                print(f"Error: {error_code} for Try {attempts}")
                if attempts == max_retries - 1:
                    logger.error(f"Max retries reached for : {error_code}")
                    raise
                if error_code == "ModelNotReadyException":
                    delay = 10  # Fixed 10 second delay for ModelNotReadyException
                else:
                    delay = (base_delay * 2**attempts) + random.uniform(0, 1)
                print(
                    f"{error_code} encountered, retrying in {delay:.2f} seconds... (Attempt {attempts + 1}/{max_retries})"
                )
                time.sleep(delay)
                attempts += 1
            else:
                logger.error(f"AWS Client Error: {str(e)}")
                raise
        except Exception as e:
            logger.error(f"Unexpected error in invoke_bedrock_model: {str(e)}")
            raise


def custom_model_llama(board, model_id, tries, move_attempts):
    try:
        current_fen = board.fen()
        color_indicator = current_fen.split()[1]
        print(f"FEN inside custom model {current_fen}")

        try:
            nxt_color = "WHITE" if color_indicator == "w" else "BLACK"
        except IndexError as e:
            logger.error(f"Invalid FEN string format: {str(e)}")
            raise ValueError("Invalid FEN string format") from e

        if tries == 0:
            print(f"Try: {tries}")
            prompt = (
                "You are a chess player who's goal is to win the game, given a chess position in FEN notation and the color to move, "
                "provide the next best valid move in SAN (Standard Algebraic Notation) format to progress towards winning the game of chess. "
                "Your response must be a single move wrapped in <move></move> tags.\n\n"
                f"Chess Position (FEN): {current_fen}\n"
                f"Color to Move: {nxt_color}"
            )
        else:
            print(f"Try: {tries}")
            try:
                illegal_moves = ", ".join(move_attempts) if move_attempts else "none"
            except TypeError as e:
                logger.error(f"Invalid move_attempts format: {str(e)}")
                illegal_moves = "none"

            prompt = (
                "You are a chess player who's goal is to win the game. Your previous move attempts were invalid. "
                "Given a chess position in FEN notation and the color to move, provide a different valid move in SAN format. "
                "Your response must be a single move wrapped in <move></move> tags.\n\n"
                f"Chess Position (FEN): {current_fen}\n"
                f"Color to Move: {nxt_color}\n"
                f"Previous invalid moves: {illegal_moves}\n"
                "Please provide a different valid move."
            )

        print(f"Prompt sent:{prompt}")
        request_body = {
            "prompt": prompt,
            "max_tokens": 500,
            "temperature": 0.5,
            "top_p": 0.9,
        }

        print(f"Request Body:{request_body}")
        print(f"Request in JSON{json.dumps(request_body)}")

        try:
            response = invoke_bedrock_model(model_id, request_body)
        except Exception as e:
            logger.error(f"Error invoking Bedrock model: {str(e)}")
            raise

        try:
            print(f"RAW CMI RESPONSE{response}")
            response_body = json.loads(response["body"].read().decode())
            print(f"Response Received: {response_body}")
            generated_text = response_body["generation"]
            print(f"Generated Text: {generated_text}")
        except (KeyError, json.JSONDecodeError, AttributeError) as e:
            logger.error(f"Error processing model response: {str(e)}")
            raise ValueError("Invalid response format from model") from e

        response_section = generated_text.split("### Response:")[-1]

        try:
            move_match = re.search(r"<move>(.*?)</move>", response_section)
            reason_match = re.search(r"<reason>(.*?)</reason>", response_section)

            next_move = move_match.group(1) if move_match else ""
            justification = reason_match.group(1) if reason_match else ""
        except (AttributeError, IndexError) as e:
            logger.error(f"Error extracting move and reason: {str(e)}")
            return ("", "")

        print(f"Next Move {next_move}")
        print(f"Justification {justification}")
        return (next_move, justification)

    except Exception as e:
        logger.error(f"Unexpected error in custom_model_llama: {str(e)}")
        raise
