import { getAccessToken } from './authorizedClient';

export type ChatSocketStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  | 'error';

export interface ChatSocketMessage {
  id: number;
  chat_id: number;
  sender_id: number;
  message_type: string;
  text: string | null;
  reply_to_message_id: number | null;
  is_edited: boolean;
  is_deleted: boolean;
  is_pinned: boolean;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
}

export interface ConnectionEstablishedData {
  chat_id: number;
  user_id: number;
  online_user_ids: number[];
}

export interface PresenceEventData {
  chat_id: number;
  user_id: number;
}

export interface TypingEventData {
  chat_id: number;
  user_id: number;
}

export interface MessageReadEventData {
  chat_id: number;
  message_id: number;
  user_id: number;
  read_at: string;
}

export interface ChatReadEventData {
  chat_id: number;
  user_id: number;
  last_read_message_id: number;
  read_at: string;
}

export interface ChatSocketCallbacks {
  onStatusChange?: (status: ChatSocketStatus) => void;

  onConnected?: (data: ConnectionEstablishedData) => void;
  onDisconnected?: () => void;

  onMessageCreated?: (message: ChatSocketMessage) => void;
  onMessageUpdated?: (message: ChatSocketMessage) => void;
  onMessageDeleted?: (message: ChatSocketMessage) => void;
  onMessagePinned?: (message: ChatSocketMessage) => void;
  onMessageUnpinned?: (message: ChatSocketMessage) => void;

  onMessageRead?: (data: MessageReadEventData) => void;
  onChatRead?: (data: ChatReadEventData) => void;

  onUserOnline?: (data: PresenceEventData) => void;
  onUserOffline?: (data: PresenceEventData) => void;

  onTypingStarted?: (data: TypingEventData) => void;
  onTypingStopped?: (data: TypingEventData) => void;

  onError?: (message: string) => void;
}

interface ChatSocketOptions extends ChatSocketCallbacks {
  chatId: number;
  userId: number;
  reconnect?: boolean;
  reconnectDelay?: number;
  maxReconnectDelay?: number;
  pingInterval?: number;
}

interface WebSocketEvent<T = unknown> {
  event: string;
  data: T;
}

