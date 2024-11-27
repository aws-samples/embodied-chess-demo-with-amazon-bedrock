/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type CreateSessionInput = {
  SessionID: string,
  White: string,
  WhiteID?: string | null,
  Black: string,
  BlackID?: string | null,
  BackgroundSrc?: string | null,
};

export type SessionRecord = {
  __typename: "SessionRecord",
  SessionID: string,
  SK?: string | null,
  Type?: string | null,
  TimeStamp?: string | null,
  White?: string | null,
  WhiteID?: string | null,
  Black?: string | null,
  BlackID?: string | null,
  GameStatus?: string | null,
  Error?: string | null,
  Cause?: string | null,
  BackgroundSrc?: string | null,
};

export type UpdateSessionInput = {
  SessionID: string,
  White?: string | null,
  WhiteID?: string | null,
  Black?: string | null,
  BlackID?: string | null,
  GameStatus?: string | null,
  Error?: string | null,
  Cause?: string | null,
};

export type UpdateGameStatusInput = {
  SessionID: string,
  GameStatus?: string | null,
};

export type DeleteSessionInput = {
  SessionID: string,
};

export type HumanNewMoveInput = {
  SessionID: string,
  Action: string,
  Move: string,
};

export type MoveRecord = {
  __typename: "MoveRecord",
  SessionID: string,
  SK?: string | null,
  Action?: string | null,
  Move?: string | null,
  MoveCount?: number | null,
  TimeStamp?: string | null,
  GameWinner?: string | null,
  SfnExecutionId?: string | null,
  TaskToken?: string | null,
  SanList?: string | null,
  SuggestedMove?: string | null,
};

export type UpdateLatestMoveInput = {
  SessionID: string,
  Action?: string | null,
  Move?: string | null,
  MoveCount?: number | null,
  GameWinner?: string | null,
  SfnExecutionId?: string | null,
  TaskToken?: string | null,
  SanList?: string | null,
  SuggestedMove?: string | null,
};

export type CreateCommentInput = {
  SessionID: string,
  Comment: string,
  Author: string,
};

export type Comment = {
  __typename: "Comment",
  SessionID: string,
  SK?: string | null,
  Comment?: string | null,
  Author?: string | null,
};

export type SessionConnection = {
  __typename: "SessionConnection",
  items?:  Array<SessionRecord | null > | null,
  nextToken?: string | null,
};

export type MoveRecordConnection = {
  __typename: "MoveRecordConnection",
  items:  Array<MoveRecord | null >,
  nextToken?: string | null,
};

export type CreateSessionMutationVariables = {
  input: CreateSessionInput,
};

export type CreateSessionMutation = {
  createSession?:  {
    __typename: "SessionRecord",
    SessionID: string,
    SK?: string | null,
    Type?: string | null,
    TimeStamp?: string | null,
    White?: string | null,
    WhiteID?: string | null,
    Black?: string | null,
    BlackID?: string | null,
    GameStatus?: string | null,
    Error?: string | null,
    Cause?: string | null,
    BackgroundSrc?: string | null,
  } | null,
};

export type UpdateSessionMutationVariables = {
  input: UpdateSessionInput,
};

export type UpdateSessionMutation = {
  updateSession?:  {
    __typename: "SessionRecord",
    SessionID: string,
    SK?: string | null,
    Type?: string | null,
    TimeStamp?: string | null,
    White?: string | null,
    WhiteID?: string | null,
    Black?: string | null,
    BlackID?: string | null,
    GameStatus?: string | null,
    Error?: string | null,
    Cause?: string | null,
    BackgroundSrc?: string | null,
  } | null,
};

export type UpdateGameStatusMutationVariables = {
  input: UpdateGameStatusInput,
};

export type UpdateGameStatusMutation = {
  updateGameStatus?:  {
    __typename: "SessionRecord",
    SessionID: string,
    SK?: string | null,
    Type?: string | null,
    TimeStamp?: string | null,
    White?: string | null,
    WhiteID?: string | null,
    Black?: string | null,
    BlackID?: string | null,
    GameStatus?: string | null,
    Error?: string | null,
    Cause?: string | null,
    BackgroundSrc?: string | null,
  } | null,
};

export type DeleteSessionMutationVariables = {
  input: DeleteSessionInput,
};

export type DeleteSessionMutation = {
  deleteSession?:  {
    __typename: "SessionRecord",
    SessionID: string,
    SK?: string | null,
    Type?: string | null,
    TimeStamp?: string | null,
    White?: string | null,
    WhiteID?: string | null,
    Black?: string | null,
    BlackID?: string | null,
    GameStatus?: string | null,
    Error?: string | null,
    Cause?: string | null,
    BackgroundSrc?: string | null,
  } | null,
};

