from awsiot.greengrasscoreipc.model import PublishMessage, BinaryMessage
from awsiot.greengrasscoreipc.clientv2 import GreengrassCoreIPCClientV2
from src.logging_formatter import ColoredFormatter
from logging.handlers import RotatingFileHandler
import awsiot.greengrasscoreipc.model as model
from threading import Thread
from retry import retry
import threading
import traceback
import logging
import queue
import time
import json

from awsiot.greengrasscoreipc.model import (
    ResourceNotFoundError,
    InvalidArgumentsError,
    ServiceError,
    UnauthorizedError,
    ConflictError,
)

# Configuration Keys from recipe
LOG_FILE_PATH_CONFIG = "logFilePath"
LOG_LEVEL_CONFIG = "logLevel"
CORE_MAIN_NAMED_SHADOW_CONFIG = "coreDeviceMainNamedShadow"
GAME_REQUESTS_TOPIC_CONFIG = "gameRequestsTopic"
GAME_RESPONSES_TOPIC_CONFIG = "gameResponsesTopic"
BOARD_VALIDATIONS_TOPIC_CONFIG = "boardValidationsTopic"
BOARD_VALIDATIONS_RESPONSE_TOPIC_CONFIG = "boardValidationsResponseTopic"
BOARD_START_TOPIC_CONFIG = "boardStartTopic"
BOARD_START_RESPONSE_TOPIC_CONFIG = "boardStartResponseTopic"
BOARD_PROCESSED_TOPIC_CONFIG = "boardProcessedTopic"
ROBOT_CONTROL_MOVE_TOPIC_CONFIG = "robotControlMoveTopic"
ROBOT_CONTROL_MOVE_RESPONSE_TOPIC_CONFIG = "robotControlMoveResponseTopic"
ROBOT_ENABLED_CONFIG = "robotEnabled"


# Valid game request actions
GAME_REQUEST_ACTIONS = {"MOVE": "move", "START": "start"}

# Set IPC Client
IPC_CLIENT = GreengrassCoreIPCClientV2()

# Setup custom logging
try:
    log_file_path = IPC_CLIENT.get_configuration(key_path=[LOG_FILE_PATH_CONFIG]).value[
        LOG_FILE_PATH_CONFIG
    ]
    log_level = (
        IPC_CLIENT.get_configuration(key_path=[LOG_LEVEL_CONFIG]).value[
            LOG_LEVEL_CONFIG
        ]
    ).upper()
    logger = logging.Logger(__name__)
    _handler = RotatingFileHandler(log_file_path, maxBytes=10000000, backupCount=5)
    _handler.setFormatter(ColoredFormatter())
    _handler.setLevel(log_level)
    logger.addHandler(_handler)
except Exception:
    print("Exception occurred when setting up custom logging")
    traceback.print_exc()
    exit(1)

# Busy Event and Request Queue
BUSY_EVENT = threading.Event()
GAME_REQUESTS_QUEUE = queue.Queue(1)

# Game/Moves state global variables
CURRENT_GAME_ID = None
LAST_GAME_ID = None
GAME_ENDED = True
GAME_IN_PROGRESS = False
CURR_TASK_TOKEN = None
CURR_GAME_REQUEST = None

# Board moves global variables
BOARD_VALIDATION_EVENT = threading.Event()
BOARD_PROCESSED_EVENT = threading.Event()
BOARD_START_EVENT = threading.Event()
LAST_TASK_TOKEN = None
BOARD_VALIDATED_OK = False
BOARD_VALIDATED_REASON = None
BOARD_PROCESSED_OK = False
BOARD_PROCESSED_REASON = None
BOARD_STARTED_OK = False
BOARD_STARTED_REASON = None
BOARD_STATUS_VALUES = {"OK": 200, "ERROR": 500}
LAST_VALIDATED_MOVE = None

# Robot control global variables
ROBOT_ENABLED = IPC_CLIENT.get_configuration(key_path=[ROBOT_ENABLED_CONFIG]).value[
    ROBOT_ENABLED_CONFIG
]
ROBOT_CONTROL_MOVE_RESPONSE_EVENT = threading.Event()
ROBOT_CONTROL_MOVE_RESPONSE_OK = False
ROBOT_CONTROL_MOVE_RESPONSE_REASON = None
ROBOT_CONTROL_MOVE_RESPONSE_STATUS_VALUES = {"OK": 200, "ERROR": 500}

# Common Error Messages
INVALID_ARGUMENTS_ERR_MSG = "InvalidArgumentsError - The local shadow service is unable to validate the request parameters. This can occur if the request contains malformed JSON or unsupported characters."
SERVICE_ERR_MSG = "ServiceError - An internal service error occurred, or the number of requests to the IPC service exceeded the limits specified in the maxLocalRequestsPerSecondPerThing and maxTotalLocalRequestsRate configuration parameters in the shadow manager component."
UNAUTHORIZED_ERR_MSG = "UnauthorizedError - The request was not authorized. This can occur if the request contains invalid credentials or a token that has expired."


# Custom Exceptions and Exception Messages
class SmartBoardException(Exception):
    pass


class RoboticArmException(Exception):
    pass


class CoreDeviceException(Exception):
    pass


class GameException(Exception):
    pass


class PublishMessageException(Exception):
    pass


def subscribe_to_robot_move_responses():
    robot_control_move_response_topic = IPC_CLIENT.get_configuration(
        key_path=[ROBOT_CONTROL_MOVE_RESPONSE_TOPIC_CONFIG]
    ).value[ROBOT_CONTROL_MOVE_RESPONSE_TOPIC_CONFIG]
    logger.info(f"Subscribing to topic {robot_control_move_response_topic}")
    IPC_CLIENT.subscribe_to_topic(
        topic=robot_control_move_response_topic,
        on_stream_event=on_robot_move_response,
    )
    logger.info(
        f"Successfully subscribed using aws.greengrass.ipc.pubsub to topic {robot_control_move_response_topic}"
    )


