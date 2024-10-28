import { ProfileIcon } from "@/components/appHeaderComponent/components/ProfileIcon";
import { useUpdateMessage } from "@/controllers/API/queries/messages";
import useFlowsManagerStore from "@/stores/flowsManagerStore";
import { useUtilityStore } from "@/stores/utilityStore";
import Convert from "ansi-to-html";
import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import rehypeMathjax from "rehype-mathjax";
import remarkGfm from "remark-gfm";
import Robot from "../../../../../assets/robot.png";
import CodeTabsComponent from "../../../../../components/codeTabsComponent/ChatCodeTabComponent";
import IconComponent, { ForwardedIconComponent } from "../../../../../components/genericIconComponent";
import SanitizedHTMLWrapper from "../../../../../components/sanitizedHTMLWrapper";
import {
  EMPTY_INPUT_SEND_MESSAGE,
  EMPTY_OUTPUT_SEND_MESSAGE,
} from "../../../../../constants/constants";
import useAlertStore from "../../../../../stores/alertStore";
import { chatMessagePropsType } from "../../../../../types/components";
import { cn } from "../../../../../utils/utils";
import { EditMessageButton } from "./components/editMessageButton/newMessageOptions";
import EditMessageField from "./components/editMessageField/newEditMessageField";
import FileCardWrapper from "./components/fileCardWrapper";
import { ContentBlockError } from "@/types/chat";
import LogoIcon from "./components/chatLogoIcon";