export type VerifySessionMutationVariables = {
  SessionID: string,
};

export type VerifySessionMutation = {
  verifySession?: boolean | null,
};

export type HumanNewMoveMutationVariables = {
  input: HumanNewMoveInput,
};

export type HumanNewMoveMutation = {
  humanNewMove?:  {
    __typename: "MoveRecord",
    SessionID: string,
    SK?: string | null,
    Action?: string | null,
    Move?: string | null,
    MoveCount?: number | null,
    TimeStamp?: string | null,
    GameWinner?: string | null,
    SfnExecutionId?: string | null,
    TaskToken?: string | null,
    SanList?: string | null,
    SuggestedMove?: string | null,
  } | null,
};

export type UpdateLatestMoveMutationVariables = {
  input: UpdateLatestMoveInput,
};

export type UpdateLatestMoveMutation = {
  updateLatestMove?:  {
    __typename: "MoveRecord",
    SessionID: string,
    SK?: string | null,
    Action?: string | null,
    Move?: string | null,
    MoveCount?: number | null,
    TimeStamp?: string | null,
    GameWinner?: string | null,
    SfnExecutionId?: string | null,
    TaskToken?: string | null,
    SanList?: string | null,
    SuggestedMove?: string | null,
  } | null,
};

export type CreateCommentMutationVariables = {
  input: CreateCommentInput,
};

export type CreateCommentMutation = {
  createComment?:  {
    __typename: "Comment",
    SessionID: string,
    SK?: string | null,
    Comment?: string | null,
    Author?: string | null,
  } | null,
};

export type PostQuestionMutationVariables = {
  SessionID: string,
  Comment: string,
  Author: string,
  Board: string,
  ModelID: string,
};

export type PostQuestionMutation = {
  postQuestion?:  {
    __typename: "Comment",
    SessionID: string,
    SK?: string | null,
    Comment?: string | null,
    Author?: string | null,
  } | null,
};

export type GetSessionQueryVariables = {
  SessionID: string,
};

export type GetSessionQuery = {
  getSession?:  {
    __typename: "SessionRecord",
    SessionID: string,
    SK?: string | null,
    Type?: string | null,
    TimeStamp?: string | null,
    White?: string | null,
    WhiteID?: string | null,
    Black?: string | null,
    BlackID?: string | null,
    GameStatus?: string | null,
    Error?: string | null,
    Cause?: string | null,
    BackgroundSrc?: string | null,
  } | null,
};

export type ListActiveSessionsQueryVariables = {
  nextToken?: string | null,
};

export type ListActiveSessionsQuery = {
  listActiveSessions?:  {
    __typename: "SessionConnection",
    items?:  Array< {
      __typename: "SessionRecord",
      SessionID: string,
      SK?: string | null,
      Type?: string | null,
      TimeStamp?: string | null,
      White?: string | null,
      WhiteID?: string | null,
      Black?: string | null,
      BlackID?: string | null,
      GameStatus?: string | null,
      Error?: string | null,
      Cause?: string | null,
      BackgroundSrc?: string | null,
    } | null > | null,
    nextToken?: string | null,
  } | null,
};

export type ListGamesByMoveCountQueryVariables = {
  nextToken?: string | null,
};

export type ListGamesByMoveCountQuery = {
  listGamesByMoveCount?:  Array< {
    __typename: "MoveRecord",
    SessionID: string,
    SK?: string | null,
    Action?: string | null,
    Move?: string | null,
    MoveCount?: number | null,
    TimeStamp?: string | null,
    GameWinner?: string | null,
    SfnExecutionId?: string | null,
    TaskToken?: string | null,
    SanList?: string | null,
    SuggestedMove?: string | null,
  } | null > | null,
};

export type GetMovesQueryVariables = {
  SessionID: string,
  limit?: number | null,
  nextToken?: string | null,
};