def on_robot_move_response(event):
    logger.critical("Received Robot Move Processed event")
    logger.debug(f"IPC PubSub - Event: {event}")
    global ROBOT_CONTROL_MOVE_RESPONSE_OK, ROBOT_CONTROL_MOVE_RESPONSE_REASON, ROBOT_CONTROL_MOVE_RESPONSE_EVENT
    try:
        if not ROBOT_CONTROL_MOVE_RESPONSE_EVENT.is_set():
            logger.warning("Setting Robot Control Move Response event.")
            ROBOT_CONTROL_MOVE_RESPONSE_EVENT.set()
        else:
            # Check message payload
            got_message = False
            try:
                topic = str(event.binary_message.context.topic)
                message = json.loads(str(event.binary_message.message, "utf-8"))
                got_message = True if message else False
            except Exception:
                logger.exception(f"Invalid Event: {event}")
                ROBOT_CONTROL_MOVE_RESPONSE_OK = False
                ROBOT_CONTROL_MOVE_RESPONSE_REASON = f"Invalid Event - {event}"
                ROBOT_CONTROL_MOVE_RESPONSE_EVENT.clear()
                return

            # Process robot control move response message
            if got_message:
                logger.info(f"Verifying robot control move response message: {message}")
                if "status" in message:
                    if (
                        message["status"]
                        == ROBOT_CONTROL_MOVE_RESPONSE_STATUS_VALUES["OK"]
                    ):
                        logger.info(f"Last validated move: {LAST_VALIDATED_MOVE}")
                        logger.info(f"Current validated move: {message['lan']}")
                        if LAST_VALIDATED_MOVE == message["lan"]:
                            ROBOT_CONTROL_MOVE_RESPONSE_OK = True
                            ROBOT_CONTROL_MOVE_RESPONSE_EVENT.clear()
                            logger.critical(
                                "Robot Control Move Response verification success"
                            )
                        else:
                            raise RoboticArmException(
                                f"Last validated move: {LAST_VALIDATED_MOVE} different than Current processed move: {message['lan']}"
                            )
                    elif (
                        message["status"]
                        == ROBOT_CONTROL_MOVE_RESPONSE_STATUS_VALUES["ERROR"]
                    ):
                        ROBOT_CONTROL_MOVE_RESPONSE_REASON = f"An error occurred when robot tried to execute a move  {'- ' + message['reason'] if 'reason' in message else None}"
                        raise RoboticArmException(ROBOT_CONTROL_MOVE_RESPONSE_REASON)
                    else:
                        ROBOT_CONTROL_MOVE_RESPONSE_REASON = "Invalid robot control move response message - Status invalid."
                        raise RoboticArmException(ROBOT_CONTROL_MOVE_RESPONSE_REASON)
                else:
                    ROBOT_CONTROL_MOVE_RESPONSE_REASON = (
                        "Invalid robot control move response message - Status missing."
                    )
                    raise RoboticArmException(ROBOT_CONTROL_MOVE_RESPONSE_REASON)
            else:
                ROBOT_CONTROL_MOVE_RESPONSE_REASON = "Invalid robot control move response message - No Message or Invalid format"
                raise RoboticArmException(ROBOT_CONTROL_MOVE_RESPONSE_REASON)

    except Exception:
        logger.exception("Unable to verify robot control move response message.")
        ROBOT_CONTROL_MOVE_RESPONSE_OK = False
        ROBOT_CONTROL_MOVE_RESPONSE_EVENT.clear()


def publish_robot_control_move_request(game_request):
    global ROBOT_CONTROL_MOVE_RESPONSE_EVENT
    try:
        ROBOT_CONTROL_MOVE_RESPONSE_EVENT.set()
        logger.info("Publishing Robot Control Move Request")
        robot_control_move_topic = IPC_CLIENT.get_configuration(
            key_path=[ROBOT_CONTROL_MOVE_TOPIC_CONFIG]
        ).value[ROBOT_CONTROL_MOVE_TOPIC_CONFIG]
        if robot_control_move_topic:
            logger.debug(f"Game Request: {game_request}")
            publish_message(game_request, robot_control_move_topic)
        else:
            raise RoboticArmException(
                "Robot Control Move Request topic not specified in topic config {ROBOT_CONTROL_MOVE_TOPIC_CONFIG}"
            )
    except Exception:
        logger.exception("Unable to publish robot control move request")
        ROBOT_CONTROL_MOVE_RESPONSE_EVENT.clear()


def subscribe_to_board_validated_moves():
    board_validated_topic = IPC_CLIENT.get_configuration(
        key_path=[BOARD_VALIDATIONS_RESPONSE_TOPIC_CONFIG]
    ).value[BOARD_VALIDATIONS_RESPONSE_TOPIC_CONFIG]
    logger.info(f"Subscribing to topic {board_validated_topic}")
    IPC_CLIENT.subscribe_to_topic(
        topic=board_validated_topic,
        on_stream_event=on_board_validated_move,
    )
    logger.info(
        f"Successfully subscribed using aws.greengrass.ipc.pubsub to topic {board_validated_topic}"
    )


def subscribe_to_board_processed_moves():
    board_processed_topic = IPC_CLIENT.get_configuration(
        key_path=[BOARD_PROCESSED_TOPIC_CONFIG]
    ).value[BOARD_PROCESSED_TOPIC_CONFIG]
    logger.info(f"Subscribing to topic {board_processed_topic}")
    IPC_CLIENT.subscribe_to_topic(
        topic=board_processed_topic,
        on_stream_event=on_board_processed_move,
    )
    logger.info(
        f"Successfully subscribed using aws.greengrass.ipc.pubsub to topic {board_processed_topic}"
    )


def subscribe_to_board_started_moves():
    board_started_topic = IPC_CLIENT.get_configuration(
        key_path=[BOARD_START_RESPONSE_TOPIC_CONFIG]
    ).value[BOARD_START_RESPONSE_TOPIC_CONFIG]
    logger.info(f"Subscribing to topic {board_started_topic}")
    IPC_CLIENT.subscribe_to_topic(
        topic=board_started_topic,
        on_stream_event=on_board_started_move,
    )
    logger.info(
        f"Successfully subscribed using aws.greengrass.ipc.pubsub to topic {board_started_topic}"
    )


