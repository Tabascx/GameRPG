from backend.firebase_conf import db
from backend.jugadors.types import Jugador, normalitzar_jugador_data

def get_jugadors_map(jugador_ids: list[str]) -> dict[str, Jugador]:
    if not jugador_ids:
        return {}

    refs = [db.collection("jugadors").document(uid) for uid in jugador_ids]
    docs = db.get_all(refs)
    result = {}
    for doc in docs:
        if doc.exists:
            data = normalitzar_jugador_data(doc.to_dict())
            result[doc.id] = Jugador(id=doc.id, millores=[], inventari=[], **data)
    return result
