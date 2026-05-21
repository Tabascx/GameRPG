import strawberry
from typing import Optional

@strawberry.type
class Millora:
    id: str
    nom: str
    descripcio: str
    nivell: int

@strawberry.type
class Jugador:
    id: str
    nickname: str
    monedes: float
    dia_actual: int
    banejat: bool
    millores: list[Millora] = strawberry.field(default_factory=list)

@strawberry.input
class RegistrarJugadorInput:
    nickname: str

@strawberry.input
class ComprarMilloraInput:
    jugador_id: str
    nom: str
    descripcio: str

@strawberry.type
class ErrorJugadorBanejat:
    missatge: str

@strawberry.type
class ErrorSenseMonedes:
    missatge: str