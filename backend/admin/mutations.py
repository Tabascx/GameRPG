import os
import strawberry
from typing import Union
from backend.firebase_conf import db
from backend.admin.types import ResultatNeteja, ErrorPasswordIncorrecte

PASSWORD = os.getenv("ADMIN_WIPE_PASSWORD", "admin123")

def _wipe_collection(collection_name: str) -> int:
    docs = db.collection(collection_name).get()
    count = 0
    for doc in docs:
        ref = db.collection(collection_name).document(doc.id)
        for sub in ref.collections():
            for subdoc in sub.get():
                subdoc.reference.delete()
        ref.delete()
        count += 1
    return count


@strawberry.type
class AdminMutation:
    @strawberry.mutation
    def netejar_base_dades(self, password: str) -> Union[ResultatNeteja, ErrorPasswordIncorrecte]:
        if password != PASSWORD:
            return ErrorPasswordIncorrecte(missatge="Contrasenya incorrecta")

        total = 0
        total += _wipe_collection("jugadors")
        total += _wipe_collection("partides")
        total += _wipe_collection("usuaris")

        return ResultatNeteja(
            missatge=f"Base de dades netejada. {total} documents eliminats.",
            documents_eliminats=total,
        )
