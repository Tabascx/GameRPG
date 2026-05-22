import strawberry
from typing import Union
from backend.firebase_conf import db
from backend.auth import get_current_user, is_admin
from backend.config.service import aplicar_multiplicador_millora
from backend.jugadors.types import (
    Jugador,
    Millora,
    Item,
    RegistrarJugadorInput,
    ComprarMilloraInput,
    PujarNivellInput,
    GiveItemInput,
    ErrorJugadorBan,
    ErrorSenseMonedes,
    ErrorNoAutoritzat,
    ErrorJugadorNoTrobat,
    normalitzar_jugador_data,
)
from strawberry.types import Info

COST_MILLORA = {
    "muralla": 150.0,
    "taberna": 100.0,
    "cofre": 200.0,
}

@strawberry.type
class JugadorsMutation:
    @strawberry.mutation
    def registrar_jugador(self, input: RegistrarJugadorInput, info: Info) -> Union[Jugador, ErrorNoAutoritzat]:
        try:
            user = get_current_user(info)
            uid = user.get("uid")
        except Exception:
            uid = None

        if not uid:
            return ErrorNoAutoritzat(missatge="Token JWT invàlid o sense uid")

        data = {
            "nickname": input.nickname,
            "nivell": 1,
            "monedes": 400.0,
            "dia_actual": 1,
            "ban": False
        }
        db.collection("jugadors").document(uid).set(data)
        return Jugador(id=uid, millores=[], inventari=[], **data)

    @strawberry.mutation
    def comprar_millora(self, input: ComprarMilloraInput, info: Info) -> Union[Millora, ErrorSenseMonedes, ErrorJugadorBan]:
        ref = db.collection("jugadors").document(input.jugador_id)
        doc = ref.get()
        if not doc.exists:
            return ErrorSenseMonedes(missatge=f"Jugador {input.jugador_id} no trobat")

        data = doc.to_dict()

        if data.get("ban"):
            return ErrorJugadorBan(missatge="Jugador amb ban")

        cost = aplicar_multiplicador_millora(COST_MILLORA.get(input.nom, 100.0))
        if data["monedes"] < cost:
            return ErrorSenseMonedes(missatge=f"No tens prou monedes. Necessites {cost}$")

        ref.update({"monedes": data["monedes"] - cost})
        millora_data = {"nom": input.nom, "descripcio": input.descripcio, "nivell": 1}
        nova = db.collection("jugadors").document(input.jugador_id).collection("inventari").add(millora_data)
        return Millora(id=nova[1].id, **millora_data)

    @strawberry.mutation
    def give_item(self, input: GiveItemInput, info: Info) -> Union[Item, ErrorJugadorNoTrobat, ErrorJugadorBan]:
        ref = db.collection("jugadors").document(input.jugador_id)
        doc = ref.get()
        if not doc.exists:
            return ErrorJugadorNoTrobat(missatge=f"Jugador {input.jugador_id} no trobat")

        data = doc.to_dict()
        if data.get("ban"):
            return ErrorJugadorBan(missatge="Jugador amb ban")

        item_data = {
            "item_id": input.item_id,
            "nom_item": input.nom_item,
            "raresa": input.raresa,
        }
        nova = ref.collection("inventari").add(item_data)
        return Item(id=nova[1].id, **item_data)

    @strawberry.mutation
    def pujar_nivell(self, input: PujarNivellInput, info: Info) -> Union[Jugador, ErrorNoAutoritzat, ErrorJugadorNoTrobat]:
        try:
            admin = is_admin(info)
        except Exception:
            admin = False

        if not admin:
            return ErrorNoAutoritzat(missatge="Només un admin pot pujar el nivell d'un jugador")

        ref = db.collection("jugadors").document(input.jugador_id)
        doc = ref.get()
        if not doc.exists:
            return ErrorJugadorNoTrobat(missatge=f"Jugador {input.jugador_id} no trobat")

        data = normalitzar_jugador_data(doc.to_dict())
        data["nivell"] += 1
        ref.update({"nivell": data["nivell"]})

        return Jugador(id=input.jugador_id, millores=[], inventari=[], **data)
