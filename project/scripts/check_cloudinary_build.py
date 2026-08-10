"""Static regression checks for safe Cloudinary production configuration."""

from pathlib import Path
import subprocess


ROOT = Path(__file__).resolve().parents[1]
DOCKERFILE = (ROOT / "Dockerfile").read_text(encoding="utf-8")
DOCKERIGNORE = (ROOT / ".dockerignore").read_text(encoding="utf-8").splitlines()
GITIGNORE = (ROOT / ".gitignore").read_text(encoding="utf-8").splitlines()
EXAMPLE = (ROOT / ".env.production.example").read_text(encoding="utf-8")
CLOUDINARY_API = (ROOT / "src/api/cloudinaryApi.ts").read_text(encoding="utf-8")


def require(text: str, value: str) -> None:
    if value not in text:
        raise AssertionError(f"missing expected configuration: {value}")


def main() -> None:
    for name in (
        "ARG VITE_CLOUDINARY_CLOUD_NAME=",
        "ARG VITE_CLOUDINARY_UPLOAD_PRESET=",
        "ENV VITE_CLOUDINARY_CLOUD_NAME=${VITE_CLOUDINARY_CLOUD_NAME}",
        "ENV VITE_CLOUDINARY_UPLOAD_PRESET=${VITE_CLOUDINARY_UPLOAD_PRESET}",
    ):
        require(DOCKERFILE, name)

    for name in (".env", ".env.*", "!.env.production.example"):
        if name not in DOCKERIGNORE:
            raise AssertionError(f"missing .dockerignore rule: {name}")
    for name in (".env", ".env.production", ".env.local", ".env.*.local"):
        if name not in GITIGNORE:
            raise AssertionError(f"missing .gitignore rule: {name}")

    require(EXAMPLE, "VITE_CLOUDINARY_CLOUD_NAME=CHANGE_ME_CLOUDINARY_CLOUD_NAME")
    require(EXAMPLE, "VITE_CLOUDINARY_UPLOAD_PRESET=CHANGE_ME_CLOUDINARY_UNSIGNED_UPLOAD_PRESET")
    require(CLOUDINARY_API, "Не указана переменная VITE_CLOUDINARY_CLOUD_NAME")
    require(CLOUDINARY_API, "Не указана переменная VITE_CLOUDINARY_UPLOAD_PRESET")

    forbidden = ("VITE_CLOUDINARY_API_KEY", "VITE_CLOUDINARY_API_SECRET", "api_key", "api_secret")
    if any(value in CLOUDINARY_API for value in forbidden):
        raise AssertionError("frontend must not use Cloudinary API keys or API secrets")

    tracked = subprocess.check_output(
        ["git", "ls-files"], cwd=ROOT, text=True
    ).splitlines()
    if any(Path(path).name in {".env", ".env.local", ".env.production"} for path in tracked):
        raise AssertionError("local environment files must not be tracked")

    print("Cloudinary production build checks passed")


if __name__ == "__main__":
    main()
