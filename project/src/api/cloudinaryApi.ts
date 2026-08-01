const CLOUDINARY_CLOUD_NAME =
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

const CLOUDINARY_UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  width?: number;
  height?: number;
  format: string;
  resource_type?: string;
  bytes?: number;
  duration?: number;
  original_filename?: string;
}

export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
  resourceType: string;
  originalFilename: string;
  format: string | null;
  bytes: number;
  mimeType: string;
}

interface CloudinaryApiResponse {
  secure_url?: string;
  public_id?: string;
  width?: number;
  height?: number;
  format?: string;
  resource_type?: string;
  bytes?: number;
  duration?: number;
  original_filename?: string;
  error?: {
    message?: string;
  };
}

function validateCloudinarySettings(): void {
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
}

async function uploadToCloudinary(
  file: File,
  resourceType: 'image' | 'auto',
  errorLabel: string,
  options?: {
    folder?: string;
    tags?: string;
  }
): Promise<CloudinaryApiResponse> {
  validateCloudinarySettings();

  const formData = new FormData();

  formData.append('file', file);
  formData.append(
    'upload_preset',
    CLOUDINARY_UPLOAD_PRESET!
  );

  if (options?.folder) {
    formData.append('folder', options.folder);
  }

  if (options?.tags) {
    formData.append('tags', options.tags);
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME!}/${resourceType}/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  let data: CloudinaryApiResponse = {};

  try {
    data =
      (await response.json()) as CloudinaryApiResponse;
  } catch {
    // Если Cloudinary не вернул JSON, ниже будет стандартная ошибка.
  }

  if (!response.ok || !data.secure_url) {
    throw new Error(
      data.error?.message ||
        `Не удалось загрузить ${errorLabel}: ${response.status}`
    );
  }

  return data;
}

function toLegacyResult(
  data: CloudinaryApiResponse
): CloudinaryUploadResponse {
  return {
    secure_url: data.secure_url!,
    public_id: data.public_id ?? '',
    width: data.width,
    height: data.height,
    format: data.format ?? '',
    resource_type: data.resource_type,
    bytes: data.bytes,
    duration: data.duration,
    original_filename: data.original_filename,
  };
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    CLOUDINARY_CLOUD_NAME &&
      CLOUDINARY_UPLOAD_PRESET
  );
}

export async function uploadAvatarToCloudinary(
  file: File
): Promise<CloudinaryUploadResponse> {
  const data = await uploadToCloudinary(
    file,
    'image',
    'изображение'
  );

  return toLegacyResult(data);
}

export async function uploadNewsMediaToCloudinary(
  file: File
): Promise<CloudinaryUploadResponse> {
  const data = await uploadToCloudinary(
    file,
    'auto',
    'медиа'
  );

  return toLegacyResult(data);
}

export async function uploadMaterialFileToCloudinary(
  file: File
): Promise<CloudinaryUploadResponse> {
  const data = await uploadToCloudinary(
    file,
    'auto',
    'учебный файл',
    {
      folder: 'vsp-student/materials',
      tags: 'vsp_student,lesson_material',
    }
  );

  return toLegacyResult(data);
}

export async function uploadFileToCloudinary(
  file: File,
  folder = 'vsp-student/materials'
): Promise<CloudinaryUploadResult> {
  const data = await uploadToCloudinary(
    file,
    'auto',
    'файл',
    {
      folder,
      tags: 'vsp_student,lesson_material',
    }
  );

  return {
    secureUrl: data.secure_url!,
    publicId: data.public_id ?? '',
    resourceType:
      data.resource_type ?? 'raw',
    originalFilename:
      data.original_filename ?? file.name,
    format: data.format ?? null,
    bytes: data.bytes ?? file.size,
    mimeType:
      file.type || 'application/octet-stream',
  };
}

export function detectAttachmentType(
  file: Pick<File, 'name' | 'type'>
): string {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  if (
    type.includes('presentation') ||
    /\.(ppt|pptx|odp)$/.test(name)
  ) {
    return 'presentation';
  }

  if (type.startsWith('image/')) {
    return 'image';
  }

  if (type.startsWith('video/')) {
    return 'video';
  }

  if (type.startsWith('audio/')) {
    return 'audio';
  }

  if (/\.(zip|rar|7z|tar|gz)$/.test(name)) {
    return 'archive';
  }

  if (
    /\.(py|js|ts|tsx|jsx|java|go|cs|cpp|c|html|css|json|sql)$/.test(
      name
    )
  ) {
    return 'code';
  }

  return 'document';
}