def on_board_validated_move(event):
    logger.critical("Received Board Validation event")
    logger.debug(f"IPC PubSub - Board Validation Event: {event}")
    global BOARD_VALIDATED_OK, BOARD_VALIDATED_REASON, LAST_VALIDATED_MOVE, BOARD_VALIDATION_EVENT
    try:
        if not BOARD_VALIDATION_EVENT.is_set():
            logger.warning(
                "Board validation game event wasn't set. Ignoring message as possible duplicate."
            )
            # BOARD_VALIDATION_EVENT.set()
        else:
            # Check message payload
            got_message = False
            try:
                topic = str(event.binary_message.context.topic)
                message = json.loads(str(event.binary_message.message, "utf-8"))
                got_message = True if message else False
            except Exception:
                logger.exception(f"Invalid Event: {event}")
                BOARD_VALIDATED_OK = False
                BOARD_VALIDATED_REASON = f"Invalid Event - {event}"
                BOARD_VALIDATION_EVENT.clear()
                return

            # Process board validation message
            if got_message:
                logger.info(f"Verifying board validation message: {message}")
                if "status" in message:
                    if message["status"] == BOARD_STATUS_VALUES["OK"]:
                        LAST_VALIDATED_MOVE = message["move"]
                        logger.info(f"Last validated move: {LAST_VALIDATED_MOVE}")
                        BOARD_VALIDATED_OK = True
                        logger.critical("Board move validation success")
                        BOARD_VALIDATION_EVENT.clear()
                    elif message["status"] == BOARD_STATUS_VALUES["ERROR"]:
                        BOARD_VALIDATED_REASON = f"Invalid move detected by Board  {'- ' + message['reason'] if 'reason' in message else None}"
                        raise SmartBoardException(
                            f"Invalid move detected by Board  {'- ' + message['reason'] if 'reason' in message else None}"
                        )
                    else:
                        BOARD_VALIDATED_REASON = (
                            "Invalid game board validation message - Status invalid."
                        )
                        raise SmartBoardException(
                            "Invalid game board validation message - Status invalid."
                        )
                else:
                    BOARD_VALIDATED_REASON = (
                        "Invalid game board validation message - Status missing."
                    )
                    raise SmartBoardException(
                        "Invalid game board validation message - Status missing."
                    )
            else:
                BOARD_VALIDATED_REASON = "Invalid game board validation message - No Message or Invalid format"
                raise SmartBoardException(
                    "Invalid game board validation message - No Message or Invalid format"
                )

    except Exception:
        logger.exception("Unable to process validation from board")
        traceback_last_line = traceback.format_exc().splitlines()[-1]
        BOARD_VALIDATED_OK = False
        BOARD_VALIDATION_EVENT.clear()


def on_board_processed_move(event):
    logger.critical("Received Board Processed event")
    logger.debug(f"IPC PubSub - Event: {event}")
    global BOARD_PROCESSED_OK, BOARD_PROCESSED_REASON, BOARD_PROCESSED_EVENT
    try:
        if not BOARD_PROCESSED_EVENT.is_set():
            logger.warning(
                "Board processed game event wasn't set. Ignoring message as possible duplicate."
            )
            # BOARD_PROCESSED_EVENT.set()
        else:
            # Check message payload
            got_message = False
            try:
                topic = str(event.binary_message.context.topic)
                message = json.loads(str(event.binary_message.message, "utf-8"))
                got_message = True if message else False
            except Exception:
                logger.exception(f"Invalid Event: {event}")
                BOARD_PROCESSED_OK = False
                BOARD_PROCESSED_REASON = f"Invalid Event - {event}"
                BOARD_PROCESSED_EVENT.clear()
                return

            # Process board processed move message
            if got_message:
                logger.info(f"Verifying board processed move message: {message}")
                if "status" in message:
                    if message["status"] == BOARD_STATUS_VALUES["OK"]:
                        logger.info(f"Last validated move: {LAST_VALIDATED_MOVE}")
                        logger.info(f"Current validated move: {message['lan']}")
                        if LAST_VALIDATED_MOVE == message["lan"]:
                            BOARD_PROCESSED_OK = True
                            BOARD_PROCESSED_EVENT.clear()
                            logger.critical("Board processed move verification success")
                        else:
                            error_msg = f"Last validated move: {LAST_VALIDATED_MOVE} different than Current processed move: {message['lan']}"
                            raise SmartBoardException(error_msg)
                    elif message["status"] == BOARD_STATUS_VALUES["ERROR"]:
                        BOARD_PROCESSED_REASON = f"Invalid move detected by Board  {'- ' + message['reason'] if 'reason' in message else None}"
                        raise SmartBoardException(
                            f"Invalid move detected by Board  {'- ' + message['reason'] if 'reason' in message else None}"
                        )
                    else:
                        BOARD_PROCESSED_REASON = "Invalid game board processed move message - Status invalid."
                        raise SmartBoardException(
                            "Invalid game board processed message - Status invalid."
                        )
                else:
                    BOARD_PROCESSED_REASON = (
                        "Invalid game board processed message - Status missing."
                    )
                    raise SmartBoardException(
                        "Invalid game board processed message - Status missing."
                    )
            else:
                BOARD_PROCESSED_REASON = "Invalid game board processed move message - No Message or Invalid format"
                raise SmartBoardException(
                    "Invalid game board processed message - No Message or Invalid format"
                )

    except Exception:
        logger.exception("Unable to verify processed move from board")
        traceback_last_line = traceback.format_exc().splitlines()[-1]
        BOARD_PROCESSED_OK = False
        BOARD_PROCESSED_EVENT.clear()


