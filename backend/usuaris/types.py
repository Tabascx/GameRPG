import strawberry

@strawberry.type
class Token:
    token: str
    uid: str

@strawberry.type
class ErrorLogin:
    missatge: str

@strawberry.type
class ErrorRegistre:
    missatge: str

@strawberry.input
class LoginInput:
    email: str
    password: str

@strawberry.input
class RegistreInput:
    nickname: str
    email: str
    password: str
