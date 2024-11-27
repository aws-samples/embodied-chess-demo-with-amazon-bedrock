/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const createSession = /* GraphQL */ `mutation CreateSession($input: CreateSessionInput!) {
  createSession(input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateSessionMutationVariables,
  APITypes.CreateSessionMutation
>;
export const updateSession = /* GraphQL */ `mutation UpdateSession($input: UpdateSessionInput!) {
  updateSession(input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateSessionMutationVariables,
  APITypes.UpdateSessionMutation
>;
export const updateGameStatus = /* GraphQL */ `mutation UpdateGameStatus($input: UpdateGameStatusInput!) {
  updateGameStatus(input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateGameStatusMutationVariables,
  APITypes.UpdateGameStatusMutation
>;
export const deleteSession = /* GraphQL */ `mutation DeleteSession($input: DeleteSessionInput!) {
  deleteSession(input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteSessionMutationVariables,
  APITypes.DeleteSessionMutation
>;
export const verifySession = /* GraphQL */ `mutation VerifySession($SessionID: String!) {
  verifySession(SessionID: $SessionID)
}
` as GeneratedMutation<
  APITypes.VerifySessionMutationVariables,
  APITypes.VerifySessionMutation
>;
export const humanNewMove = /* GraphQL */ `mutation HumanNewMove($input: HumanNewMoveInput!) {
  humanNewMove(input: $input) {
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
` as GeneratedMutation<
  APITypes.HumanNewMoveMutationVariables,
  APITypes.HumanNewMoveMutation
>;
export const updateLatestMove = /* GraphQL */ `mutation UpdateLatestMove($input: UpdateLatestMoveInput!) {
  updateLatestMove(input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateLatestMoveMutationVariables,
  APITypes.UpdateLatestMoveMutation
>;
export const createComment = /* GraphQL */ `mutation CreateComment($input: CreateCommentInput!) {
  createComment(input: $input) {
    SessionID
    SK
    Comment
    Author
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateCommentMutationVariables,
  APITypes.CreateCommentMutation
>;
export const postQuestion = /* GraphQL */ `mutation PostQuestion(
  $SessionID: ID!
  $Comment: String!
  $Author: String!
  $Board: String!
  $ModelID: String!
) {
  postQuestion(
    SessionID: $SessionID
    Comment: $Comment
    Author: $Author
    Board: $Board
    ModelID: $ModelID
  ) {
    SessionID
    SK
    Comment
    Author
    __typename
  }
}
` as GeneratedMutation<
  APITypes.PostQuestionMutationVariables,
  APITypes.PostQuestionMutation
>;