def on_board_started_move(event):
    logger.critical("Received Board Game Started event")
    logger.info(f"IPC PubSub - Event: {event}")
    global BOARD_STARTED_OK, BOARD_STARTED_REASON, BOARD_START_EVENT, LAST_TASK_TOKEN
    try:
        if not BOARD_START_EVENT.is_set():
            logger.warning(
                "Board started game event wasn't set. Ignoring message as possible duplicate."
            )
            # BOARD_START_EVENT.set()
        else:
            # Check message payload
            got_message = False
            try:
                topic = str(event.binary_message.context.topic)
                message = json.loads(str(event.binary_message.message, "utf-8"))
                got_message = True if message else False
            except Exception:
                logger.exception(f"Invalid Event: {event}")
                BOARD_STARTED_OK = False
                BOARD_STARTED_REASON = f"Invalid Event - {event}"
                BOARD_START_EVENT.clear()
                return

            # Process board started game message
            if got_message:
                logger.info(f"Verifying board started game message: {message}")
                if "taskToken" in message:
                    if LAST_TASK_TOKEN is None:
                        logger.info("Setting last task token for the first time")
                        LAST_TASK_TOKEN = message["taskToken"]
                    elif LAST_TASK_TOKEN != message["taskToken"]:
                        logger.info(
                            "Current task token is different, updating last known task token"
                        )
                        LAST_TASK_TOKEN = message["taskToken"]
                    elif LAST_TASK_TOKEN == message["taskToken"]:
                        raise SmartBoardException(
                            f"Last task token is the same as the current token, potential duplicated message. {message['taskToken']}"
                        )
                    else:
                        logger.warning("Unknown condition")
                if "status" in message:
                    if message["status"] == BOARD_STATUS_VALUES["OK"]:
                        logger.info("Valid message and OK status, clearing event")
                        BOARD_STARTED_OK = True
                        BOARD_START_EVENT.clear()
                    elif message["status"] == BOARD_STATUS_VALUES["ERROR"]:
                        BOARD_STARTED_REASON = f"Invalid start position detected by Board  {'- ' + message['reason'] if 'reason' in message else None}"
                        raise SmartBoardException(
                            f"Invalid start position detected by Board  {'- ' + message['reason'] if 'reason' in message else None}"
                        )
                    else:
                        BOARD_STARTED_REASON = (
                            "Invalid start position message- Status invalid."
                        )
                        raise SmartBoardException(
                            "Invalid start position message - Status invalid."
                        )
                else:
                    BOARD_STARTED_REASON = (
                        "Invalid start position message - Status missing."
                    )
                    raise SmartBoardException(
                        "Invalid start position message - Status missing."
                    )
            else:
                BOARD_STARTED_REASON = (
                    "Invalid start position message - No Message or Invalid format"
                )
                raise SmartBoardException(
                    "Invalid start position message - No Message or Invalid format"
                )

    except Exception:
        logger.exception("Unable to verify start position from board")
        traceback_last_line = traceback.format_exc().splitlines()[-1]
        BOARD_STARTED_OK = False
        BOARD_START_EVENT.clear()


def publish_board_validation_request(game_request):
    global BOARD_VALIDATION_EVENT
    try:
        BOARD_VALIDATION_EVENT.set()
        logger.info(
            f"Publishing Board Validation Request - Event set {BOARD_VALIDATION_EVENT.is_set()}"
        )
        board_validations_topic = IPC_CLIENT.get_configuration(
            key_path=[BOARD_VALIDATIONS_TOPIC_CONFIG]
        ).value[BOARD_VALIDATIONS_TOPIC_CONFIG]
        if board_validations_topic:
            logger.debug(f"Game Request: {game_request}")
            publish_message(game_request, board_validations_topic)
        else:
            raise SmartBoardException(
                "Board validations topic not specified in topic config {BOARD_VALIDATIONS_TOPIC_CONFIG}"
            )
    except Exception:
        logger.exception("Unable to publish board validation request")
        BOARD_VALIDATION_EVENT.clear()


def publish_board_start_request(game_request):
    global BOARD_START_EVENT
    try:
        BOARD_START_EVENT.set()
        logger.info("Publishing Board Start Request")
        board_start_topic = IPC_CLIENT.get_configuration(
            key_path=[BOARD_START_TOPIC_CONFIG]
        ).value[BOARD_START_TOPIC_CONFIG]
        if board_start_topic:
            logger.debug(f"Game Request: {game_request}")
            publish_message(game_request, board_start_topic)
        else:
            raise SmartBoardException(
                "Board start topic not specified in topic config {BOARD_START_TOPIC_CONFIG}"
            )
    except Exception:
        logger.exception("Unable to publish board start request")
        BOARD_START_EVENT.clear()


def get_core_device_named_shadow():
    """
    Get the shadow document for the core device's named shadow
    Returns reported, desired, and delta states
    """
    desired, reported, delta = None, None, None
    try:
        core_named_shadow = IPC_CLIENT.get_configuration(
            key_path=[CORE_MAIN_NAMED_SHADOW_CONFIG]
        ).value[CORE_MAIN_NAMED_SHADOW_CONFIG]
        logger.info(
            f"Getting shadow states for named shadow {core_named_shadow} of thing {core_named_shadow}"
        )
        response = IPC_CLIENT.get_thing_shadow(
            thing_name=core_named_shadow, shadow_name=core_named_shadow
        )
        shadow_doc = json.loads(str(response.payload, "utf-8"))
        if shadow_doc:
            desired = (
                shadow_doc["state"]["desired"]
                if "desired" in shadow_doc["state"]
                else None
            )
            reported = (
                shadow_doc["state"]["reported"]
                if "reported" in shadow_doc["state"]
                else None
            )
            delta = (
                shadow_doc["state"]["delta"] if "delta" in shadow_doc["state"] else None
            )

            logger.debug(f"Shadow Document: {shadow_doc}")

        return desired, reported, delta
    except InvalidArgumentsError:
        logger.error(
            f"Cannot get shadow states for named shadow {core_named_shadow} of thing {core_named_shadow}"
        )
        logger.exception(INVALID_ARGUMENTS_ERR_MSG)
    except ResourceNotFoundError:
        logger.error(
            f"Cannot get shadow states for named shadow {core_named_shadow} of thing {core_named_shadow}"
        )
        logger.exception(
            "ResourceNotFoundError - The requested local shadow document can't be found."
        )
    except ServiceError:
        logger.error(
            f"Cannot get shadow states for named shadow {core_named_shadow} of thing {core_named_shadow}"
        )
        logger.exception(SERVICE_ERR_MSG)
    except UnauthorizedError:
        logger.error(
            f"Cannot get shadow states for named shadow {core_named_shadow} of thing {core_named_shadow}"
        )
        logger.exception(UNAUTHORIZED_ERR_MSG)
    except Exception:
        logger.error(
            f"Cannot get shadow states for named shadow {core_named_shadow} of thing {core_named_shadow}"
        )
        logger.exception("Exception")


