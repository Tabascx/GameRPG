import strawberry
from app.firebase_conf import db
from app.partides.types import Partida, Puntuacio, CrearPartidaInput, RegistrarPuntuacioInput, ErrorPartidaNoTrobada
from strawberry.types import Info
from datetime import datetime

@strawberry.type
class PartidesMutation:
    @strawberry.mutation
    def crear_partida(self, input: CrearPartidaInput, info: Info) -> Partida:
        data = {
            "mapa": input.mapa,
            "estat": "En curs",
            "data_creacio": datetime.utcnow().isoformat()
        }
        ref = db.collection("partides").add(data)
        return Partida(id=ref[1].id, **data)

    @strawberry.mutation
    def registrar_puntuacio(self, input: RegistrarPuntuacioInput, info: Info) -> Puntuacio:
        data = {
            "jugador_id": input.jugador_id,
            "punts": input.punts,
            "baixes": input.baixes
        }
        ref = db.collection("partides").document(input.partida_id).collection("puntuacions").add(data)
        return Puntuacio(id=ref[1].id, jugador=None, **data)

    @strawberry.mutation
    def finalitzar_partida(self, partida_id: str, info: Info) -> strawberry.annotated[Partida | ErrorPartidaNoTrobada, strawberry.union("ResultatFinalitzar")]:
        ref = db.collection("partides").document(partida_id)
        doc = ref.get()
        if not doc.exists:
            return ErrorPartidaNoTrobada(missatge=f"Partida {partida_id} no trobada")
        ref.update({"estat": "Finalitzada"})
        data = ref.get().to_dict()
        return Partida(id=partida_id, **data)