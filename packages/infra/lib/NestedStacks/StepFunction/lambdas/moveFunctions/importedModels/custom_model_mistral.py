import random
import json
import time
import boto3
from botocore.exceptions import ClientError
from aws_lambda_powertools import Logger

logger = Logger()

bedrock_runtime = boto3.client("bedrock-runtime")


def custom_model_mistral(board, model_id, tries, message_attempts, san_list):
    current_fen = board.fen()
    color_indicator = current_fen.split()[1]
    print(f"FEN inside custom model {current_fen}")
    nxt_color = "WHITE" if color_indicator == "w" else "BLACK"

    prompt = (
        "<s>[INST] Find the best next move in this chess position. Provide the move in standard algebraic notation (SAN).\n"
        f"Position (FEN): {current_fen}\n"
        f"Color to play: {nxt_color}\n"
        f"Move History: {san_list} \n[/INST]"
    )

    print(f"Prompt sent:{prompt}")
    request_body = {
        "prompt": prompt,
        "max_tokens": 1000,
        "temperature": 0.1,
        "top_p": 0.9,
    }

    print(f"Request Body:{request_body}")
    print(f"Request in JSON{json.dumps(request_body)}")

    max_retries = 5
    base_delay = 1
    attempt = 0

    while attempt < max_retries:
        try:
            response = bedrock_runtime.invoke_model(
                modelId=model_id, body=json.dumps(request_body)
            )
            print(f"RAW CMI RESPONSE{response}")

            response_body = json.loads(response["body"].read().decode())
            print(f"Response Received: {response_body}")

            generated_text = response_body["outputs"][0]["text"].strip()
            print(f"Generated Text: {generated_text}")

            next_move = generated_text
            justification = ""

            print(f"Next Move {next_move}")
            print(f"Justification {justification}")
            return (next_move, justification)

        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            if error_code in [
                "ModelNotReadyException",
                "ThrottlingException",
                "RequestLimitExceeded",
            ]:
                print(f"Error: {error_code} for Try {attempt}")
                if attempt == max_retries - 1:
                    logger.error(f"Max retries reached for : {error_code}")
                    raise
                if error_code == "ModelNotReadyException":
                    delay = 10  # Fixed 10 second delay for ModelNotReadyException
                else:
                    delay = base_delay * 2**attempt + random.uniform(0, 1)
                print(
                    f"{error_code} encountered, retrying in {delay:.2f} seconds... (Attempt {attempt + 1}/{max_retries})"
                )
                time.sleep(delay)
                attempt += 1
            else:
                logger.error(f"AWS Client Error: {str(e)}")
                raise
        except (KeyError, json.JSONDecodeError) as e:
            print(f"Error processing response: {str(e)}")
            raise
        except Exception as e:
            print(f"Unexpected error in custom_model_mistral: {str(e)}")
            raise

    raise Exception("Maximum retries exceeded")