def update_core_device_named_shadow(desired=None, reported=None):
    """
    Update the core device's named shadow with the provided desired and reported states
    """
    try:
        core_named_shadow = IPC_CLIENT.get_configuration(
            key_path=[CORE_MAIN_NAMED_SHADOW_CONFIG]
        ).value[CORE_MAIN_NAMED_SHADOW_CONFIG]
        logger.info(
            f"Updating shadow states for named shadow {core_named_shadow} of thing {core_named_shadow}"
        )

        # Create payload
        if desired and reported:
            payload_json_dict = {
                "state": {
                    "desired": desired,
                    "reported": reported,
                }
            }
        elif desired:
            payload_json_dict = {
                "state": {
                    "desired": desired,
                }
            }
        elif reported:
            payload_json_dict = {
                "state": {
                    "reported": reported,
                }
            }
        else:
            raise CoreDeviceException(
                "Cannot update core device's named shadow with desired and reported states - both desired and reported states cannot be empty"
            )

        payload_json = json.dumps(payload_json_dict, ensure_ascii=False)
        payload = bytes(payload_json, "utf-8")
        # logger.debug(f"Payload: {payload}")
        response = IPC_CLIENT.update_thing_shadow(
            thing_name=core_named_shadow, shadow_name=core_named_shadow, payload=payload
        )
        shadow_doc = json.loads(str(response.payload, "utf-8"))
        logger.debug(f"Shadow Document: {shadow_doc}")

    except ConflictError:
        logger.error(
            f"Cannot update shadow states for named shadow {core_named_shadow} of thing {core_named_shadow}"
        )
        logger.exception(
            "ConflictError - The local shadow service encountered a version conflict during the update operation. This occurs when the version in the request payload doesn't match the version in the latest available local shadow document."
        )
    except InvalidArgumentsError:
        logger.error(
            f"Cannot update shadow states for named shadow {core_named_shadow} of thing {core_named_shadow}"
        )
        logger.exception(INVALID_ARGUMENTS_ERR_MSG)
    except ServiceError:
        logger.error(
            f"Cannot update shadow states for named shadow {core_named_shadow} of thing {core_named_shadow}"
        )
        logger.exception(SERVICE_ERR_MSG)
    except UnauthorizedError:
        logger.error(
            f"Cannot update shadow states for named shadow {core_named_shadow} of thing {core_named_shadow}"
        )
        logger.exception(UNAUTHORIZED_ERR_MSG)
    except Exception:
        logger.error(
            f"Cannot update shadow states for named shadow {core_named_shadow} of thing {core_named_shadow}"
        )
        logger.exception("Exception")


def publish_message(message, topic):
    try:
        logger.info(
            f"Sending message to topic {topic} using aws.greengrass.ipc.mqttproxy."
        )
        logger.debug(f"message: {message}")
        return IPC_CLIENT.publish_to_iot_core(
            topic_name=topic,
            qos=model.QOS.AT_MOST_ONCE,
            payload=bytes(json.dumps(message), "utf-8"),
        )
    except Exception:
        logger.warning(
            "Cannot send message to topic using aws.greengrass.ipc.mqttproxy."
        )
        try:
            logger.info(
                f"Sending message to topic {topic} using aws.greengrass.ipc.pubsub."
            )
            binary_message = BinaryMessage(message=bytes(json.dumps(message), "utf-8"))
            publish_message = PublishMessage(binary_message=binary_message)
            return IPC_CLIENT.publish_to_topic(
                topic=topic, publish_message=publish_message
            )
        except Exception:
            logger.error(f"Cannot send message to topic {topic}")
            logger.exception("Exception")
            raise PublishMessageException(f"Cannot send message to topic {topic}")


def publish_game_response(task_token, status, reason=None):
    try:
        logger.info("Publishing Game Response")
        game_responses_topic = IPC_CLIENT.get_configuration(
            key_path=[GAME_RESPONSES_TOPIC_CONFIG]
        ).value[GAME_RESPONSES_TOPIC_CONFIG]
        if game_responses_topic:
            if status and reason and task_token:
                message = {"taskToken": task_token, "status": status, "reason": reason}
            elif status and task_token:
                message = {"taskToken": task_token, "status": status}
            elif status and reason:
                message = {"status": status, "reason": reason}
            else:
                raise GameException(
                    "Cannot publish game response - status and reason and taskToken cannot be empty"
                )

            logger.debug(f"Game Response: {message}")
            publish_message(message, game_responses_topic)
        else:
            raise GameException(
                "Game response topic not specified in topic config {GAME_RESPONSES_TOPIC_CONFIG}"
            )
    except Exception:
        logger.exception("Unable to publish game response")


def subscribe_to_game_requests():
    # Cloud requestor topic
    game_requests_topic = IPC_CLIENT.get_configuration(
        key_path=[GAME_REQUESTS_TOPIC_CONFIG]
    ).value[GAME_REQUESTS_TOPIC_CONFIG]
    logger.info(f"Subscribing to topic {game_requests_topic}")
    IPC_CLIENT.subscribe_to_iot_core(
        topic_name=game_requests_topic,
        qos=model.QOS.AT_MOST_ONCE,
        on_stream_event=on_game_request,
    )
    logger.info(
        f"Successfully subscribed using aws.greengrass.ipc.mqttproxy to topic {game_requests_topic}"
    )


