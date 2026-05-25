import strawberry
from typing import Optional
from google.cloud.firestore_v1.base_query import FieldFilter
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
            query = query.where(filter=FieldFilter("jugador_id", "==", jugador_id))
        if estat:
            query = query.where(filter=FieldFilter("estat", "==", estat))
        limit = max(1, min(limit, 50))
        offset = max(0, offset)
        docs = query.offset(offset).limit(limit).stream()
        return [Partida(id=d.id, **d.to_dict()) for d in docs]

    @strawberry.field
    def taula_classificacio(self, id_partida: str) -> list[ResultatJoc]:
        from backend.loaders import get_jugadors_map

        docs = db.collection("partides").document(id_partida).collection("puntuacions").stream()
        puntuacions = []
        jugador_ids = set()
        for d in docs:
            data = d.to_dict()
            puntuacions.append((d.id, data))
            jugador_ids.add(data["jugador_id"])

        jugadors_map = get_jugadors_map(list(jugador_ids))

        return [
            ResultatJoc(id=pid, jugador=jugadors_map.get(data["jugador_id"]), **data)
            for pid, data in puntuacions
        ]
