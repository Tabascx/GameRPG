import strawberry
from typing import Union


@strawberry.type
class ResultatNeteja:
    missatge: str
    documents_eliminats: int


@strawberry.type
class ErrorPasswordIncorrecte:
    missatge: str
