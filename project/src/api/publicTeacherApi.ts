const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:8080';

export interface PublicTeacher {
  id: number;
  user_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  about: string | null;
}

async function getErrorMessage(
  response: Response
): Promise<string> {
  try {
    const data = (await response.json()) as {
      detail?: string;
      message?: string;
    };

    return (
      data.detail ??
      data.message ??
      `Не удалось загрузить преподавателей: ${response.status}`
    );
  } catch {
    const text = await response.text();

    return (
      text ||
      `Не удалось загрузить преподавателей: ${response.status}`
    );
  }
}

export async function getPublicTeachers():
Promise<PublicTeacher[]> {
  const response = await fetch(
    `${API_URL}/api/v1/users/public/teachers`,
    {
      headers: {
        Accept: 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response)
    );
  }

  const data = (await response.json()) as
    | PublicTeacher[]
    | {
        items?: PublicTeacher[];
        teachers?: PublicTeacher[];
      };

  if (Array.isArray(data)) {
    return data;
  }

  return data.items ?? data.teachers ?? [];
}

export function getTeacherFullName(
  teacher: PublicTeacher
): string {
  /*
   * В текущей модели проекта:
   * user_name — имя;
   * first_name — фамилия;
   * last_name — отчество.
   */
  const fullName = [
    teacher.first_name,
    teacher.user_name,
    teacher.last_name,
  ]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(' ')
    .trim();

  return (
    fullName ||
    `Преподаватель №${teacher.id}`
  );
}

export function getTeacherInitials(
  teacher: PublicTeacher
): string {
  const values = [
    teacher.first_name,
    teacher.user_name,
    teacher.last_name,
  ]
    .map((value) => value?.trim())
    .filter(
      (value): value is string =>
        Boolean(value)
    );

  if (values.length >= 2) {
    return `${values[0][0]}${values[1][0]}`
      .toUpperCase();
  }

  if (values.length === 1) {
    return values[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return 'П';
}
