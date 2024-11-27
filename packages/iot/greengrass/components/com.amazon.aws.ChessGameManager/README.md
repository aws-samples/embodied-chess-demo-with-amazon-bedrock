# Chess Game Manager Component

## Overview

The Chess Game Manager is an AWS IoT Greengrass component that orchestrates the physical execution of chess moves in an AI-powered chess game. It acts as a bridge between cloud-based AI models and physical hardware (smart chessboard and robotic arms), ensuring moves are properly validated and executed.

The component implements a three-phase validation system:

1. Validates intended moves with a smart chessboard
2. Coordinates robotic arms to execute moves
3. Confirms final piece positions with the smart chessboard

## Dependencies

The Chess Game Manager component requires the following Greengrass components:

- [`aws.greengrass.Nucleus`](https://docs.aws.amazon.com/greengrass/v2/developerguide/greengrass-nucleus-component.html): Core Greengrass functionality
- [`aws.greengrass.Cli`](https://docs.aws.amazon.com/greengrass/v2/developerguide/greengrass-cli-component.html): Command-line interface for local development and debugging
- [`aws.greengrass.clientdevices.Auth`](https://docs.aws.amazon.com/greengrass/v2/developerguide/client-device-auth-component.html): Authenticates client devices and authorizes client device actions.
- [`aws.greengrass.clientdevices.mqtt.Moquette`(https://docs.aws.amazon.com/greengrass/v2/developerguide/mqtt-broker-moquette-component.html)]: MQTT broker between client devices and a Greengrass core device
- [`aws.greengrass.clientdevices.IPDetector`](https://docs.aws.amazon.com/greengrass/v2/developerguide/ip-detector-component.html): Monitors and updates the Greengrass core device's network connectivity information
- [`aws.greengrass.clientdevices.mqtt.Bridge`](https://docs.aws.amazon.com/greengrass/v2/developerguide/mqtt-bridge-component.html): Relays MQTT messages between client devices, local Greengrass publish/subscribe, and AWS IoT Core
- [`aws.greengrass.ShadowManager`](https://docs.aws.amazon.com/greengrass/v2/developerguide/shadow-manager-component.html): Device shadow management
- [`aws.greengrass.LogManager`](https://docs.aws.amazon.com/greengrass/v2/developerguide/log-manager-component.html): Log management and CloudWatch integration
- [`aws.greengrass.LocalDebugConsole`](https://docs.aws.amazon.com/greengrass/v2/developerguide/local-debug-console-component.html): Local debugging interface (use during development only)

### Important Configuration Notes

1. **Client Devices Authentication (`aws.greengrass.clientdevices.Auth`)**:

   - The provided configuration includes a permissive policy that allows all actions
   - For production environments, modify the policy to restrict access to only required resources and actions
   - Review and update the `deviceGroups` configuration in the deployment JSON file

2. **Shadow Manager (`aws.greengrass.ShadowManager`)**:

   - Update the `coreThing.namedShadows` array with your core device name
   - Current configuration uses "CoreDevice_1" which should be replaced with your device name

3. **MQTT Bridge (`aws.greengrass.clientdevices.mqtt.Bridge`)**:
   - Review the topic mappings to ensure they match your requirements
   - The configuration includes mappings for all chess-related topics between local and cloud communication

## MQTT Topics

The component communicates through the following MQTT topics:

### AWS IoT Core Communication

- `robo-chess/cloud/request`: Receives move requests from AWS Step Functions
- `robo-chess/cloud/response`: Publishes move execution results back to the cloud

### Smart Chessboard Communication

- `robo-chess/devices/board/validate`: Requests move validation
- `robo-chess/devices/board/validate/response`: Receives validation results
- `robo-chess/devices/board/start`: Requests game start validation
- `robo-chess/devices/board/start/response`: Receives game start validation results
- `robo-chess/devices/board/processed`: Receives confirmation of physical move execution

### Robotic Arms Communication

- `robo-chess/devices/arm/move`: Sends move commands to robotic arms
- `robo-chess/devices/arm/move/response`: Receives move execution results

## Component Configuration

Key configuration parameters:

- `robotEnabled`: Enable/disable robotic arm control
- `logLevel`: Set logging level (default: INFO)
- `logFilePath`: Path to log file
- `coreDeviceMainNamedShadow`: Core device shadow name

## Development

### Prerequisites

1. Install the [AWS IoT Greengrass Development Kit CLI](https://docs.aws.amazon.com/greengrass/v2/developerguide/greengrass-development-kit-cli.html)

### Build and Publish

```bash
gdk component build && gdk component publish
```

## Deployment

You can use the AWS CLI to deploy the component to an AWS Greengrass Core Device. Review the `ChessGameManager_Deployment.json` file found under `packages/iot/greengrass/deployments`, and update the following:

1. Update the `targetArn` value to the ARN of your AWS IoT Greengrass core device
2. Review and modify the component dependencies' configurations as noted above
3. Update the `robotEnabled` configuration based on your setup requirements

```bash
aws greengrassv2 create-deployment --cli-input-json file://ChessGameManager_Deployment.json --profile <YOUR_AWS_PROFILE_NAME>
```
