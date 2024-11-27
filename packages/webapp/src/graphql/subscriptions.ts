/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedSubscription<InputType, OutputType> = string & {
  __generatedSubscriptionInput: InputType;
  __generatedSubscriptionOutput: OutputType;
};

export const onCreateSession = /* GraphQL */ `subscription OnCreateSession(
  $SessionID: String
  $SK: String
  $Type: String
  $GameStatus: String
) {
  onCreateSession(
    SessionID: $SessionID
    SK: $SK
    Type: $Type
    GameStatus: $GameStatus
  ) {
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
` as GeneratedSubscription<
  APITypes.OnCreateSessionSubscriptionVariables,
  APITypes.OnCreateSessionSubscription
>;
export const onUpdateSession = /* GraphQL */ `subscription OnUpdateSession($SessionID: String, $SK: String) {
  onUpdateSession(SessionID: $SessionID, SK: $SK) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateSessionSubscriptionVariables,
  APITypes.OnUpdateSessionSubscription
>;
export const onUpdateGameStatus = /* GraphQL */ `subscription OnUpdateGameStatus(
  $SessionID: String
  $SK: String
  $Type: String
  $GameStatus: String
) {
  onUpdateGameStatus(
    SessionID: $SessionID
    SK: $SK
    Type: $Type
    GameStatus: $GameStatus
  ) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateGameStatusSubscriptionVariables,
  APITypes.OnUpdateGameStatusSubscription
>;
export const onDeleteSession = /* GraphQL */ `subscription OnDeleteSession(
  $SessionID: String
  $SK: String
  $Type: String
  $GameStatus: String
) {
  onDeleteSession(
    SessionID: $SessionID
    SK: $SK
    Type: $Type
    GameStatus: $GameStatus
  ) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteSessionSubscriptionVariables,
  APITypes.OnDeleteSessionSubscription
>;
export const onUpdateLatestMove = /* GraphQL */ `subscription OnUpdateLatestMove(
  $SessionID: String
  $Action: String
  $Move: String
  $SK: String
  $SfnExecutionId: String
) {
  onUpdateLatestMove(
    SessionID: $SessionID
    Action: $Action
    Move: $Move
    SK: $SK
    SfnExecutionId: $SfnExecutionId
  ) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateLatestMoveSubscriptionVariables,
  APITypes.OnUpdateLatestMoveSubscription
>;
export const onCreateComment = /* GraphQL */ `subscription OnCreateComment(
  $SessionID: String
  $SK: String
  $Comment: String
  $Author: String
) {
  onCreateComment(
    SessionID: $SessionID
    SK: $SK
    Comment: $Comment
    Author: $Author
  ) {
    SessionID
    SK
    Comment
    Author
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateCommentSubscriptionVariables,
  APITypes.OnCreateCommentSubscription
>;
export const onPostQuestion = /* GraphQL */ `subscription OnPostQuestion($SessionID: String) {
  onPostQuestion(SessionID: $SessionID) {
    SessionID
    SK
    Comment
    Author
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnPostQuestionSubscriptionVariables,
  APITypes.OnPostQuestionSubscription
>;
