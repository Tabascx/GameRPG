import strawberry
from typing import Optional
from backend.firebase_conf import db
from backend.partides.types import Partida, ResultatJoc

@strawberry.type
class PartidesQuery:
    @strawberry.field
    def llistar_partides(
        self,
        jugador_id: Optional[str] = None,
        estat: Optional[str] = None,
        limit: int = 10,
        offset: int = 0
    ) -> list[Partida]:
        query = db.collection("partides")
        if jugador_id:
            query = query.where("jugador_id", "==", jugador_id)
        if estat:
            query = query.where("estat", "==", estat)
        docs = list(query.stream())
        docs = docs[offset: offset + limit]
        return [Partida(id=d.id, **d.to_dict()) for d in docs]

    @strawberry.field
    def taula_classificacio(self, id_partida: str) -> list[ResultatJoc]:
        docs = db.collection("partides").document(id_partida).collection("puntuacions").stream()
        result = []
        for d in docs:
            data = d.to_dict()
            # Relació inversa N:1 via LazyType → carrega el jugador
            from backend.jugadors.types import Jugador
            jug_doc = db.collection("jugadors").document(data["jugador_id"]).get()
            jugador = None
            if jug_doc.exists:
                jugador = Jugador(id=jug_doc.id, millores=[], **jug_doc.to_dict())
            result.append(ResultatJoc(id=d.id, jugador=jugador, **data))
        return result