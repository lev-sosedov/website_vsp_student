const CLOUDINARY_CLOUD_NAME =
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

const CLOUDINARY_UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

type CloudinaryUploadResponse = {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
};

type CloudinaryErrorResponse = {
  error?: {
    message?: string;
  };
};

export async function uploadAvatarToCloudinary(
  file: File
): Promise<CloudinaryUploadResponse> {
  if (!CLOUDINARY_CLOUD_NAME) {
    throw new Error(
      'Не указана переменная VITE_CLOUDINARY_CLOUD_NAME'
    );
  }

  if (!CLOUDINARY_UPLOAD_PRESET) {
    throw new Error(
      'Не указана переменная VITE_CLOUDINARY_UPLOAD_PRESET'
    );
  }

  const formData = new FormData();

  formData.append('file', file);
  formData.append(
    'upload_preset',
    CLOUDINARY_UPLOAD_PRESET
  );

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    let message =
      `Не удалось загрузить изображение: ${response.status}`;

    try {
      const data =
        (await response.json()) as CloudinaryErrorResponse;

      message = data.error?.message ?? message;
    } catch {
      // Оставляем стандартное сообщение.
    }

    throw new Error(message);
  }

  const result =
    (await response.json()) as CloudinaryUploadResponse;

  if (!result.secure_url) {
    throw new Error(
      'Cloudinary не вернул ссылку на изображение'
    );
  }

  return result;
}