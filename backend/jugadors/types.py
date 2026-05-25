import strawberry

@strawberry.type
class Millora:
    id: str
    nom: str
    descripcio: str
    nivell: int

@strawberry.type
class Item:
    id: str
    item_id: str
    nom_item: str
    raresa: str

@strawberry.type
class Jugador:
    id: str
    nickname: str
    nivell: int
    monedes: float
    dia_actual: int
    ban: bool
    millores: list[Millora] = strawberry.field(default_factory=list)
    inventari: list[Item] = strawberry.field(default_factory=list)

def normalitzar_jugador_data(data: dict) -> dict:
    return {
        "nickname": data.get("nickname", ""),
        "nivell": data.get("nivell", 1),
        "monedes": data.get("monedes", 400.0),
        "dia_actual": data.get("dia_actual", 1),
        "ban": data.get("ban", False),
    }

@strawberry.input
class RegistrarJugadorInput:
    nickname: str

@strawberry.input
class ComprarMilloraInput:
    jugador_id: str
    nom: str
    descripcio: str

@strawberry.input
class PujarNivellInput:
    jugador_id: str

@strawberry.input
class GiveItemInput:
    jugador_id: str
    item_id: str
    nom_item: str
    raresa: str

@strawberry.type
class ErrorJugadorBan:
    missatge: str

@strawberry.type
class ErrorSenseMonedes:
    missatge: str

@strawberry.type
class ErrorNoAutoritzat:
    missatge: str

@strawberry.type
class ErrorJugadorNoTrobat:
    missatge: str

@strawberry.type
class ErrorItemInvalid:
    missatge: str

def normalitzar_item_id(item_id: str) -> str | None:
    item_id = item_id.strip()
    if not item_id.isdigit() or len(item_id) > 3:
        return None
    return item_id.zfill(3)
