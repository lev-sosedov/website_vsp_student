import {
  AlertCircle,
  CheckCircle2,
  DoorOpen,
  Loader2,
  Pencil,
  Plus,
  Power,
  RotateCcw,
  Save,
  Users,
  X,
} from 'lucide-react';

import {
  useCallback,
  useEffect,
  useState,
  type KeyboardEvent,
} from 'react';

import {
  activateRoom,
  createRoom,
  deactivateRoom,
  getRooms,
  updateRoom,
  type Room,
} from '../../../api/scheduleApi';

interface AdminBranchRoomsProps {
  branchId: number;
  branchIsActive: boolean;
}

function getErrorMessage(
  error: unknown
): string {
  return error instanceof Error
    ? error.message
    : 'Не удалось выполнить операцию с кабинетом';
}

export default function AdminBranchRooms({
  branchId,
  branchIsActive,
}: AdminBranchRoomsProps) {
  const [rooms, setRooms] = useState<
    Room[]
  >([]);
  const [isLoading, setIsLoading] =
    useState(true);
  const [error, setError] =
    useState<string | null>(null);
  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  const [isEditorOpen, setIsEditorOpen] =
    useState(false);
  const [editingRoom, setEditingRoom] =
    useState<Room | null>(null);
  const [name, setName] = useState('');
  const [capacity, setCapacity] =
    useState('');
  const [description, setDescription] =
    useState('');
  const [isSaving, setIsSaving] =
    useState(false);
  const [activeRoomId, setActiveRoomId] =
    useState<number | null>(null);

  const loadRooms = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const loadedRooms = await getRooms(
        branchId,
        null
      );

      setRooms(
        loadedRooms.sort((first, second) =>
          first.name.localeCompare(
            second.name,
            'ru'
          )
        )
      );
    } catch (loadError) {
      setRooms([]);
      setError(
        getErrorMessage(loadError)
      );
    } finally {
      setIsLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    setIsEditorOpen(false);
    setEditingRoom(null);
    setSuccessMessage(null);
    void loadRooms();
  }, [loadRooms]);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timerId = window.setTimeout(
      () => setSuccessMessage(null),
      3_000
    );

    return () =>
      window.clearTimeout(timerId);
  }, [successMessage]);

  const resetEditor = () => {
    setIsEditorOpen(false);
    setEditingRoom(null);
    setName('');
    setCapacity('');
    setDescription('');
  };

  const openCreateEditor = () => {
    setEditingRoom(null);
    setName('');
    setCapacity('');
    setDescription('');
    setError(null);
    setIsEditorOpen(true);
  };

  const openEditEditor = (room: Room) => {
    setEditingRoom(room);
    setName(room.name);
    setCapacity(
      room.capacity === null ||
        room.capacity === undefined
        ? ''
        : String(room.capacity)
    );
    setDescription(room.description ?? '');
    setError(null);
    setIsEditorOpen(true);
  };

  const handleSave = async () => {
    const normalizedName = name.trim();
    const normalizedCapacity =
      capacity.trim();
    const capacityNumber =
      normalizedCapacity === ''
        ? null
        : Number(normalizedCapacity);

    if (!normalizedName) {
      setError(
        'Укажите название или номер кабинета'
      );
      return;
    }

    if (
      capacityNumber !== null &&
      (!Number.isInteger(capacityNumber) ||
        capacityNumber < 1 ||
        capacityNumber > 1000)
    ) {
      setError(
        'Вместимость должна быть целым числом от 1 до 1000'
      );
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (editingRoom) {
        await updateRoom(editingRoom.id, {
          name: normalizedName,
          capacity: capacityNumber,
          description:
            description.trim() || null,
        });
        setSuccessMessage(
          'Кабинет обновлён'
        );
      } else {
        await createRoom({
          branch_id: branchId,
          name: normalizedName,
          capacity: capacityNumber,
          description:
            description.trim() || null,
        });
        setSuccessMessage('Кабинет создан');
      }

      resetEditor();
      await loadRooms();
    } catch (saveError) {
      setError(
        getErrorMessage(saveError)
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleActivity = async (
    room: Room
  ) => {
    setActiveRoomId(room.id);
    setError(null);

    try {
      if (room.is_active) {
        await deactivateRoom(room.id);
        setSuccessMessage(
          'Кабинет деактивирован'
        );
      } else {
        await activateRoom(room.id);
        setSuccessMessage(
          'Кабинет восстановлен'
        );
      }

      if (editingRoom?.id === room.id) {
        resetEditor();
      }

      await loadRooms();
    } catch (activityError) {
      setError(
        getErrorMessage(activityError)
      );
    } finally {
      setActiveRoomId(null);
    }
  };

  const handleEditorKeyDown = (
    event: KeyboardEvent<HTMLDivElement>
  ) => {
    if (event.key !== 'Enter') {
      return;
    }

    event.preventDefault();

    if (!isSaving) {
      void handleSave();
    }
  };

  return (
    <section className="mt-6 border-t border-gray-100 pt-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-gray-900">
            <DoorOpen className="h-4 w-4 text-red-600" />
            Кабинеты филиала
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            Всего: {rooms.length} · активных:{' '}
            {
              rooms.filter(
                (room) => room.is_active
              ).length
            }
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateEditor}
          disabled={
            !branchIsActive ||
            isSaving ||
            activeRoomId !== null
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          <Plus className="h-4 w-4" />
          Добавить кабинет
        </button>
      </div>

      {!branchIsActive && (
        <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Филиал закрыт. Восстановите его,
          чтобы создавать и активировать
          кабинеты.
        </p>
      )}

      {successMessage && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-green-100 bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {successMessage}
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isEditorOpen && (
        <div
          className="mt-4 rounded-xl border border-red-100 bg-red-50/40 p-4"
          onKeyDown={handleEditorKeyDown}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-gray-900">
              {editingRoom
                ? 'Изменение кабинета'
                : 'Новый кабинет'}
            </p>
            <button
              type="button"
              onClick={resetEditor}
              disabled={isSaving}
              className="rounded-lg p-1.5 text-gray-400 transition hover:bg-white hover:text-gray-700 disabled:opacity-50"
              aria-label="Закрыть форму кабинета"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="sm:col-span-2">
              <span className="text-xs font-medium text-gray-600">
                Название или номер
              </span>
              <input
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100"
                placeholder="Например, Кабинет 305"
                maxLength={100}
                disabled={isSaving}
              />
            </label>

            <label>
              <span className="text-xs font-medium text-gray-600">
                Вместимость
              </span>
              <input
                type="number"
                min={1}
                max={1000}
                step={1}
                value={capacity}
                onChange={(event) =>
                  setCapacity(
                    event.target.value
                  )
                }
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100"
                placeholder="Не указана"
                disabled={isSaving}
              />
            </label>

            <label className="sm:col-span-3">
              <span className="text-xs font-medium text-gray-600">
                Описание
              </span>
              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                className="mt-1.5 min-h-20 w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100"
                placeholder="Оборудование, назначение кабинета…"
                maxLength={2000}
                disabled={isSaving}
              />
            </label>
          </div>

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() =>
                void handleSave()
              }
              disabled={
                isSaving || !name.trim()
              }
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {editingRoom
                ? 'Сохранить кабинет'
                : 'Создать кабинет'}
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 max-h-64 overflow-y-auto overscroll-contain rounded-xl border border-gray-100">
        {isLoading ? (
          <div className="flex min-h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-red-600" />
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex min-h-32 flex-col items-center justify-center p-4 text-center">
            <DoorOpen className="h-7 w-7 text-gray-300" />
            <p className="mt-2 text-sm font-medium text-gray-600">
              Кабинетов пока нет
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-gray-900">
                      {room.name}
                    </p>
                    <span
                      className={`rounded-lg px-2 py-0.5 text-[11px] font-semibold ${
                        room.is_active
                          ? 'bg-green-50 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {room.is_active
                        ? 'Активен'
                        : 'Неактивен'}
                    </span>
                  </div>

                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {room.capacity
                        ? `до ${room.capacity} человек`
                        : 'Вместимость не указана'}
                    </span>
                    {room.description && (
                      <span className="max-w-md truncate">
                        {room.description}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      openEditEditor(room)
                    }
                    disabled={
                      isSaving ||
                      activeRoomId !== null
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Изменить
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void handleActivity(room)
                    }
                    disabled={
                      isSaving ||
                      activeRoomId !== null ||
                      (!room.is_active &&
                        !branchIsActive)
                    }
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${
                      room.is_active
                        ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                        : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    {activeRoomId ===
                    room.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : room.is_active ? (
                      <Power className="h-3.5 w-3.5" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5" />
                    )}
                    {room.is_active
                      ? 'Деактивировать'
                      : 'Восстановить'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