def on_game_request(event):
    logger.critical("Received Game request")
    logger.debug(f"IoTCore - Event: {event}")
    try:
        # Check message payload
        got_message = False
        try:
            # msg_topic = str(event.message.topic_name)
            message = json.loads(str(event.message.payload, "utf-8"))
            got_message = True if message else False
        except Exception:
            logger.exception(f"Invalid Event: {event}")
            logger.info("Sending error response")
            traceback_last_line = traceback.format_exc().splitlines()[-1]
            publish_game_response(None, 400, traceback_last_line)
            logger.error("Error message sent - Invalid Event")
            return

        # Process game request and add to requests queue
        if got_message:
            logger.info(f"Validating game request: {message}")
            # Move action
            if "action" in message and (message["action"]).lower() in (
                GAME_REQUEST_ACTIONS.values()
            ):
                if "taskToken" in message and "sessionId" in message:
                    # Check if Game manager is busy
                    if BUSY_EVENT.is_set():
                        logger.error(
                            f"Game Manager BUSY! - Cannot process Game Request - {message['sessionId']}"
                        )
                        thread = Thread(
                            target=publish_game_response,
                            args=(
                                message["taskToken"] if message["taskToken"] else None,
                                400,
                                "Game Manager is currently busy handling a previous request",
                            ),
                        )
                        logger.info("Running thread to send busy response message")
                        thread.start()
                    else:
                        # Start action
                        if (
                            "action" in message
                            and (message["action"]).lower()
                            == (GAME_REQUEST_ACTIONS["START"]).lower()
                        ):
                            global CURRENT_GAME_ID, GAME_IN_PROGRESS, GAME_ENDED, LAST_GAME_ID
                            CURRENT_GAME_ID = message["sessionId"]
                            GAME_IN_PROGRESS = True
                            GAME_ENDED = False
                            if LAST_GAME_ID == CURRENT_GAME_ID:
                                raise GameException(
                                    f"Invalid game request, sessionId {CURRENT_GAME_ID} matches last ended game {LAST_GAME_ID}"
                                )

                        # Move action
                        if (
                            "action" in message
                            and (message["action"]).lower()
                            == (GAME_REQUEST_ACTIONS["MOVE"]).lower()
                        ):
                            if (
                                GAME_IN_PROGRESS
                                and message["sessionId"] != CURRENT_GAME_ID
                            ):
                                raise GameException(
                                    f"Invalid game request, sessionId {message['sessionId']} does not match current in-progress game {CURRENT_GAME_ID}"
                                )
                            if not GAME_IN_PROGRESS:
                                raise GameException(
                                    "Invalid game request - Game is not in progress"
                                )

                        # Place request in queue
                        BUSY_EVENT.set()
                        GAME_REQUESTS_QUEUE.put(message)
                        logger.info(f"Game request added to queue - {CURRENT_GAME_ID}")
                else:
                    raise GameException(
                        "Invalid game request - sessionId and/or taskToken not present"
                    )
            else:
                raise GameException(
                    "Invalid game request - action not present or invalid"
                )
        else:
            raise GameException("No Message in Event")

    except Exception:
        logger.exception("Unable to process game request")
        logger.info("Sending error response")
        traceback_last_line = traceback.format_exc().splitlines()[-1]
        publish_game_response(
            message["taskToken"] if "taskToken" in message else None,
            400,
            traceback_last_line,
        )
        logger.error(
            f"Error message sent - {message['taskToken'] if 'taskToken' in message else 'No Task Token Given'}"
        )


board_validate_retry_num = 1


@retry(Exception, tries=3, delay=3, backoff=3, max_delay=10)
def board_validate(game_request):
    global BOARD_VALIDATED_OK, BOARD_VALIDATED_REASON, board_validate_retry_num
    BOARD_VALIDATED_OK = False
    BOARD_VALIDATED_REASON = None

    if board_validate_retry_num > 1:
        game_request["move_type"] = "RETRY"
        logger.warning(f"Added retry flag to game request payload: {game_request}")
    else:
        logger.warning("Deleting move_type key from request")
        if "move_type" in game_request:
            del game_request["move_type"]

    logger.info(
        f"Validating move request with board - Attempt {board_validate_retry_num} - Event Set {BOARD_VALIDATION_EVENT.is_set()}"
    )
    publish_board_validation_request(game_request)
    elapsed_time = 0
    while BOARD_VALIDATION_EVENT.is_set() and elapsed_time < 30:
        logger.info("Waiting for board validation event")
        time.sleep(3)
        elapsed_time += 3
    if not BOARD_VALIDATED_OK:
        board_validate_retry_num += 1
        if board_validate_retry_num > 3:
            logger.warning("Board Validate - Resetting retry num.")
            board_validate_retry_num = 1
        raise SmartBoardException("Board validation failed")
    logger.info("Board validation complete")
    board_validate_retry_num = 1
    return True


board_verify_retry_num = 1


@retry(Exception, tries=3, delay=3, backoff=3, max_delay=10)
def board_verify_move():
    global board_verify_retry_num, BOARD_PROCESSED_OK, BOARD_PROCESSED_REASON
    BOARD_PROCESSED_REASON = None
    BOARD_PROCESSED_OK = False

    if not BOARD_PROCESSED_OK:
        BOARD_PROCESSED_EVENT.set()
        elapsed_time = 0
        logger.info(
            f"Verifying board processed move - Attempt {board_verify_retry_num} - Event Set {BOARD_PROCESSED_EVENT.is_set()}"
        )
        while BOARD_PROCESSED_EVENT.is_set() and elapsed_time < 30:
            logger.info("Waiting for board processed event")
            time.sleep(3)
            elapsed_time += 3
        if not BOARD_PROCESSED_OK:
            board_verify_retry_num += 1
            if board_verify_retry_num > 3:
                logger.warning("Board Verify - Resetting retry num.")
                board_verify_retry_num = 1
            raise SmartBoardException("Board processed move verification failed")
        logger.info("Board verification complete")
        board_verify_retry_num = 1
        return True
    else:
        logger.info("Board already processed move")
        return True


board_start_retry_num = 1


