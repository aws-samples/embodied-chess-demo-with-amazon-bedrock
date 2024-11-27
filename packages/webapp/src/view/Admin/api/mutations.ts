import {
  createSession,
  deleteSession,
  updateGameStatus,
  updateSession,
} from "../../../graphql/mutations";

import { generateClient } from "aws-amplify/api";
import { useMutation } from "@tanstack/react-query";
import { remove } from "aws-amplify/storage";

const client = generateClient();

/*****************************************************************/
/************************* createSession *************************/
/*****************************************************************/

interface IUseCreateSession {
  sessionID: string;
  white: string;
  whiteID: string;
  black: string;
  blackID: string;
  backgroundSrc: string;
}

export const useCreateSession = () => {
  return useMutation({
    mutationKey: ["createSession"],
    mutationFn: async (props: IUseCreateSession) => {
      const { sessionID, white, whiteID, black, blackID, backgroundSrc } =
        props;

      const { data } = await client.graphql({
        query: createSession,
        variables: {
          input: {
            SessionID: sessionID,
            White: white,
            WhiteID: whiteID,
            Black: black,
            BlackID: blackID,
            BackgroundSrc: backgroundSrc,
          },
        },
      });

      return data.createSession;
    },
  });
};

/*****************************************************************/
/************************* updateSession *************************/
/*****************************************************************/

interface IUseUpdateSession {
  sessionID: string;
  white: string;
  whiteID: string;
  black: string;
  blackID: string;
}

export const useUpdateSession = () => {
  return useMutation({
    mutationKey: ["updateSession"],
    mutationFn: async (props: IUseUpdateSession) => {
      const { sessionID, white, whiteID, black, blackID } = props;

      const { data } = await client.graphql({
        query: updateSession,
        variables: {
          input: {
            SessionID: sessionID,
            White: white,
            WhiteID: whiteID,
            Black: black,
            BlackID: blackID,
          },
        },
      });

      return data.updateSession;
    },
  });
};

/*****************************************************************/
/*********************** updateGameStatus ************************/
/*****************************************************************/

interface IUseUpdateGameSession {
  SessionID: string;
  GameStatus: string;
}

export const useUpdateGameStatus = () => {
  return useMutation({
    mutationKey: ["updateGameStatus"],
    mutationFn: async ({ SessionID, GameStatus }: IUseUpdateGameSession) => {
      const { data } = await client.graphql({
        query: updateGameStatus,
        variables: {
          input: { SessionID, GameStatus },
        },
      });

      return data.updateGameStatus;
    },
  });
};

/*****************************************************************/
/************************* deleteSession *************************/
/*****************************************************************/

interface IUseDeleteSession {
  sessionID: string;
}

export const useDeleteSession = () => {
  return useMutation({
    mutationKey: ["deleteSession"],
    mutationFn: async ({ sessionID }: IUseDeleteSession) => {
      const { data } = await client.graphql({
        query: deleteSession,
        variables: {
          input: { SessionID: sessionID },
        },
      });

      return data.deleteSession;
    },
  });
};

/*****************************************************************/
/*************************** delBgSrcs ***************************/
/*****************************************************************/

export const useDelBgSrcs = () => {
  return useMutation({
    mutationKey: ["getBgSrc"],
    mutationFn: async ({ paths }: any) => {
      const promises = [];
      for (const path of paths) {
        promises.push(await remove({ path }));
      }

      return await Promise.all(promises);
    },
  });
};
