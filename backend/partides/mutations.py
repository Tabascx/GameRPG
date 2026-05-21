import strawberry
from typing import Annotated, Union
from backend.firebase_conf import db
from backend.partides.types import Partida, ResultatJoc, CrearPartidaInput, RegistrarResultatInput, ErrorPartidaNoTrobada
from strawberry.types import Info
from datetime import datetime

SEGURO_BASE = 0.4
SEGURO_AMB_MURALLA = 0.7

@strawberry.type
class PartidesMutation:
    @strawberry.mutation
    def crear_partida(self, input: CrearPartidaInput, info: Info) -> Partida:
        data = {
            "jugador_id": input.jugador_id,
            "mapa": "Recinte Amurallat",
            "estat": "En curs",
            "dia": input.dia,
            "data_creacio": datetime.utcnow().isoformat()
        }
        ref = db.collection("partides").add(data)
        return Partida(id=ref[1].id, **data)

    @strawberry.mutation
    def registrar_resultat(self, input: RegistrarResultatInput, info: Info) -> ResultatJoc:
        # Comprovar si té seguro i muralla
        inventari = db.collection("jugadors").document(input.jugador_id).collection("inventari").stream()
        te_muralla = any(i.to_dict().get("nom") == "muralla" for i in inventari)

        monedes_finals = input.monedes_resultat
        if not input.guanyat and input.monedes_resultat < 0:
            seguro = SEGURO_AMB_MURALLA if te_muralla else SEGURO_BASE
            monedes_finals = input.monedes_resultat * (1 - seguro)

        # Actualitzar monedes del jugador
        ref = db.collection("jugadors").document(input.jugador_id)
        doc = ref.get().to_dict()
        ref.update({"monedes": doc["monedes"] + monedes_finals})

        # Guardar resultat
        data = {
            "jugador_id": input.jugador_id,
            "joc": input.joc,
            "monedes_apostades": input.monedes_apostades,
            "monedes_resultat": monedes_finals,
            "guanyat": input.guanyat,
            "dia": input.dia
        }
        nova = db.collection("partides").document(input.partida_id).collection("puntuacions").add(data)
        return ResultatJoc(id=nova[1].id, **data)

    @strawberry.mutation
    def finalitzar_partida(self, partida_id: str, info: Info) -> Union[Partida, ErrorPartidaNoTrobada]:
        ref = db.collection("partides").document(partida_id)
        doc = ref.get()
        if not doc.exists:
            return ErrorPartidaNoTrobada(missatge=f"Partida {partida_id} no trobada")
        ref.update({"estat": "Finalitzada"})

        # Avançar dia del jugador
        data = ref.get().to_dict()
        jug_ref = db.collection("jugadors").document(data["jugador_id"])
        jug_ref.update({"dia_actual": data["dia"] + 1})

        return Partida(id=partida_id, **ref.get().to_dict())