import {
  Avatar,
  Message,
  MessageList,
  MessageInput,
  ChatContainer,
  TypingIndicator,
} from "@chatscope/chat-ui-kit-react";

import {
  onCreateComment,
  onPostQuestion,
} from "../../../../../graphql/subscriptions";

import {
  AlertProps,
  ButtonDropdown,
  Header,
} from "@cloudscape-design/components";

import { Avatar as AwsAvatar } from "@cloudscape-design/chat-components";
import { useListFoundationModels } from "../../../../Admin/api/queries";
import { sessionCookieName } from "../../../../../common/constant";
import { BoardItem } from "@cloudscape-design/board-components";
import { Dispatch, SetStateAction, useEffect } from "react";
import { usePostQuestion } from "../../../api/mutations";
import { useListComments } from "../../../api/queries";
import { fetchUserAttributes } from "aws-amplify/auth";
import { UseQueryResult } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { SessionRecord } from "../../../../../API";
import { generateClient } from "aws-amplify/api";
import { useCookies } from "react-cookie";

interface IChatWindow {
  alertUseState: [AlertProps, Dispatch<SetStateAction<AlertProps>>];
  session: UseQueryResult<SessionRecord>;
  board: any;
}

export const ChatWindow = (props: IChatWindow) => {
  const {
    board,
    session,
    alertUseState: [alertStatus, setAlertStatus],
  } = props;
  const [cookies] = useCookies([sessionCookieName]);

  const postQuestion = usePostQuestion(cookies.GenAIChessDemoSessionID);
  const comments = useListComments(cookies.GenAIChessDemoSessionID);

  const foundationModels = useListFoundationModels();

  const { control, resetField, handleSubmit } = useForm();

  const defaultModel = () => {
    if (session.data.White === "bedrock") {
      return foundationModels.data.find(
        ({ modelId }) => modelId === session.data.WhiteID
      );
    } else if (session.data.Black === "bedrock") {
      return foundationModels.data.find(
        ({ modelId }) => modelId === session.data.BlackID
      );
    } else {
      return foundationModels.data[0];
    }
  };

  const onSubmit = async (data) => {
    const { chatInput, chatModel } = data;
    const user = await fetchUserAttributes();

    try {
      await postQuestion.mutateAsync({
        Comment: chatInput,
        Author: `${user.email}#${board.activeColor}`,
        Board: board.fen,
        ModelID: chatModel.modelId,
      });

      resetField("chatInput");
    } catch (error) {
      setAlertStatus({
        ...alertStatus,
        children: <pre>{JSON.stringify(error, null, 2)}</pre>,
      });
    }
  };

  return (
    <form style={{ display: "contents" }} onSubmit={handleSubmit(onSubmit)}>
      <BoardItem
        disableContentPaddings
        header={
          <Header
            actions={
              foundationModels.data && (
                <Controller
                  name="chatModel"
                  control={control}
                  defaultValue={defaultModel()}
                  render={({ field: { onChange, value } }) => (
                    <ButtonDropdown
                      loading={foundationModels.isLoading}
                      items={
                        foundationModels.data?.map((x) => {
                          return {
                            id: x.modelId,
                            text: x.modelName,
                          };
                        }) ?? []
                      }
                      onItemClick={({ detail }) => {
                        const modelRecord = foundationModels.data.find(
                          ({ modelId }) => modelId === detail.id
                        );
                        onChange(modelRecord);
                      }}
                    >
                      {value.modelName}
                    </ButtonDropdown>
                  )}
                />
              )
            }
          >
            Chat
          </Header>
        }
        i18nStrings={{
          dragHandleAriaLabel: "Drag handle",
          resizeHandleAriaLabel: "Resize handle",
        }}
      >
        <Controller
          name="chatInput"
          control={control}
          defaultValue={null}
          render={({ field }) => (
            <div style={{ position: "relative", height: "100%" }}>
              <ChatContainer style={{ position: "absolute", width: "100%" }}>
                <MessageList
                  typingIndicator={
                    postQuestion.isPending && (
                      <TypingIndicator content="GenAI is thinking" />
                    )
                  }
                >
                  {(comments.data as any)?.map(
                    (msg: { SK: string; Author: string; Comment: string }) => {
                      return (
                        <Message
                          key={msg.SK}
                          model={{
                            position: "single",
                            sentTime: msg.SK,
                            sender: msg.Author,
                            message: msg.Comment,
                            direction: msg.Author.includes("@")
                              ? "outgoing"
                              : "incoming",
                          }}
                        >
                          <Avatar size="md">
                            <div
                              style={{
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {!msg.Author.includes("@") ? (
                                <AwsAvatar
                                  ariaLabel="Avatar of generative AI assistant"
                                  tooltipText="Generative AI assistant"
                                  iconName="gen-ai"
                                  color="gen-ai"
                                />
                              ) : (
                                <AwsAvatar
                                  ariaLabel="Avatar of human"
                                  tooltipText="Human"
                                />
                              )}
                            </div>
                          </Avatar>
                        </Message>
                      );
                    }
                  )}
                </MessageList>

                <MessageInput
                  {...field}
                  sendButton={false}
                  attachButton={false}
                  disabled={postQuestion.isPending}
                  onSend={() => handleSubmit(onSubmit)()}
                  placeholder="Type message here"
                />
              </ChatContainer>
            </div>
          )}
        />
      </BoardItem>

      <PageSubscriptions
        SessionID={cookies.GenAIChessDemoSessionID}
        comments={comments}
      />
    </form>
  );
};

const PageSubscriptions = ({ comments, SessionID }) => {
  const client = generateClient();

  useEffect(() => {
    const postQuestion = client
      .graphql({ query: onPostQuestion, variables: { SessionID } })
      .subscribe({ next: () => comments.refetch() });

    const createComment = client
      .graphql({ query: onCreateComment, variables: { SessionID } })
      .subscribe({ next: () => comments.refetch() });

    return () => {
      postQuestion.unsubscribe();
      createComment.unsubscribe();
    };
  }, []);

  return null;
};