@retry(Exception, tries=3, delay=3, backoff=3, max_delay=10)
def board_start(game_request):
    global BOARD_STARTED_OK, BOARD_STARTED_REASON
    BOARD_STARTED_OK = False
    BOARD_STARTED_REASON = None
    global board_start_retry_num
    logger.info(
        f"Validating start request with board - Attempt {board_start_retry_num} - Event Set {BOARD_START_EVENT.is_set()}"
    )
    publish_board_start_request(game_request)
    elapsed_time = 0
    while BOARD_START_EVENT.is_set() and elapsed_time < 30:
        logger.info("Waiting for board started event")
        time.sleep(3)
        elapsed_time += 3
    if not BOARD_STARTED_OK:
        board_start_retry_num += 1
        if board_start_retry_num > 3:
            logger.warning("Board Start - Resetting retry num.")
            board_start_retry_num = 1
        raise SmartBoardException("Board start request failed")
    logger.info("Board start request complete")
    board_start_retry_num = 1
    return True


robot_move_retry_num = 1


@retry(Exception, tries=3, delay=3, backoff=3, max_delay=10)
def robot_move(game_request):
    global ROBOT_CONTROL_MOVE_RESPONSE_OK, ROBOT_CONTROL_MOVE_RESPONSE_REASON
    ROBOT_CONTROL_MOVE_RESPONSE_OK = False
    ROBOT_CONTROL_MOVE_RESPONSE_REASON = None
    global robot_move_retry_num

    logger.info(
        f"Instructing Robotic Arm to make a move - Attempt {robot_move_retry_num} - Event Set {ROBOT_CONTROL_MOVE_RESPONSE_EVENT.is_set()}"
    )
    publish_robot_control_move_request(game_request)
    elapsed_time = 0
    while ROBOT_CONTROL_MOVE_RESPONSE_EVENT.is_set() and elapsed_time < 30:
        logger.info("Waiting for robot control move response event")
        time.sleep(3)
        elapsed_time += 3
    if not ROBOT_CONTROL_MOVE_RESPONSE_OK:
        robot_move_retry_num += 1
        if robot_move_retry_num > 3:
            logger.warning("Robotic Arm Move Request - Resetting retry num.")
            robot_move_retry_num = 1
        raise RoboticArmException("Robotic Arm move request failed")
    logger.info("Robot Control Move Request complete")
    robot_move_retry_num = 1
    return True


def process_game_request(game_request):
    """
    Process the game request
    """
    global CURR_TASK_TOKEN, CURR_GAME_REQUEST
    BOARD_MOVE_VERIFICATION_FAILED_MSG = "Board processed move verification failed - Cant validate processed move even after retrying."

    global BOARD_START_EVENT, BOARD_VALIDATION_EVENT, BOARD_PROCESSED_EVENT
    global GAME_IN_PROGRESS, GAME_ENDED, LAST_GAME_ID
    global BOARD_STARTED_REASON, BOARD_VALIDATED_REASON, BOARD_PROCESSED_REASON
    global ROBOT_CONTROL_MOVE_RESPONSE_OK

    # Clear event threads
    logger.warning("Clearing event threads")
    BOARD_START_EVENT.clear()
    BOARD_VALIDATION_EVENT.clear()
    BOARD_PROCESSED_EVENT.clear()

    fullmove_num = int((game_request["after"].split("/")[7]).split(" ")[5])
    logger.critical(
        f"Processing game request - sessionId {game_request['sessionId']} - Full Move {fullmove_num} - Action {game_request['action']}"
    )
    logger.debug(f"Game request {game_request}")

    status, reason = None, None
    # * Board action 'start'
    if (game_request["action"]).lower() == str(GAME_REQUEST_ACTIONS["START"]).lower():
        # Board start
        try:
            logger.info("Validating start game request against board")
            board_start(game_request)
        except Exception:
            logger.error(
                "Board start game request failed - Can't start game even after retrying."
            )
            BOARD_STARTED_REASON = (
                "Board start game request failed - Can't start game even after retrying."
                if BOARD_STARTED_REASON is None
                else BOARD_STARTED_REASON
            )
            status, reason = 500, BOARD_STARTED_REASON
            return status, reason

        # Set Successful status
        status, reason = 200, None

        # Store current task token and current game request
        CURR_TASK_TOKEN = game_request["taskToken"]
        CURR_GAME_REQUEST = game_request

    # * Board action 'move'
    elif (game_request["action"]).lower() == str(GAME_REQUEST_ACTIONS["MOVE"]).lower():

        # Store current task token and current game request
        CURR_TASK_TOKEN = game_request["taskToken"]
        CURR_GAME_REQUEST = game_request

        # * Board Validation
        try:
            logger.info("Validating move game request against board")
            board_validate(game_request)
        except Exception:
            logger.error(
                "Board validation failed - Cant validate move even after retrying."
            )
            BOARD_VALIDATED_REASON = (
                "Board validation failed - Cant validate move even after retrying."
                if BOARD_VALIDATED_REASON is None
                else BOARD_VALIDATED_REASON
            )
            status, reason = 500, BOARD_VALIDATED_REASON
            return status, reason

        if BOARD_VALIDATED_OK:

            if ROBOT_ENABLED:

                # * Robot Control Move request
                try:
                    logger.critical("Sending request to robot control to make a move")
                    robot_move(game_request)
                except Exception:
                    ROBOT_CONTROL_MOVE_RESPONSE_REASON = (
                        "Robot Control Move Request failed - Cannot confirm move has been executed even after retrying."
                        if ROBOT_CONTROL_MOVE_RESPONSE_REASON is None
                        else ROBOT_CONTROL_MOVE_RESPONSE_REASON
                    )
                    logger.error(ROBOT_CONTROL_MOVE_RESPONSE_REASON)
                    status, reason = 500, ROBOT_CONTROL_MOVE_RESPONSE_REASON
                    return status, reason

                if ROBOT_CONTROL_MOVE_RESPONSE_OK:
                    # * Board Move Verification
                    try:
                        logger.info("Verifying executed move against board")
                        board_verify_move()
                    except Exception:
                        logger.error(BOARD_MOVE_VERIFICATION_FAILED_MSG)
                        BOARD_PROCESSED_REASON = (
                            BOARD_MOVE_VERIFICATION_FAILED_MSG
                            if BOARD_PROCESSED_REASON is None
                            else BOARD_PROCESSED_REASON
                        )
                        status, reason = 500, BOARD_PROCESSED_REASON
                        return status, reason

                    if BOARD_PROCESSED_OK:

                        # * Check if game is in final state (draw or checkmate)
                        halfmove_clock = int(
                            (game_request["after"].split("/")[7]).split(" ")[4]
                        )
                        is_checkmate = True if "#" in game_request["san"] else False
                        if halfmove_clock == 100 or is_checkmate:
                            logger.critical(
                                f"Game is in final state - {game_request['action']}"
                            )
                            GAME_IN_PROGRESS = False
                            GAME_ENDED = True
                            LAST_GAME_ID = CURRENT_GAME_ID

                        # Set Successful status
                        status, reason = 200, None

                    else:
                        # Set Error status
                        logger.error("Board Processed move error")
                        status, reason = 500, BOARD_PROCESSED_REASON
                else:
                    # Set Error status
                    logger.error("Robot Move request error")
                    status, reason = 500, ROBOT_CONTROL_MOVE_RESPONSE_REASON

            else:
                logger.warning(
                    "Robot Control is disabled - Processing Move without Robotic Arms"
                )

                # * Board Move Verification
                try:
                    logger.info("Verifying executed move against board")
                    board_verify_move()
                except Exception:
                    logger.error(BOARD_MOVE_VERIFICATION_FAILED_MSG)
                    BOARD_PROCESSED_REASON = (
                        BOARD_MOVE_VERIFICATION_FAILED_MSG
                        if BOARD_PROCESSED_REASON is None
                        else BOARD_PROCESSED_REASON
                    )
                    status, reason = 500, BOARD_PROCESSED_REASON
                    return status, reason

                if BOARD_PROCESSED_OK:

                    # Check if game is in final state (draw or checkmate)
                    halfmove_clock = int(
                        (game_request["after"].split("/")[7]).split(" ")[4]
                    )
                    is_checkmate = True if "#" in game_request["san"] else False
                    if halfmove_clock == 100 or is_checkmate:
                        logger.critical(
                            f"Game is in final state - {game_request['action']}"
                        )
                        GAME_IN_PROGRESS = False
                        GAME_ENDED = True
                        LAST_GAME_ID = CURRENT_GAME_ID

                    # Set Successful status
                    status, reason = 200, None

                else:
                    # Set Error status
                    logger.error("Board Processed move error")
                    status, reason = 500, BOARD_PROCESSED_REASON
        else:
            logger.error("Board validation failed")
            status, reason = 500, BOARD_VALIDATED_REASON

    # * Unsupported action
    else:
        logger.error(f"Unsupported action {game_request['action']}")
        status, reason = 400, f"Unsupported action {game_request['action']}"

    return status, reason


