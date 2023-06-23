import {
  AsyncOperationStatus,
  ChatSchema,
  EntityOperationType,
  handleRequestError,
  handleValidationError,
  type AsyncOperation,
  type Chat,
  type RequestError,
  type ResponseList,
  type ValidationError,
} from '@shared';
import { toastStore } from '@skeletonlabs/skeleton';
import { derived, get, writable, type Writable } from 'svelte/store';
// import { auth } from './auth.store';
import { request, type RequestHelperError } from './helpers';

export type ChatOperation = AsyncOperation<
  Chat | string,
  ValidationError<typeof ChatSchema> | RequestError
>;

interface DataState {
  chat: Chat;
  list: {
    ids: string[];
    data: { [id: string]: Chat };
    total: number;
    perPage: number;
    status: AsyncOperationStatus;
    error: null | RequestHelperError;
  };
  operations: { [id: string]: { [key: string]: ChatOperation } };
}
interface ViewState {
  chat: Chat;
  list: {
    data: Chat[];
    status: AsyncOperationStatus;
    error: null | RequestHelperError;
  };
  operations: { [id: string]: { [key: string]: ChatOperation } };
  get: (id: string) => null | Chat;
  getOperation: (id: string, type: EntityOperationType) => null | ChatOperation;
}

const initialValue: DataState = {
  chat: ChatSchema.parse({}),
  list: {
    ids: [],
    data: {},
    total: 0,
    perPage: 0,
    status: AsyncOperationStatus.IDLE,
    error: null,
  },
  operations: {},
};

const dataStore = writable<DataState>(initialValue);

