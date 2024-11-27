#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { GenAiChessStack } from "../lib/gen-ai-chess-stack";

const app = new cdk.App();
new GenAiChessStack(app, "GenAIChess");
