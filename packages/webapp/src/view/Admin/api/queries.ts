import {
  getLatestMove,
  listActiveSessions,
  listGamesByMoveCount,
} from "../../../graphql/queries";

import {
  BedrockClient,
  ListFoundationModelsCommand,
  ListImportedModelsCommand,
} from "@aws-sdk/client-bedrock";

import { generateClient } from "aws-amplify/api";
import { useQuery } from "@tanstack/react-query";
import { fetchAuthSession } from "aws-amplify/auth";
import { list } from "aws-amplify/storage";

const client = generateClient();

/*****************************************************************/
/*********************** listActiveSessions **********************/
/*****************************************************************/

export const useListActiveSessions = () => {
  return useQuery({
    queryKey: ["listActiveSessions"],
    queryFn: async () => {
      const { data } = await client.graphql({
        query: listActiveSessions,
      });

      return data.listActiveSessions;
    },
  });
};

/*****************************************************************/
/********************* listGamesByMoveCount **********************/
/*****************************************************************/

export const useGamesByMoveCount = () => {
  return useQuery({
    queryKey: ["listGamesByMoveCount"],
    queryFn: async () => {
      const { data } = await client.graphql({
        query: listGamesByMoveCount,
      });

      return data.listGamesByMoveCount;
    },
  });
};

/*****************************************************************/
/********************* listFoundationModels **********************/
/*****************************************************************/

export const useListFoundationModels = () => {
  return useQuery({
    queryKey: ["listFoundationModels"],
    queryFn: async () => {
      const { credentials } = await fetchAuthSession();

      const bedrockClient = new BedrockClient({
        region: import.meta.env.VITE_REGION,
        credentials,
      });

      const { modelSummaries } = await bedrockClient.send(
        new ListFoundationModelsCommand({
          byInferenceType: "ON_DEMAND",
          byOutputModality: "TEXT",
        })
      );

      return modelSummaries;
    },
  });
};

/*****************************************************************/
/********************** listImportedModels ***********************/
/*****************************************************************/

export const useListImportedModels = () => {
  return useQuery({
    queryKey: ["listImportedModels"],
    queryFn: async () => {
      const { credentials } = await fetchAuthSession();

      const bedrockClient = new BedrockClient({
        region: import.meta.env.VITE_REGION,
        credentials,
      });

      const { modelSummaries } = await bedrockClient.send(
        new ListImportedModelsCommand()
      );

      return modelSummaries;
    },
  });
};

/*****************************************************************/
/************************* getLatestMove *************************/
/*****************************************************************/

export const useGetLatestMove = (SessionID: string) => {
  return useQuery({
    queryKey: ["getLatestMove", SessionID],
    queryFn: async () => {
      const { data } = await client.graphql({
        query: getLatestMove,
        variables: { SessionID },
      });

      return data.getLatestMove;
    },
  });
};

/*****************************************************************/
/**************************** getBgSrc ***************************/
/*****************************************************************/

export const useGetBgSrc = () => {
  return useQuery({
    queryKey: ["getBgSrc"],
    queryFn: async () => {
      const { items } = await list({
        path: "backgrounds",
      });

      return items;
    },
  });
};
