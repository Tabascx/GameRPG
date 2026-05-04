import strawberry
from typing import Optional
from app.firebase_conf import db
from app.partides.types import Partida, Puntuacio

@strawberry.type
class PartidesQuery:
    @strawberry.field
    def llistar_partides(
        self,
        estat: Optional[str] = None,
        limit: int = 10,
        offset: int = 0
    ) -> list[Partida]:
        query = db.collection("partides")
        if estat:
            query = query.where("estat", "==", estat)
        docs = list(query.stream())
        docs = docs[offset: offset + limit]
        return [Partida(id=d.id, **d.to_dict()) for d in docs]

    @strawberry.field
    def taula_classificacio(self, id_partida: str) -> list[Puntuacio]:
        scores = db.collection("partides").document(id_partida).collection("puntuacions").stream()
        result = []
        for s in scores:
            data = s.to_dict()
            # Relació inversa N:1 → carregar jugador
            jug_doc = db.collection("jugadors").document(data["jugador_id"]).get()
            jugador = None
            if jug_doc.exists:
                from app.jugadors.types import Jugador
                jugador = Jugador(id=jug_doc.id, inventari=[], **jug_doc.to_dict())
            result.append(Puntuacio(id=s.id, jugador=jugador, **data))
        return result