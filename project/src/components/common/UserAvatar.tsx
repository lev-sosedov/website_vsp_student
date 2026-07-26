import type {
  SyntheticEvent,
} from 'react';

export const DEFAULT_USER_AVATAR_URL =
  'https://res.cloudinary.com/dvfh5gnad/image/upload/v1785025341/w5ebmr5buxtmwkfwpbxk.webp';

interface UserAvatarProps {
  avatarUrl?: string | null;
  alt: string;
  className: string;
}

function handleAvatarError(
  event: SyntheticEvent<
    HTMLImageElement,
    Event
  >
): void {
  const image = event.currentTarget;

  if (image.src === DEFAULT_USER_AVATAR_URL) {
    return;
  }

  image.src = DEFAULT_USER_AVATAR_URL;
}

export default function UserAvatar({
  avatarUrl,
  alt,
  className,
}: UserAvatarProps) {
  return (
    <img
      src={
        avatarUrl?.trim() ||
        DEFAULT_USER_AVATAR_URL
      }
      alt={alt}
      className={className}
      onError={handleAvatarError}
    />
  );
}
