## Embodied Chess Demo with Amazon Bedrock

An interactive chess application that leverages GenAI models hosted on Amazon Bedrock, featuring both 2D and 3D user interfaces and IoT connectivity options.

## Description

This project enables users to:

- Play chess against GenAI models
- Watch AI models play against each other
- Connect to IoT devices for physical chess interactions
- View games in both 2D and 3D interfaces

## Prerequisites

- [AWS Account](https://aws.amazon.com/account)
- [AWS CLI](https://aws.amazon.com/cli)
- [AWS CDK CLI](https://docs.aws.amazon.com/cdk/v2/guide/cli.html)
- [Node.js](https://nodejs.org)
- [pnpm](https://pnpm.io)
- [Docker](https://www.docker.com)
- [Access to Amazon Bedrock Models](https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html)

## Installation

1. Install dependencies:

   ```bash
   pnpm i
   ```

2. Create the Stockfish binary:

   ```bash
   pnpm create-stockfish-binary
   ```

3. Bootstrap your AWS account:

   ```bash
   pnpm cdk bootstrap
   ```

4. Deploy the application:

   ```bash
   pnpm cdk deploy
   ```

   or

   ```bash
   pnpm deploy-virtual
   ```

   > For IoT deployment run instead `pnpm cdk deploy -c iotDevice=true` or `pnpm deploy-physical`

## Accessing the Application

1. Log in to your AWS account

2. Configure the Amazon Cognito User Pool:

   - Locate the newly created Amazon Cognito user pool
   - Add your user profile
   - For admin access, add your user to the Admin user group

3. Access the Application:
   - Use the Amplify URL provided after deployment
   - Log in with your Amazon Cognito credentials

## Using the Application

1. Create a New Session:

   - Select "Create" on the Admin Dashboard
   - Configure game settings

2. Start a Game:

   - Locate your session in the Dashboard
   - Click the dropdown in the last column
   - Select "Start"

3. View the Game:
   - Select the session you'd like to view, this will save the session id as a cookie
   - Click on your login name in the top right corner
   - Choose between:
     - "Controls" for 2D view
     - "3D" for three-dimensional view

## AWS IoT Greengrass Chess Game Manager Component

The Chess Game Manager is an AWS IoT Greengrass component that orchestrates the physical execution of chess moves in an AI-powered chess game. It acts as a bridge between cloud-based AI models and physical hardware (smart chessboard and robotic arms), ensuring moves are properly validated and executed.

You can follow [these instructions](/packages/iot/greengrass/components/com.amazon.aws.ChessGameManager/README.md) to deploy it to your AWS IoT Greengrass Core Device.

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This project is licensed under the Apache-2.0 License.
