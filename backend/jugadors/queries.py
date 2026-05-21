import strawberry
from backend.firebase_conf import db
from backend.jugadors.types import Jugador, Millora

@strawberry.type
class JugadorsQuery:
    @strawberry.field
    def perfil_jugador(self, id: str) -> Jugador | None:
        doc = db.collection("jugadors").document(id).get()
        if not doc.exists:
            return None
        data = doc.to_dict()

        millores_ref = db.collection("jugadors").document(id).collection("inventari").stream()
        millores = [
            Millora(id=m.id, **m.to_dict()) for m in millores_ref
        ]
        return Jugador(id=doc.id, millores=millores, **data)

    @strawberry.field
    def leaderboard(self) -> list[Jugador]:
        docs = db.collection("jugadors").order_by("monedes", direction="DESCENDING").limit(10).stream()
        result = []
        for doc in docs:
            data = doc.to_dict()
            millores_ref = db.collection("jugadors").document(doc.id).collection("inventari").stream()
            millores = [Millora(id=m.id, **m.to_dict()) for m in millores_ref]
            result.append(Jugador(id=doc.id, millores=millores, **data))
        return result