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
    ErrorItemInvalid,
    normalitzar_jugador_data,
    normalitzar_item_id,
)
from strawberry.types import Info

MILLORES_CONFIG = {
    "seguro": {"max_nivell": 3, "cost_base": 50, "cost_inc": 100},
    "taberna": {"max_nivell": 10, "cost_base": 50, "cost_inc": 10},
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
            uid = db.collection("jugadors").document().id

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
    def comprar_millora(self, input: ComprarMilloraInput, info: Info) -> Union[Millora, ErrorSenseMonedes, ErrorJugadorBan, ErrorJugadorNoTrobat]:
        ref = db.collection("jugadors").document(input.jugador_id)
        doc = ref.get()
        if not doc.exists:
            return ErrorJugadorNoTrobat(missatge=f"Jugador {input.jugador_id} no trobat")

        data = doc.to_dict()
        if data.get("ban"):
            return ErrorJugadorBan(missatge="Jugador amb ban")

        nom = input.nom
        config = MILLORES_CONFIG.get(nom)
        if not config:
            return ErrorSenseMonedes(missatge=f"Millora {nom} no reconeguda")

        # Buscar si ja té aquesta millora
        inv_ref = db.collection("jugadors").document(input.jugador_id).collection("inventari")
        existing = inv_ref.where("nom", "==", nom).stream()
        existing_docs = list(existing)

        if existing_docs:
            doc_existing = existing_docs[0]
            nivell_actual = doc_existing.to_dict().get("nivell", 0)
            if nivell_actual >= config["max_nivell"]:
                return ErrorSenseMonedes(missatge=f"Millora {nom} al màxim nivell ({config['max_nivell']})")
            nou_nivell = nivell_actual + 1
            cost = aplicar_multiplicador_millora(config["cost_base"] + nivell_actual * config["cost_inc"])
            if data["monedes"] < cost:
                return ErrorSenseMonedes(missatge=f"No tens prou monedes. Necessites {cost}$")
            ref.update({"monedes": data["monedes"] - cost})
            inv_ref.document(doc_existing.id).update({"nivell": nou_nivell, "descripcio": input.descripcio})
            return Millora(id=doc_existing.id, nom=nom, descripcio=input.descripcio, nivell=nou_nivell)
        else:
            cost = aplicar_multiplicador_millora(config["cost_base"])
            if data["monedes"] < cost:
                return ErrorSenseMonedes(missatge=f"No tens prou monedes. Necessites {cost}$")
            ref.update({"monedes": data["monedes"] - cost})
            millora_data = {"nom": nom, "descripcio": input.descripcio, "nivell": 1}
            nova = inv_ref.add(millora_data)
            return Millora(id=nova[1].id, **millora_data)

    @strawberry.mutation
    def give_item(self, input: GiveItemInput, info: Info) -> Union[Item, ErrorJugadorNoTrobat, ErrorJugadorBan, ErrorItemInvalid]:
        ref = db.collection("jugadors").document(input.jugador_id)
        doc = ref.get()
        if not doc.exists:
            return ErrorJugadorNoTrobat(missatge=f"Jugador {input.jugador_id} no trobat")

        data = doc.to_dict()
        if data.get("ban"):
            return ErrorJugadorBan(missatge="Jugador amb ban")

        item_id = normalitzar_item_id(input.item_id)
        if not item_id:
            return ErrorItemInvalid(missatge="El codi de l'item ha de tenir entre 1 i 3 digits")

        item_data = {
            "item_id": item_id,
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
