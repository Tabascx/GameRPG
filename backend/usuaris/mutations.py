import strawberry
from typing import Union
import bcrypt as bc
from jose import jwt
import os
from datetime import datetime, timedelta

from backend.firebase_conf import db
from backend.usuaris.types import Token, ErrorLogin, ErrorRegistre, LoginInput, RegistreInput

JWT_SECRET = os.getenv("JWT_SECRET", "supersecreto123")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 720  # 30 dies


def _generate_token(uid: str, email: str) -> str:
    payload = {
        "uid": uid,
        "email": email,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def _hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')[:72]
    return bc.hashpw(pwd_bytes, bc.gensalt()).decode('utf-8')


def _verify_password(password: str, hashed: str) -> bool:
    return bc.checkpw(password.encode('utf-8')[:72], hashed.encode('utf-8'))


@strawberry.type
class UsuarisMutation:
    @strawberry.mutation
    def registre(self, input: RegistreInput) -> Union[Token, ErrorRegistre]:
        email = input.email.strip().lower()
        if not email or "@" not in email:
            return ErrorRegistre(missatge="Email invalid")

        pw = input.password
        if len(pw) < 6:
            return ErrorRegistre(missatge="Contrasenya minima: 6 caracters")
        if not any(c.isalpha() for c in pw):
            return ErrorRegistre(missatge="La contrasenya ha de tenir almenys una lletra")

        # Comprovar si email ja existeix
        existing = db.collection("usuaris").where("email", "==", email).limit(1).stream()
        if len(list(existing)) > 0:
            return ErrorRegistre(missatge="Aquest email ja esta registrat")

        hashed = _hash_password(input.password)
        doc = {
            "nickname": input.nickname.strip() or "Anonim",
            "email": email,
            "password": hashed,
            "creat": datetime.utcnow().isoformat()
        }
        ref = db.collection("usuaris").add(doc)
        uid = ref[1].id

        token = _generate_token(uid, email)
        return Token(token=token, uid=uid)

    @strawberry.mutation
    def login(self, input: LoginInput) -> Union[Token, ErrorLogin]:
        email = input.email.strip().lower()
        results = list(db.collection("usuaris").where("email", "==", email).limit(1).stream())

        if not results:
            return ErrorLogin(missatge="Email o contrasenya incorrectes")

        user_doc = results[0]
        user_data = user_doc.to_dict()

        if not _verify_password(input.password, user_data.get("password", "")):
            return ErrorLogin(missatge="Email o contrasenya incorrectes")

        uid = user_doc.id
        token = _generate_token(uid, email)
        return Token(token=token, uid=uid)
