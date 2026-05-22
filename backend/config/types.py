import strawberry

DEFAULT_CONFIG_GLOBALS = {
    "multiplicador_millora": 1.0,
    "multiplicador_seguro": 1.0,
    "multiplicador_probabilitat": 1.0,
}

@strawberry.type
class ConfigGlobals:
    multiplicador_millora: float
    multiplicador_seguro: float
    multiplicador_probabilitat: float

@strawberry.input
class ActualitzarConfigGlobalsInput:
    multiplicador_millora: float | None = None
    multiplicador_seguro: float | None = None
    multiplicador_probabilitat: float | None = None

@strawberry.type
class ErrorConfigNoAutoritzat:
    missatge: str

def normalitzar_config_globals(data: dict | None) -> dict:
    data = data or {}
    return {
        key: float(data.get(key, value))
        for key, value in DEFAULT_CONFIG_GLOBALS.items()
    }
