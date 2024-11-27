# Stockfish Binary Builder

This project contains a Dockerfile that builds the Stockfish chess engine from source and exports the compiled binary.

## Prerequisites

- [Docker](https://www.docker.com/)
- [pnpm](https://pnpm.io/) (for CDK deployment)

## Build Instructions

1. Open a terminal in this directory
2. Run the following command to build and extract the Stockfish binary:

```bash
docker build --output=. .
```

If successful, a `stockfish` binary will be created in your current directory.

## How it Works

The Dockerfile uses a multi-stage build process:

1. Uses AWS Lambda Python 3.12 base image
2. Installs necessary build dependencies
3. Clones the official Stockfish repository
4. Compiles Stockfish with profile optimizations
5. Strips the binary to reduce size
6. Exports only the compiled binary

## Next Steps

After successfully generating the Stockfish binary, you can deploy your infrastructure:

```bash
pnpm cdk deploy
```

## Troubleshooting

If you encounter permission issues with the binary, you may need to make it executable:

```bash
chmod +x stockfish
```

## License

The binary is subject to the Stockfish license (GPL-3.0). See [Stockfish GitHub repository](https://github.com/official-stockfish/Stockfish) for more details.
