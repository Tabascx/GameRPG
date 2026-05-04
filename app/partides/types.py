import strawberry
from typing import Annotated, TYPE_CHECKING

if TYPE_CHECKING:
    from app.jugadors.types import Jugador

@strawberry.type
class Puntuacio:
    id: str
    jugador_id: str
    punts: int
    baixes: int
    jugador: Annotated["Jugador", strawberry.lazy("app.jugadors.types")] | None = None

@strawberry.type
class Partida:
    id: str
    mapa: str
    estat: str
    data_creacio: str

@strawberry.input
class CrearPartidaInput:
    mapa: str

@strawberry.input
class RegistrarPuntuacioInput:
    partida_id: str
    jugador_id: str
    punts: int
    baixes: int

@strawberry.type
class ErrorPartidaNoTrobada:
    missatge: str