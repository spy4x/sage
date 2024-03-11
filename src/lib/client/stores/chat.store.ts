import {
  AsyncOperationStatus,
  ChatSchema,
  EntityOperationType,
  handleRequestError,
  type AsyncOperation,
  type Chat,
  type RequestError,
  type ValidationError,
  Model,
  Role,
  PersonaIdLocalStorageKey,
} from '@shared';
import { get, writable } from 'svelte/store';
import { request } from './helpers';

export type ChatOperation = AsyncOperation<
  Chat | string,
  ValidationError<typeof ChatSchema> | RequestError
>;

interface State {
  chat: Chat;
  operations: { [id: string]: { [key: string]: ChatOperation } };
}

function generateInitialValue(): State {
  return {
    chat: ChatSchema.parse({}),
    operations: {},
  };
}

const store = writable<State>(generateInitialValue());

function mutate(update: Partial<State>) {
  const prevState = get(store);
  store.update(s => ({ ...s, ...update }));
  if (update.chat && prevState.chat.messages.length < update.chat.messages.length) {
    onMessageSubscribersMap.get(update.chat.id)?.forEach(subscriber => subscriber());
  }
}
function mutateOperation(chatId: string, type: EntityOperationType, state: Partial<ChatOperation>) {
  const operations = get(store).operations;
  const chatOperations = operations[chatId] ?? {};
  const chatOperation = chatOperations[type.toString()] ?? {};
  const newOperationsState: State['operations'] = {
    ...operations,
    [chatId]: {
      ...chatOperations,
      [type.toString()]: {
        ...chatOperation,
        ...state,
      },
    },
  };
  mutate({ operations: newOperationsState });
}

const onMessageSubscribersMap = new Map<string, Set<() => void>>();

export const chats = {
  subscribe: store.subscribe,
  getOperation: (id: string, type: EntityOperationType): null | ChatOperation =>
    get(store).operations[id]?.[type] ?? null,
  update: async (chat: Chat): Promise<void> => {
    mutate({ chat });
  },
  setModel: (model: Model): void => {
    mutate({ chat: { ...get(store).chat, model } });
  },
  setPersona: (personaId: number): void => {
    mutate({ chat: { ...get(store).chat, personaId } });
    localStorage.setItem(PersonaIdLocalStorageKey, personaId.toString());
  },
  message: async (chat: Chat): Promise<void> => {
    const existingOperation = chats.getOperation(chat.id, EntityOperationType.UPDATE);
    if (existingOperation?.status === AsyncOperationStatus.IN_PROGRESS) {
      return;
    }

    mutate({ chat });

    mutateOperation(chat.id, EntityOperationType.UPDATE, {
      type: EntityOperationType.UPDATE,
      payload: chat,
      status: AsyncOperationStatus.IN_PROGRESS,
      error: null,
    });

    const [error, message] = await request<unknown>(`/api/chats`, 'POST', chat);
    console.log('message', message);

    // update operation status
    mutateOperation(chat.id, EntityOperationType.UPDATE, {
      status: error ? AsyncOperationStatus.ERROR : AsyncOperationStatus.SUCCESS,
      error: error ? handleRequestError(error) : null,
    });
    if (!error) {
      //add empty message to chat
      chat.messages.push({ content: '', role: Role.ASSISTANT, id: '' });
      mutate({ chat });
    }

    const sse = new EventSource(`/api/chats/${chat.id}/stream`);
    sse.onmessage = e => {
      const { chunk } = JSON.parse(e.data);
      const chat = get(store).chat;
      //update last message in the chat
      chat.messages[chat.messages.length - 1].content += chunk;
      mutate({ chat });
    };
    // handle connection close
    sse.onerror = e => {
      console.log('SSE connection closed', e);
      sse.close();
    };
  },

  clear: (): void => {
    mutate({ chat: generateInitialValue().chat });
  },

  /** Subscribe to chat messages updates, returns Unsubscribe function */
  onNewMessage: (chatId: string, subscriber: () => void): (() => void) => {
    const subscribers = onMessageSubscribersMap.get(chatId);
    if (subscribers) {
      subscribers.add(subscriber);
    } else {
      onMessageSubscribersMap.set(chatId, new Set([subscriber]));
    }
    return () => {
      const subscribers = onMessageSubscribersMap.get(chatId);
      if (subscribers) {
        subscribers.delete(subscriber);
      }
    };
  },
};