const getDefaultWebSocketBaseUrl = (): string => {
  const configuredUrl = import.meta.env.VITE_CHAT_WS_URL as
    | string
    | undefined;

  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, '');
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}`;
};

export class ChatSocket {
  private readonly chatId: number;
  private readonly callbacks: ChatSocketCallbacks;

  private readonly reconnectEnabled: boolean;
  private readonly reconnectDelay: number;
  private readonly maxReconnectDelay: number;
  private readonly pingInterval: number;

  private socket: WebSocket | null = null;

  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;

  private reconnectAttempt = 0;
  private manualDisconnect = false;
  private authenticationRejected = false;

  constructor(options: ChatSocketOptions) {
    this.chatId = options.chatId;
    // Kept in the public options for caller compatibility; identity comes from JWT.
    void options.userId;

    this.reconnectEnabled = options.reconnect ?? true;
    this.reconnectDelay = options.reconnectDelay ?? 1_000;
    this.maxReconnectDelay = options.maxReconnectDelay ?? 15_000;
    this.pingInterval = options.pingInterval ?? 20_000;

    this.callbacks = {
      onStatusChange: options.onStatusChange,
      onConnected: options.onConnected,
      onDisconnected: options.onDisconnected,

      onMessageCreated: options.onMessageCreated,
      onMessageUpdated: options.onMessageUpdated,
      onMessageDeleted: options.onMessageDeleted,
      onMessagePinned: options.onMessagePinned,
      onMessageUnpinned: options.onMessageUnpinned,

      onMessageRead: options.onMessageRead,
      onChatRead: options.onChatRead,

      onUserOnline: options.onUserOnline,
      onUserOffline: options.onUserOffline,

      onTypingStarted: options.onTypingStarted,
      onTypingStopped: options.onTypingStopped,

      onError: options.onError,
    };
  }

  public connect(): void {
    if (
      this.socket?.readyState === WebSocket.OPEN ||
      this.socket?.readyState === WebSocket.CONNECTING
    ) {
      return;
    }

    this.manualDisconnect = false;
    this.authenticationRejected = false;
    this.clearReconnectTimer();

    const status: ChatSocketStatus =
      this.reconnectAttempt > 0 ? 'reconnecting' : 'connecting';

    this.callbacks.onStatusChange?.(status);

    const socketUrl = this.buildSocketUrl();
    const accessToken = getAccessToken();
    if (!accessToken) {
      this.authenticationRejected = true;
      this.callbacks.onStatusChange?.('error');
      this.callbacks.onError?.('?????????? ??????????? ????');
      return;
    }

    try {
      // Browser WebSocket cannot set Authorization headers. The token is sent
      // through a negotiated subprotocol and never placed in the URL/query.
      this.socket = new WebSocket(socketUrl, [
        'vshp.jwt',
        `vshp.jwt.${accessToken}`,
      ]);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Не удалось создать WebSocket-соединение';

      this.callbacks.onStatusChange?.('error');
      this.callbacks.onError?.(message);

      this.scheduleReconnect();
      return;
    }

    this.socket.onopen = () => {
      this.reconnectAttempt = 0;

      this.callbacks.onStatusChange?.('connected');

      this.startPing();
    };

    this.socket.onmessage = (event: MessageEvent<string>) => {
      this.handleIncomingMessage(event.data);
    };

    this.socket.onerror = () => {
      this.callbacks.onStatusChange?.('error');
      this.callbacks.onError?.('Ошибка WebSocket-соединения');
    };

    this.socket.onclose = (event: CloseEvent) => {
      this.stopPing();
      this.socket = null;

      const authenticationRejected =
        event.code === 4401 || event.code === 4403;
      if (authenticationRejected) {
        this.authenticationRejected = true;
        this.callbacks.onStatusChange?.('error');
        this.callbacks.onError?.(
          event.code === 4401
            ? '??????????? ???? ?????????'
            : '??? ??????? ? ????? ????'
        );
      } else {
        this.callbacks.onStatusChange?.('disconnected');
        this.callbacks.onDisconnected?.();
      }

      if (!this.manualDisconnect && !this.authenticationRejected) {
        this.scheduleReconnect();
      }
    };
  }

  public disconnect(): void {
    this.manualDisconnect = true;

    this.clearReconnectTimer();
    this.stopPing();

    if (this.socket) {
      this.socket.onopen = null;
      this.socket.onmessage = null;
      this.socket.onerror = null;
      this.socket.onclose = null;

      if (
        this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING
      ) {
        this.socket.close(1000, 'Client disconnected');
      }

      this.socket = null;
    }

    this.callbacks.onStatusChange?.('disconnected');
  }

  public isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  public sendTypingStarted(): void {
    this.sendEvent('typing.started');
  }

  public sendTypingStopped(): void {
    this.sendEvent('typing.stopped');
  }

  public sendPing(): void {
    this.sendEvent('ping');
  }

  private buildSocketUrl(): string {
    const baseUrl = getDefaultWebSocketBaseUrl();

    const url = new URL(
      `${baseUrl}/ws/chats/${this.chatId}`,
    );

    return url.toString();
  }

  private sendEvent(event: string): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return false;
    }

    this.socket.send(
      JSON.stringify({
        event,
      }),
    );

    return true;
  }

  private handleIncomingMessage(rawData: string): void {
    let incomingEvent: WebSocketEvent;

    try {
      incomingEvent = JSON.parse(rawData) as WebSocketEvent;
    } catch {
      this.callbacks.onError?.(
        'Сервер отправил некорректное WebSocket-сообщение',
      );

      return;
    }

    switch (incomingEvent.event) {
      case 'connection.established':
        this.callbacks.onConnected?.(
          incomingEvent.data as ConnectionEstablishedData,
        );
        break;

      case 'message.created':
        this.callbacks.onMessageCreated?.(
          incomingEvent.data as ChatSocketMessage,
        );
        break;

      case 'message.updated':
        this.callbacks.onMessageUpdated?.(
          incomingEvent.data as ChatSocketMessage,
        );
        break;

      case 'message.deleted':
        this.callbacks.onMessageDeleted?.(
          incomingEvent.data as ChatSocketMessage,
        );
        break;

      case 'message.pinned':
        this.callbacks.onMessagePinned?.(
          incomingEvent.data as ChatSocketMessage,
        );
        break;

      case 'message.unpinned':
        this.callbacks.onMessageUnpinned?.(
          incomingEvent.data as ChatSocketMessage,
        );
        break;

      case 'message.read':
        this.callbacks.onMessageRead?.(
          incomingEvent.data as MessageReadEventData,
        );
        break;

      case 'chat.read':
        this.callbacks.onChatRead?.(
          incomingEvent.data as ChatReadEventData,
        );
        break;

      case 'user.online':
        this.callbacks.onUserOnline?.(
          incomingEvent.data as PresenceEventData,
        );
        break;

      case 'user.offline':
        this.callbacks.onUserOffline?.(
          incomingEvent.data as PresenceEventData,
        );
        break;

      case 'typing.started':
        this.callbacks.onTypingStarted?.(
          incomingEvent.data as TypingEventData,
        );
        break;

      case 'typing.stopped':
        this.callbacks.onTypingStopped?.(
          incomingEvent.data as TypingEventData,
        );
        break;

      case 'pong':
        break;

      case 'error': {
        const errorData = incomingEvent.data as {
          message?: string;
        };

        this.callbacks.onError?.(
          errorData.message ?? 'Неизвестная WebSocket-ошибка',
        );
        break;
      }

      default:
        console.warn(
          '[ChatSocket] Неизвестное событие:',
          incomingEvent,
        );
    }
  }

  private scheduleReconnect(): void {
    if (
      !this.reconnectEnabled ||
      this.manualDisconnect ||
      this.reconnectTimer
    ) {
      return;
    }

    const delay = Math.min(
      this.reconnectDelay * 2 ** this.reconnectAttempt,
      this.maxReconnectDelay,
    );

    this.reconnectAttempt += 1;

    this.callbacks.onStatusChange?.('reconnecting');

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (!this.reconnectTimer) {
      return;
    }

    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }

  private startPing(): void {
    this.stopPing();

    this.pingTimer = setInterval(() => {
      this.sendPing();
    }, this.pingInterval);
  }

  private stopPing(): void {
    if (!this.pingTimer) {
      return;
    }

    clearInterval(this.pingTimer);
    this.pingTimer = null;
  }
}