def main():
    try:
        # Create an IPC client and a robo tap room device manager.
        global IPC_CLIENT
        if IPC_CLIENT is None:
            IPC_CLIENT = GreengrassCoreIPCClientV2()

        # Subscribe to game requests topic
        subscribe_to_game_requests()

        # Subscribe to board topics
        subscribe_to_board_started_moves()
        subscribe_to_board_validated_moves()
        subscribe_to_board_processed_moves()

        # Subscribe to robotic arms topics
        if ROBOT_ENABLED:
            logger.warning("Robot Control is ENABLED")
            subscribe_to_robot_move_responses()
        else:
            logger.warning(
                "Robot Control is DISABLED - Not Subscribed to Robot Control Topics"
            )

        """
        Holds the process to handle Game requests.
        """
        try:
            while True:
                game_request = GAME_REQUESTS_QUEUE.get()
                if game_request is None:
                    break
                else:
                    logger.critical(
                        f"Handling Game request for action {game_request['action']} - sessionId {game_request['sessionId']}"
                    )

                    # Highlight new game request on log
                    if game_request["action"] == GAME_REQUEST_ACTIONS["START"]:
                        logger.warning(
                            f"New Game request - sessionId {game_request['sessionId']}"
                        )

                    # Update the core device's named shadow desired state with the game request
                    logger.info("Updating shadow's desired state with the game request")
                    update_core_device_named_shadow(
                        desired={"gameRequest": game_request}
                    )

                    # Get the core device's named shadow and check if there's a delta
                    desired, reported, delta = get_core_device_named_shadow()
                    if delta:
                        logger.debug(f"Game request (delta): {delta}")

                        # * Process game request
                        status, reason = process_game_request(desired["gameRequest"])
                        logger.critical(
                            f"Processed Game request with status: {status} {'- reason ' + reason if reason != None else ''} "
                        )

                        # Update the core device's named shadow with the processed move
                        if reported:
                            reported["gameRequest"] = desired["gameRequest"]
                            update_core_device_named_shadow(desired, reported)
                        else:
                            # Set reported as desired when no reported state is present
                            update_core_device_named_shadow(desired, desired)

                        # Send message to response topic (either success or error)
                        if status == 200:
                            logger.info(
                                f"Sending Game response message with status {status}"
                            )
                        else:
                            logger.warning(
                                f"Sending Game response message with status {status} {'- reason ' + reason if reason != None else None} "
                            )

                        publish_game_response(game_request["taskToken"], status, reason)

                    else:
                        delta_error_msg = "There is no delta between desired and reported states. Check if the same request was sent twice."
                        logger.error(delta_error_msg)
                        # Send game response error
                        status = 400
                        logger.warning(
                            f"Sending Game response message with status {status} - reason {delta_error_msg}"
                        )
                        publish_game_response(
                            game_request["taskToken"], status, delta_error_msg
                        )

                    # Clear busy event
                    BUSY_EVENT.clear()

                    # Mark task as done in queue
                    GAME_REQUESTS_QUEUE.task_done()

                    logger.critical(
                        f"Game request processed - sessionId {game_request['sessionId']}"
                    )

        except InterruptedError:
            logger.error("Application interrupted")
            logger.exception("Exception")
            exit(1)

    except Exception:
        logger.error("Exception occurred when using IPC.")
        logger.exception("Exception")
        exit(1)


if __name__ == "__main__":
    main()