export type GetMovesQuery = {
  getMoves?:  {
    __typename: "MoveRecordConnection",
    items:  Array< {
      __typename: "MoveRecord",
      SessionID: string,
      SK?: string | null,
      Action?: string | null,
      Move?: string | null,
      MoveCount?: number | null,
      TimeStamp?: string | null,
      GameWinner?: string | null,
      SfnExecutionId?: string | null,
      TaskToken?: string | null,
      SanList?: string | null,
      SuggestedMove?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetLatestMoveQueryVariables = {
  SessionID?: string | null,
};

export type GetLatestMoveQuery = {
  getLatestMove?:  {
    __typename: "MoveRecord",
    SessionID: string,
    SK?: string | null,
    Action?: string | null,
    Move?: string | null,
    MoveCount?: number | null,
    TimeStamp?: string | null,
    GameWinner?: string | null,
    SfnExecutionId?: string | null,
    TaskToken?: string | null,
    SanList?: string | null,
    SuggestedMove?: string | null,
  } | null,
};

export type ListCommentsQueryVariables = {
  SessionID: string,
};

export type ListCommentsQuery = {
  listComments?:  Array< {
    __typename: "Comment",
    SessionID: string,
    SK?: string | null,
    Comment?: string | null,
    Author?: string | null,
  } | null > | null,
};

export type OnCreateSessionSubscriptionVariables = {
  SessionID?: string | null,
  SK?: string | null,
  Type?: string | null,
  GameStatus?: string | null,
};

export type OnCreateSessionSubscription = {
  onCreateSession?:  {
    __typename: "SessionRecord",
    SessionID: string,
    SK?: string | null,
    Type?: string | null,
    TimeStamp?: string | null,
    White?: string | null,
    WhiteID?: string | null,
    Black?: string | null,
    BlackID?: string | null,
    GameStatus?: string | null,
    Error?: string | null,
    Cause?: string | null,
    BackgroundSrc?: string | null,
  } | null,
};

export type OnUpdateSessionSubscriptionVariables = {
  SessionID?: string | null,
  SK?: string | null,
};

export type OnUpdateSessionSubscription = {
  onUpdateSession?:  {
    __typename: "SessionRecord",
    SessionID: string,
    SK?: string | null,
    Type?: string | null,
    TimeStamp?: string | null,
    White?: string | null,
    WhiteID?: string | null,
    Black?: string | null,
    BlackID?: string | null,
    GameStatus?: string | null,
    Error?: string | null,
    Cause?: string | null,
    BackgroundSrc?: string | null,
  } | null,
};

export type OnUpdateGameStatusSubscriptionVariables = {
  SessionID?: string | null,
  SK?: string | null,
  Type?: string | null,
  GameStatus?: string | null,
};

export type OnUpdateGameStatusSubscription = {
  onUpdateGameStatus?:  {
    __typename: "SessionRecord",
    SessionID: string,
    SK?: string | null,
    Type?: string | null,
    TimeStamp?: string | null,
    White?: string | null,
    WhiteID?: string | null,
    Black?: string | null,
    BlackID?: string | null,
    GameStatus?: string | null,
    Error?: string | null,
    Cause?: string | null,
    BackgroundSrc?: string | null,
  } | null,
};

export type OnDeleteSessionSubscriptionVariables = {
  SessionID?: string | null,
  SK?: string | null,
  Type?: string | null,
  GameStatus?: string | null,
};

export type OnDeleteSessionSubscription = {
  onDeleteSession?:  {
    __typename: "SessionRecord",
    SessionID: string,
    SK?: string | null,
    Type?: string | null,
    TimeStamp?: string | null,
    White?: string | null,
    WhiteID?: string | null,
    Black?: string | null,
    BlackID?: string | null,
    GameStatus?: string | null,
    Error?: string | null,
    Cause?: string | null,
    BackgroundSrc?: string | null,
  } | null,
};

export type OnUpdateLatestMoveSubscriptionVariables = {
  SessionID?: string | null,
  Action?: string | null,
  Move?: string | null,
  SK?: string | null,
  SfnExecutionId?: string | null,
};

export type OnUpdateLatestMoveSubscription = {
  onUpdateLatestMove?:  {
    __typename: "MoveRecord",
    SessionID: string,
    SK?: string | null,
    Action?: string | null,
    Move?: string | null,
    MoveCount?: number | null,
    TimeStamp?: string | null,
    GameWinner?: string | null,
    SfnExecutionId?: string | null,
    TaskToken?: string | null,
    SanList?: string | null,
    SuggestedMove?: string | null,
  } | null,
};

export type OnCreateCommentSubscriptionVariables = {
  SessionID?: string | null,
  SK?: string | null,
  Comment?: string | null,
  Author?: string | null,
};

export type OnCreateCommentSubscription = {
  onCreateComment?:  {
    __typename: "Comment",
    SessionID: string,
    SK?: string | null,
    Comment?: string | null,
    Author?: string | null,
  } | null,
};

export type OnPostQuestionSubscriptionVariables = {
  SessionID?: string | null,
};

export type OnPostQuestionSubscription = {
  onPostQuestion?:  {
    __typename: "Comment",
    SessionID: string,
    SK?: string | null,
    Comment?: string | null,
    Author?: string | null,
  } | null,
};
