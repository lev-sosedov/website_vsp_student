const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:8080';

export interface ContactMessagePayload {
  name: string;
  phone: string;
  email: string;
  branch: string;
  message: string;
  website?: string;
}

type ContactMessageResponse = {
  success: boolean;
  message: string;
};

async function getErrorMessage(
  response: Response
): Promise<string> {
  try {
    const data = (await response.json()) as {
      detail?: string | {
        message?: string;
      };
      message?: string;
    };

    if (typeof data.detail === 'string') {
      return data.detail;
    }

    if (
      data.detail &&
      typeof data.detail === 'object' &&
      data.detail.message
    ) {
      return data.detail.message;
    }

    return (
      data.message ??
      `Не удалось отправить сообщение: ${response.status}`
    );
  } catch {
    const text = await response.text();

    return (
      text ||
      `Не удалось отправить сообщение: ${response.status}`
    );
  }
}

export async function sendContactMessage(
  payload: ContactMessagePayload
): Promise<ContactMessageResponse> {
  const response = await fetch(
    `${API_URL}/api/v1/notifications/contact`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response)
    );
  }

  return response.json() as
    Promise<ContactMessageResponse>;
}
