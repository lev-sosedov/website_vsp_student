const API_URL =
  import.meta.env.VITE_API_URL ||
  '';

interface PublicTeacher {
  id: number;
}

interface AcademicBranch {
  id: number;
  is_active?: boolean | null;
  closed_at?: string | null;
}

interface ListResponse<T> {
  items?: T[];
  total?: number;
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Не удалось загрузить публичную статистику: ${response.status}`
    );
  }

  return response.json() as Promise<T>;
}

function getItems<T>(
  response: T[] | ListResponse<T>
): T[] {
  return Array.isArray(response)
    ? response
    : response.items ?? [];
}

export async function getPublicTeacherCount(): Promise<number> {
  const response = await getJson<
    PublicTeacher[] | ListResponse<PublicTeacher>
  >('/api/v1/users/public/teachers');

  const teachers = getItems(response);

  return new Set(
    teachers.map((teacher) => teacher.id)
  ).size;
}

export async function getPublicBranchCount(): Promise<number> {
  const response = await getJson<
    AcademicBranch[] | ListResponse<AcademicBranch>
  >('/api/v1/branches?active_only=true');

  const branches = getItems(response).filter(
    (branch) =>
      branch.is_active !== false &&
      !branch.closed_at
  );

  return new Set(
    branches.map((branch) => branch.id)
  ).size;
}

export interface PublicHomeCounters {
  teacherCount: number;
  branchCount: number;
}

export async function getPublicHomeCounters():
Promise<PublicHomeCounters> {
  const [teacherCount, branchCount] =
    await Promise.all([
      getPublicTeacherCount(),
      getPublicBranchCount(),
    ]);

  return {
    teacherCount,
    branchCount,
  };
}
