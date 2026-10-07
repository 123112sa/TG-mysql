from webapp.modules.material_calculation.service import (
    save_legacy_forward_payload,
    save_legacy_target_payload,
)


def save_event_custom_payload(payload: dict) -> list[dict[str, float | str]]:
    return save_legacy_forward_payload(payload)


def save_output_target_payload(payload: dict) -> dict[str, float | str]:
    return save_legacy_target_payload(payload)
