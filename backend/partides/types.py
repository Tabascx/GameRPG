import strawberry
from typing import Optional, Annotated

@strawberry.type
class ResultatJoc:
    id: str
    jugador_id: str
    joc: Optional[str] = None
    monedes_apostades: Optional[float] = None
    monedes_resultat: Optional[float] = None
    guanyat: Optional[bool] = None
    dia: Optional[int] = None
    punts: Optional[int] = None
    baixes: Optional[int] = None
    jugador: Optional[Annotated["Jugador", strawberry.lazy("backend.jugadors.types")]] = None

@strawberry.type
class Partida:
    id: str
    jugador_id: str
    mapa: str
    estat: str
    dia: int
    data_creacio: str

@strawberry.input
class CrearPartidaInput:
    jugador_id: str
    dia: int

@strawberry.input
class RegistrarResultatInput:
    partida_id: str
    jugador_id: str
    joc: str
    monedes_apostades: float
    monedes_resultat: float
    guanyat: bool
    dia: int

@strawberry.input
class RegistrarPuntuacioInput:
    partida_id: str
    jugador_id: str
    punts: int
    baixes: int

@strawberry.type
class ErrorPartidaNoTrobada:
    missatge: str
