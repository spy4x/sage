import {
  AsyncOperationStatus,
  ChatSchema,
  EntityOperationType,
  handleRequestError,
  type AsyncOperation,
  type Chat,
  type RequestError,
  type ValidationError,
} from '@shared';
import { toastStore } from '@skeletonlabs/skeleton';
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

const initialValue: State = {
  chat: ChatSchema.parse({}),
  operations: {},
};

const store = writable<State>(initialValue);

function mutate(state: Partial<State>) {
  store.update(s => ({ ...s, ...state }));
  if (state.chat) {
    onMessageSubscribersMap.get(state.chat.id)?.forEach(subscriber => subscriber());
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

    const [error, updatedChat] = await request<Chat>(`/api/chats`, 'POST', chat);

    // update operation status
    mutateOperation(chat.id, EntityOperationType.UPDATE, {
      status: updatedChat ? AsyncOperationStatus.SUCCESS : AsyncOperationStatus.ERROR,
      error: error ? handleRequestError(error) : null,
    });

    if (updatedChat) {
      mutate({ chat: updatedChat });
    } else {
      toastStore.trigger({
        message: 'Message sending failed',
        background: 'variant-filled-warning',
      });
    }
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