function mutate(state: Partial<DataState>) {
  dataStore.update(s => ({ ...s, ...state }));
  if (state.chat) {
    onMessageSubscribers.get(state.chat.id)?.forEach(subscriber => subscriber());
  }
}
function mutateList(state: Partial<DataState['list']>) {
  mutate({ list: { ...get(dataStore).list, ...state } });
}
function mutateOperation(chatId: string, type: EntityOperationType, state: Partial<ChatOperation>) {
  const operations = get(dataStore).operations;
  const chatOperations = operations[chatId] ?? {};
  const chatOperation = chatOperations[type.toString()] ?? {};
  const newOperationsState: DataState['operations'] = {
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

const viewStore = derived<Writable<DataState>, ViewState>(dataStore, state => ({
  chat: state.chat,
  list: {
    data: state.list.ids.map(id => state.list.data[id]),
    status: state.list.status,
    error: state.list.error,
  },
  operations: state.operations,
  get: (id: string) => state.list.data[id],
  getOperation: (id: string, type: EntityOperationType) => state.operations[id]?.[type] ?? null,
}));

const onMessageSubscribers = new Map<string, Set<() => void>>();

export const chats = {
  subscribe: viewStore.subscribe,
  fetchList: async (): Promise<void> => {
    const state = get(dataStore);
    // if list.status === in progress - do nothing
    if (state.list.status === AsyncOperationStatus.IN_PROGRESS) {
      return;
    }
    mutateList({ status: AsyncOperationStatus.IN_PROGRESS, error: null });
    const [error, list] = await request<ResponseList<Chat>>('/api/chats');
    mutateList({
      status: list ? AsyncOperationStatus.SUCCESS : AsyncOperationStatus.ERROR,
      ids: list ? list.data.map(s => s.id) : [],
      data: list ? list.data.reduce((acc, s) => ({ ...acc, [s.id]: s }), {}) : {},
      total: list ? list.total : 0,
      perPage: list ? list.perPage : 0,
      error,
    });
  },
  create: async (chat: Chat): Promise<void> => {
    const state = get(dataStore);
    // if create operation is in progress - do nothing
    const existingOperation = get(chats).getOperation(chat.id, EntityOperationType.CREATE);
    if (existingOperation?.status === AsyncOperationStatus.IN_PROGRESS) {
      return;
    }

    mutateOperation(chat.id, EntityOperationType.CREATE, {
      type: EntityOperationType.CREATE,
      payload: chat,
      status: AsyncOperationStatus.IN_PROGRESS,
      error: null,
    });

    const parseResult = ChatSchema.safeParse(chat);
    if (!parseResult.success) {
      mutateOperation(chat.id, EntityOperationType.CREATE, {
        status: AsyncOperationStatus.ERROR,
        error: handleValidationError(parseResult.error),
      });
      toastStore.trigger({
        message: 'Check fields correctness',
        background: 'variant-filled-warning',
      });
      return;
    }
    const payload = parseResult.data;

    const [error, createdChat] = await request<Chat>('/api/chats', 'POST', payload);
    // update operation status
    mutateOperation(chat.id, EntityOperationType.CREATE, {
      status: createdChat ? AsyncOperationStatus.SUCCESS : AsyncOperationStatus.ERROR,
      error: error ? handleRequestError(error) : null,
    });
    if (createdChat) {
      mutateList({
        ids: [createdChat.id, ...state.list.ids],
        data: { ...state.list.data, [createdChat.id]: createdChat },
      });
      toastStore.trigger({
        message: 'Chat created successfully',
        background: 'variant-filled-success',
      });
    } else {
      toastStore.trigger({
        message: 'Chat creation failed',
        background: 'variant-filled-warning',
      });
    }
  },
  update: async (chat: Chat): Promise<void> => {
    mutate({ chat });
    // // if update operation is in progress - do nothing
    // const existingOperation = get(chats).getOperation(chat.id, EntityOperationType.UPDATE);
    // if (existingOperation?.status === AsyncOperationStatus.IN_PROGRESS) {
    //   return;
    // }

    // mutateOperation(chat.id, {
    //   type: EntityOperationType.UPDATE,
    //   payload: chat,
    //   status: AsyncOperationStatus.IN_PROGRESS,
    //   error: null,
    // });

    // let parseResult = ChatSchema.safeParse(chat);
    // if (!parseResult.success) {
    //   mutateOperation(chat.id, {
    //     status: AsyncOperationStatus.ERROR,
    //     error: handleValidationError(parseResult.error),
    //   });
    //   toastStore.trigger({
    //     message: 'Check fields correctness',
    //     background: 'variant-filled-warning',
    //   });
    //   return;
    // }

    // parseResult = ChatSchema.safeParse(chat);
    // if (!parseResult.success) {
    //   mutateOperation(chat.id, {
    //     status: AsyncOperationStatus.ERROR,
    //     error: handleValidationError(parseResult.error),
    //   });
    //   toastStore.trigger({
    //     message: 'Check fields correctness',
    //     background: 'variant-filled-warning',
    //   });
    //   return;
    // }
    // const payload = parseResult.data;

    // const [error, updatedChat] = await request<Chat>(`/api/chats/${chat.id}`, 'PATCH', payload);

    // // update operation status
    // mutateOperation(chat.id, {
    //   status: updatedChat ? AsyncOperationStatus.SUCCESS : AsyncOperationStatus.ERROR,
    //   error: error ? handleRequestError(error) : null,
    // });

    // if (updatedChat) {
    //   mutateList({
    //     data: { ...state.list.data, [updatedChat.id]: updatedChat },
    //   });
    //   toastStore.trigger({
    //     message: 'Chat saved successfully',
    //     background: 'variant-filled-success',
    //   });
    // } else {
    //   toastStore.trigger({
    //     message: 'Chat save failed',
    //     background: 'variant-filled-warning',
    //   });
    // }
  },
  delete: async (id: string): Promise<void> => {
    // const state = get(dataStore);
    // // add delete operation to operations if operation with same id does not exists
    // const existingOperation = state.operations[id];
    // if (
    //   existingOperation &&
    //   existingOperation.type === EntityOperationType.DELETE &&
    //   existingOperation.status === AsyncOperationStatus.IN_PROGRESS
    // ) {
    //   return;
    // }
    // const chat = state.list.data[id];
    // if (!chat) {
    //   toastStore.trigger({
    //     message: `Chat "${id}" not found`,
    //     background: 'variant-filled-warning',
    //   });
    //   return;
    // }
    // toastStore.trigger({
    //   message: `Delete chat "${chat.title}"?`,
    //   action: {
    //     label: 'Yes',
    //     response: async () => {
    //       mutateOperation(id, {
    //         type: EntityOperationType.DELETE,
    //         payload: id,
    //         status: AsyncOperationStatus.IN_PROGRESS,
    //         error: null,
    //       });
    //       const [error] = await request(`/api/chats/${id}`, 'DELETE');
    //       // update operation status
    //       mutateOperation(id, {
    //         status: error ? AsyncOperationStatus.ERROR : AsyncOperationStatus.SUCCESS,
    //         error: error ? handleRequestError(error) : null,
    //       });
    //       if (error) {
    //         toastStore.trigger({
    //           message: 'Chat deletion failed',
    //           background: 'variant-filled-warning',
    //         });
    //       } else {
    //         // delete chat from list
    //         delete state.list.data[id];
    //         mutateList({
    //           ids: state.list.ids.filter(i => i !== id),
    //           data: state.list.data,
    //         });
    //         toastStore.trigger({
    //           message: 'Chat deleted successfully',
    //           background: 'variant-filled-success',
    //         });
    //       }
    //     },
    //   },
    //   background: 'variant-filled-error',
    // });
  },
  message: async (chat: Chat): Promise<void> => {
    const existingOperation = get(chats).getOperation(chat.id, EntityOperationType.UPDATE);
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
    const subscribers = onMessageSubscribers.get(chatId);
    if (subscribers) {
      subscribers.add(subscriber);
    } else {
      onMessageSubscribers.set(chatId, new Set([subscriber]));
    }
    return () => {
      const subscribers = onMessageSubscribers.get(chatId);
      if (subscribers) {
        subscribers.delete(subscriber);
      }
    };
  },
};

// function init() {
//   // if cookie with user.id exists - fetch user
//   if (!browser) {
//     return;
//   }
//   if (document.cookie.includes(USER_ID_COOKIE_NAME)) {
//     chats.fetchList();
//   }

//   auth.onAuthStateChange(user => {
//     if (user) {
//       const state = get(chats);
//       if (state.list.status === AsyncOperationStatus.IDLE) {
//         // to avoid double fetch
//         chats.fetchList();
//       }
//     } else {
//       mutate(initialValue);
//     }
//   });
// }

// init();
