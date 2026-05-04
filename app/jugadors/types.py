import strawberry
from typing import TYPE_CHECKING, Annotated

@strawberry.type
class InventariItem:
    id: str
    nom_item: str
    raresa: str

@strawberry.type
class Jugador:
    id: str
    nickname: str
    nivell: int
    banejat: bool
    inventari: list[InventariItem] = strawberry.field(default_factory=list)

@strawberry.input
class RegistrarJugadorInput:
    nickname: str

@strawberry.input
class AtorgarItemInput:
    jugador_id: str
    nom_item: str
    raresa: str

@strawberry.type
class ErrorJugadorBanejat:
    missatge: str