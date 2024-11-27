/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const getSession = /* GraphQL */ `query GetSession($SessionID: ID!) {
  getSession(SessionID: $SessionID) {
    SessionID
    SK
    Type
    TimeStamp
    White
    WhiteID
    Black
    BlackID
    GameStatus
    Error
    Cause
    BackgroundSrc
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetSessionQueryVariables,
  APITypes.GetSessionQuery
>;
export const listActiveSessions = /* GraphQL */ `query ListActiveSessions($nextToken: String) {
  listActiveSessions(nextToken: $nextToken) {
    items {
      SessionID
      SK
      Type
      TimeStamp
      White
      WhiteID
      Black
      BlackID
      GameStatus
      Error
      Cause
      BackgroundSrc
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListActiveSessionsQueryVariables,
  APITypes.ListActiveSessionsQuery
>;
export const listGamesByMoveCount = /* GraphQL */ `query ListGamesByMoveCount($nextToken: String) {
  listGamesByMoveCount(nextToken: $nextToken) {
    SessionID
    SK
    Action
    Move
    MoveCount
    TimeStamp
    GameWinner
    SfnExecutionId
    TaskToken
    SanList
    SuggestedMove
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListGamesByMoveCountQueryVariables,
  APITypes.ListGamesByMoveCountQuery
>;
export const getMoves = /* GraphQL */ `query GetMoves($SessionID: ID!, $limit: Int, $nextToken: String) {
  getMoves(SessionID: $SessionID, limit: $limit, nextToken: $nextToken) {
    items {
      SessionID
      SK
      Action
      Move
      MoveCount
      TimeStamp
      GameWinner
      SfnExecutionId
      TaskToken
      SanList
      SuggestedMove
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<APITypes.GetMovesQueryVariables, APITypes.GetMovesQuery>;
export const getLatestMove = /* GraphQL */ `query GetLatestMove($SessionID: ID) {
  getLatestMove(SessionID: $SessionID) {
    SessionID
    SK
    Action
    Move
    MoveCount
    TimeStamp
    GameWinner
    SfnExecutionId
    TaskToken
    SanList
    SuggestedMove
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetLatestMoveQueryVariables,
  APITypes.GetLatestMoveQuery
>;
export const listComments = /* GraphQL */ `query ListComments($SessionID: ID!) {
  listComments(SessionID: $SessionID) {
    SessionID
    SK
    Comment
    Author
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListCommentsQueryVariables,
  APITypes.ListCommentsQuery
>;