export default function ChatMessage({
  chat,
  lockChat,
  lastMessage,
  updateChat,
  setLockChat,
}: chatMessagePropsType): JSX.Element {
  const convert = new Convert({ newline: true });
  const [hidden, setHidden] = useState(true);
  const template = chat.template;
  const [promptOpen, setPromptOpen] = useState(false);
  const [streamUrl, setStreamUrl] = useState(chat.stream_url);
  const flow_id = useFlowsManagerStore((state) => state.currentFlowId);
  // We need to check if message is not undefined because
  // we need to run .toString() on it
  const [chatMessage, setChatMessage] = useState(
    chat.message ? chat.message.toString() : "",
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const eventSource = useRef<EventSource | undefined>(undefined);
  const setErrorData = useAlertStore((state) => state.setErrorData);
  const chatMessageRef = useRef(chatMessage);
  const [editMessage, setEditMessage] = useState(false);

  useEffect(() => {
    const chatMessageString = chat.message ? chat.message.toString() : "";
    setChatMessage(chatMessageString);
  }, [chat]);
  const playgroundScrollBehaves = useUtilityStore(
    (state) => state.playgroundScrollBehaves,
  );
  const setPlaygroundScrollBehaves = useUtilityStore(
    (state) => state.setPlaygroundScrollBehaves,
  );

  // Sync ref with state
  useEffect(() => {
    chatMessageRef.current = chatMessage;
  }, [chatMessage]);

  // The idea now is that chat.stream_url MAY be a URL if we should stream the output of the chat
  // probably the message is empty when we have a stream_url
  // what we need is to update the chat_message with the SSE data
  const streamChunks = (url: string) => {
    setIsStreaming(true); // Streaming starts
    return new Promise<boolean>((resolve, reject) => {
      eventSource.current = new EventSource(url);
      eventSource.current.onmessage = (event) => {
        let parsedData = JSON.parse(event.data);
        if (parsedData.chunk) {
          setChatMessage((prev) => prev + parsedData.chunk);
        }
      };
      eventSource.current.onerror = (event: any) => {
        setIsStreaming(false);
        eventSource.current?.close();
        setStreamUrl(undefined);
        if (JSON.parse(event.data)?.error) {
          setErrorData({
            title: "Error on Streaming",
            list: [JSON.parse(event.data)?.error],
          });
        }
        updateChat(chat, chatMessageRef.current);
        reject(new Error("Streaming failed"));
      };
      eventSource.current.addEventListener("close", (event) => {
        setStreamUrl(undefined); // Update state to reflect the stream is closed
        eventSource.current?.close();
        setIsStreaming(false);
        resolve(true);
      });
    });
  };

  useEffect(() => {
    if (streamUrl && !isStreaming) {
      setLockChat(true);
      streamChunks(streamUrl)
        .then(() => {
          setLockChat(false);
          if (updateChat) {
            updateChat(chat, chatMessageRef.current);
          }
        })
        .catch((error) => {
          console.error(error);
          setLockChat(false);
        });
    }
  }, [streamUrl, chatMessage]);

  useEffect(() => {
    return () => {
      eventSource.current?.close();
    };
  }, []);

  useEffect(() => {
    const element = document.getElementById("last-chat-message");
    if (element) {
      if (playgroundScrollBehaves === "instant") {
        element.scrollIntoView({ behavior: playgroundScrollBehaves });
        setPlaygroundScrollBehaves("smooth");
      } else {
        setTimeout(() => {
          element.scrollIntoView({ behavior: playgroundScrollBehaves });
        }, 200);
      }
    }
  }, [lastMessage, chat]);

  let decodedMessage = chatMessage ?? "";
  try {
    decodedMessage = decodeURIComponent(chatMessage);
  } catch (e) {
    console.error(e);
  }
  const isEmpty = decodedMessage?.trim() === "";
  const { mutate: updateMessageMutation } = useUpdateMessage();

  const convertFiles = (
    files:
      | (
        | string
        | {
          path: string;
          type: string;
          name: string;
        }
      )[]
      | undefined,
  ) => {
    if (!files) return [];
    return files.map((file) => {
      if (typeof file === "string") {
        return file;
      }
      return file.path;
    });
  };

  const handleEditMessage = (message: string) => {
    updateMessageMutation(
      {
        message: {
          ...chat,
          files: convertFiles(chat.files),
          sender_name: chat.sender_name ?? "AI",
          text: message,
          sender: chat.isSend ? "User" : "Machine",
          flow_id,
          session_id: chat.session ?? "",
        },
        refetch: true,
      },
      {
        onSuccess: () => {
          updateChat(chat, message);
          setEditMessage(false);
        },
        onError: () => {
          setErrorData({
            title: "Error updating messages.",
          });
        },
      },
    );
  };
  const editedFlag = chat.edit ? (
    <div className="text-sm text-muted-foreground">(Edited)</div>
  ) : null;
  // Add this before the default return statement
  if (chat.category === "error") {
    const block = (chat.content_blocks?.[0]??{}) as ContentBlockError;
    return (
      <div className="flex-max-width py-6 pl-32 pr-9">
        <div className="mr-3 mt-1 flex w-11/12 pb-3">
          <div className="flex w-full gap-4 rounded-md p-2">
            <LogoIcon/>
            <div className="w-full rounded-md bg-error-red border border-error-red-border p-4 text-foreground">
              <div className="mb-2 flex gap-2 items-center">
                <ForwardedIconComponent className="h-6 w-6 text-destructive" name="OctagonAlert" />
                <span className="">An error stopped your flow.</span>
              </div>
              <div className="mb-4">
                <h3 className="font-semibold pb-3">Error details:</h3>
                <p className="pb-1">Component: {block.component}</p>
                {block.field && <p className="pb-1">Field: {block.field}</p>}
                {block.reason && <p className="">Reason: {block.reason}</p>}
              </div>
              {block.solution && <div>
                <h3 className="font-semibold pb-3">Steps to fix:</h3>
                <ol className="list-decimal pl-5">
                  <li>Check the component settings</li>
                  <li>Ensure all required fields are filled</li>
                  <li>Re-run your flow</li>
                </ol>
              </div>
              }
            </div>
          </div>
        </div>
      </div>
    );
  }
  console.log(chat);

  return (
    <>
      <div className="flex-max-width px-2 py-6 pl-32 pr-9">
        <div className={"mr-3 mt-1 flex w-11/12 pb-3"}>
          <div
            className={cn(
              "group relative flex w-full gap-4 rounded-md p-2",
              editMessage ? "" : "hover:bg-muted",
            )}
          >
            <div
              className={cn(
                "relative flex h-[32px] w-[32px] items-center justify-center overflow-hidden rounded-md text-2xl",
                !chat.isSend ? "bg-muted" : "border border-border",
              )}
              style={chat.meta_data?.background_color ? { backgroundColor: chat.meta_data.background_color } : {}}
            >
              {!chat.isSend ? (
                <div className="flex h-[18px] w-[18px] items-center justify-center">
                  {chat.meta_data?.icon ? (
                    chat.meta_data.icon.match(/[\u2600-\u27BF\uD83C-\uDBFF\uDC00-\uDFFF]/) ? (
                      <span className="">{chat.meta_data.icon}</span>
                    ) : (
                      <ForwardedIconComponent
                        name={chat.meta_data.icon}
                      />
                    )
                  ) : (
                    <img
                      src={Robot}
                      className="absolute scale-[60%] bottom-0 left-0"
                      alt={"robot_image"}
                    />
                  )}
                </div>
              ) : (
                <div className="flex h-[18px] w-[18px] items-center justify-center">
                  {chat.meta_data?.icon ? (
                    chat.meta_data.icon.match(/[\u2600-\u27BF\uD83C-\uDBFF\uDC00-\uDFFF]/) ? (
                      <div className="">{chat.meta_data.icon}</div>
                    ) : (
                      <ForwardedIconComponent
                        name={chat.meta_data.icon}
                      />
                    )
                  ) : (
                    <ProfileIcon />
                  )}
                </div>
              )}
            </div>
            <div className="flex w-[94%] flex-col">
              <div>
                <div
                  className={cn(
                    "flex items-baseline gap-3 max-w-full truncate pb-2 text-[14px] font-semibold",
                  )}
                  style={chat.meta_data?.text_color ? { color: chat.meta_data.text_color } : {}}
                  data-testid={
                    "sender_name_" + chat.sender_name?.toLocaleLowerCase()
                  }
                >
                  {chat.sender_name}
                  {chat.meta_data?.source && (
                    <div className="font-normal text-[14px] text-muted-foreground">
                      {chat.meta_data?.source}
                    </div>
                  )}
                </div>
              </div>
              {!chat.isSend ? (
                <div className="form-modal-chat-text-position flex-grow">
                  <div className="form-modal-chat-text">
                    {hidden && chat.thought && chat.thought !== "" && (
                      <div
                        onClick={(): void => setHidden((prev) => !prev)}
                        className="form-modal-chat-icon-div"
                      >
                        <IconComponent
                          name="MessageSquare"
                          className="form-modal-chat-icon"
                        />
                      </div>
                    )}
                    {chat.thought && chat.thought !== "" && !hidden && (
                      <SanitizedHTMLWrapper
                        className="form-modal-chat-thought"
                        content={convert.toHtml(chat.thought ?? "")}
                        onClick={() => setHidden((prev) => !prev)}
                      />
                    )}
                    {chat.thought && chat.thought !== "" && !hidden && (
                      <br></br>
                    )}
                    <div className="flex w-full flex-col">
                      <div
                        className="flex w-full flex-col dark:text-white"
                        data-testid="div-chat-message"
                      >
                        <div
                          data-testid={
                            "chat-message-" +
                            chat.sender_name +
                            "-" +
                            chatMessage
                          }
                          className="flex w-full flex-col"
                        >
                          {chatMessage === "" && lockChat ? (
                            <IconComponent
                              name="MoreHorizontal"
                              className="h-8 w-8 animate-pulse"
                            />
                          ) : (
                            <div className="w-full">
                              {editMessage ? (
                                <EditMessageField
                                  key={`edit-message-${chat.id}`}
                                  message={decodedMessage}
                                  onEdit={(message) => {
                                    handleEditMessage(message);
                                  }}
                                  onCancel={() => setEditMessage(false)}
                                />
                              ) : (
                                <>
                                  <div className="flex w-full gap-2 items-baseline">
                                    <Markdown
                                      remarkPlugins={[remarkGfm]}
                                      linkTarget="_blank"
                                      rehypePlugins={[rehypeMathjax]}
                                      className={cn(
                                        "markdown prose flex w-fit items-baseline max-w-full flex-col word-break-break-word dark:prose-invert",
                                        isEmpty
                                          ? "text-chat-trigger-disabled"
                                          : "text-primary",
                                      )}
                                      components={{
                                        p({ node, ...props }) {
                                          return (
                                            <span className="inline-block max-w-full w-fit">
                                              {props.children}
                                            </span>
                                          );
                                        },
                                        pre({ node, ...props }) {
                                          return <>{props.children}</>;
                                        },
                                        code: ({
                                          node,
                                          inline,
                                          className,
                                          children,
                                          ...props
                                        }) => {
                                          let content = children as string;
                                          if (
                                            Array.isArray(children) &&
                                            children.length === 1 &&
                                            typeof children[0] === "string"
                                          ) {
                                            content = children[0] as string;
                                          }
                                          if (typeof content === "string") {
                                            if (content.length) {
                                              if (content[0] === "▍") {
                                                return (
                                                  <span className="form-modal-markdown-span">
                                                  </span>
                                                );
                                              }
                                            }

                                            const match = /language-(\w+)/.exec(
                                              className || "",
                                            );

                                            return !inline ? (
                                              <CodeTabsComponent
                                                language={
                                                  (match && match[1]) || ""
                                                }
                                                code={String(content).replace(
                                                  /\n$/,
                                                  "",
                                                )}
                                              />
                                            ) : (
                                              <code
                                                className={className}
                                                {...props}
                                              >
                                                {content}
                                              </code>
                                            );
                                          }
                                        },
                                      }}
                                    >
                                      {isEmpty && !chat.stream_url
                                        ? EMPTY_OUTPUT_SEND_MESSAGE
                                        : chatMessage}
                                    </Markdown>
                                  {editedFlag}
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="form-modal-chat-text-position flex-grow">
                  {template ? (
                    <>
                      <button
                        className="form-modal-initial-prompt-btn"
                        onClick={() => {
                          setPromptOpen((old) => !old);
                        }}
                      >
                        Display Prompt
                        <IconComponent
                          name="ChevronDown"
                          className={`h-3 w-3 transition-all ${promptOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                      <span
                        className={cn(
                          "prose word-break-break-word dark:prose-invert",
                          !isEmpty
                            ? "text-primary"
                            : "text-chat-trigger-disabled",
                        )}
                      >
                        {promptOpen
                          ? template?.split("\n")?.map((line, index) => {
                            const regex = /{([^}]+)}/g;
                            let match;
                            let parts: Array<JSX.Element | string> = [];
                            let lastIndex = 0;
                            while ((match = regex.exec(line)) !== null) {
                              // Push text up to the match
                              if (match.index !== lastIndex) {
                                parts.push(
                                  line.substring(lastIndex, match.index),
                                );
                              }
                              // Push div with matched text
                              if (chat.message[match[1]]) {
                                parts.push(
                                  <span className="chat-message-highlight">
                                    {chat.message[match[1]]}
                                  </span>,
                                );
                              }

                              // Update last index
                              lastIndex = regex.lastIndex;
                            }
                            // Push text after the last match
                            if (lastIndex !== line.length) {
                              parts.push(line.substring(lastIndex));
                            }
                            return <p>{parts}</p>;
                          })
                          : isEmpty
                            ? EMPTY_INPUT_SEND_MESSAGE
                            : chatMessage}
                      </span>
                    </>
                  ) : (
                    <div className="flex w-full flex-col">
                      {editMessage ? (
                        <EditMessageField
                          key={`edit-message-${chat.id}`}
                          message={decodedMessage}
                          onEdit={(message) => {
                            handleEditMessage(message);
                          }}
                          onCancel={() => setEditMessage(false)}
                        />
                      ) : (
                        <>
                          <div
                            className={`flex items-baseline w-full gap-2 whitespace-pre-wrap break-words ${isEmpty
                              ? "text-chat-trigger-disabled"
                              : "text-primary"
                              }`}
                            data-testid={`chat-message-${chat.sender_name}-${chatMessage}`}
                          >
                            {isEmpty
                              ? EMPTY_INPUT_SEND_MESSAGE
                              : decodedMessage}
                          {editedFlag}
                          </div>
                        </>
                      )}
                      {chat.files && (
                        <div className="my-2 flex flex-col gap-5">
                          {chat.files?.map((file, index) => {
                            return (
                              <FileCardWrapper index={index} path={file} />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            {!editMessage && (
              <div className="invisible absolute -top-4 right-0 group-hover:visible">
                <div>
                  <EditMessageButton
                    onCopy={() => {
                      navigator.clipboard.writeText(chatMessage);
                    }}
                    onDelete={() => { }}
                    onEdit={() => setEditMessage(true)}
                    className="h-fit group-hover:visible"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div id={lastMessage ? "last-chat-message" : undefined} />
    </>
  );
}