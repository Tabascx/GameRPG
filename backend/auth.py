from jose import jwt, JWTError
from strawberry.types import Info
import os

SECRET = os.getenv("JWT_SECRET", "supersecreto123")
ALGORITHM = "HS256"

def get_current_user(info: Info) -> dict:
    token = info.context["request"].headers.get("Authorization", "").replace("Bearer ", "")
    try:
        payload = jwt.decode(token, SECRET, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise Exception("Token inválido o ausente")

def is_admin(info: Info) -> bool:
    user = get_current_user(info)
    email = user.get("email", "")
    return email.endswith("@irongate.es")