import {
  Avatar,
  Message,
  MessageList,
  ChatContainer,
  TypingIndicator,
} from "@chatscope/chat-ui-kit-react";

import { Avatar as AwsAvatar } from "@cloudscape-design/chat-components";
import { onCreateComment } from "../../../../graphql/subscriptions";
import { BoardItem } from "@cloudscape-design/board-components";
import { fetchUserAttributes } from "aws-amplify/auth";
import { Header } from "@cloudscape-design/components";
import { Controller, useForm } from "react-hook-form";
import { usePostQuestion } from "../../api/mutations";
import { useListComments } from "../../api/queries";
import { generateClient } from "aws-amplify/api";
import { useCookies } from "react-cookie";
import { useEffect } from "react";
import { sessionCookieName } from "../../../../common/constant";

interface IChatWindow {
  board: any;
}

export const ChatWindow = ({ board }: IChatWindow) => {
  const [cookies] = useCookies([sessionCookieName]);

  const comments = useListComments(cookies.GenAIChessDemoSessionID);

  const { mutateAsync, isPending } = usePostQuestion(
    cookies.GenAIChessDemoSessionID
  );
  const { control, resetField, handleSubmit } = useForm();

  const onSubmit = async (data) => {
    const { chatInput, chatModel } = data;
    const user = await fetchUserAttributes();

    await mutateAsync({
      Comment: chatInput,
      Author: `${user.email}#${board.activeColor}`,
      Board: board.fen,
      ModelID: chatModel.modelId,
    });

    resetField("chatInput");
  };

  return (
    <form style={{ display: "contents" }} onSubmit={handleSubmit(onSubmit)}>
      <BoardItem
        disableContentPaddings
        header={<Header>Chat</Header>}
        i18nStrings={{
          dragHandleAriaLabel: "Drag handle",
          resizeHandleAriaLabel: "Resize handle",
        }}
      >
        <Controller
          name="chatInput"
          control={control}
          defaultValue={null}
          render={() => (
            <div style={{ position: "relative", height: "100%" }}>
              <ChatContainer style={{ position: "absolute" }}>
                <MessageList
                  typingIndicator={
                    isPending && <TypingIndicator content="GenAI is thinking" />
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
    const createComment = client
      .graphql({ query: onCreateComment, variables: { SessionID } })
      .subscribe({ next: () => comments.refetch() });

    return () => {
      createComment.unsubscribe();
    };
  }, []);

  return null;
};
