from backend.firebase_conf import db
from backend.config.types import DEFAULT_CONFIG_GLOBALS, normalitzar_config_globals

CONFIG_DOC_REF = db.collection("config").document("globals")

def get_config_globals_data() -> dict:
    doc = CONFIG_DOC_REF.get()
    if not doc.exists:
        return DEFAULT_CONFIG_GLOBALS.copy()

    return normalitzar_config_globals(doc.to_dict())

def update_config_globals_data(changes: dict) -> dict:
    current = get_config_globals_data()
    current.update({
        key: value
        for key, value in changes.items()
        if value is not None
    })
    CONFIG_DOC_REF.set(current, merge=True)
    return current

def aplicar_multiplicador_millora(cost_base: float) -> float:
    config = get_config_globals_data()
    return round(cost_base * config["multiplicador_millora"], 2)

def aplicar_multiplicador_seguro(seguro_base: float) -> float:
    config = get_config_globals_data()
    seguro = seguro_base * config["multiplicador_seguro"]
    return max(0.0, min(seguro, 0.95))
