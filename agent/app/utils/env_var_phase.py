"""Build-time vs runtime environment variable classification."""

import json
import re
from typing import Any, Dict, Optional, Tuple

_BUILD_ARG_PREFIX = re.compile(r"^(VITE_|NEXT_PUBLIC_|REACT_APP_)")
_SENSITIVE_KEY = re.compile(r"(SECRET|TOKEN|PASSWORD|PRIVATE|API_KEY)", re.IGNORECASE)
_VALID_PHASES = frozenset({"runtime", "build"})


def infer_env_phase(key: str) -> str:
    name = str(key or "").strip()
    if not name:
        return "runtime"
    if _BUILD_ARG_PREFIX.match(name):
        return "build"
    return "runtime"


def is_sensitive_build_key(key: str) -> bool:
    name = str(key or "").strip()
    if not name:
        return True
    return bool(_SENSITIVE_KEY.search(name))


def resolve_env_phase(
    key: str,
    *,
    phase: Optional[str] = None,
    is_secret: bool = False,
) -> str:
    """``is_secret`` is ignored for phase (values are always stored encrypted)."""
    del is_secret
    name = str(key or "").strip()
    if not name:
        return "runtime"
    if is_sensitive_build_key(name):
        return "runtime"
    explicit = str(phase or "").strip().lower()
    if explicit == "build":
        return "build"
    inferred = infer_env_phase(name)
    if explicit == "runtime":
        if inferred == "build":
            return "build"
        return "runtime"
    return inferred


def split_env_vars(
    raw: Optional[Dict[str, Any]],
    phases: Optional[Dict[str, str]] = None,
) -> Tuple[Dict[str, str], Dict[str, str]]:
    """
    Partition env vars into (build_args, runtime_env).
    ``phases`` maps key -> "build"|"runtime" when provided by the platform.
    """
    if not raw:
        return {}, {}

    phase_map = phases or {}
    build_args: Dict[str, str] = {}
    runtime_env: Dict[str, str] = {}

    for key, val in raw.items():
        if key is None:
            continue
        ks = str(key).strip()
        if not ks:
            continue
        if val is None:
            vs = ""
        elif isinstance(val, (dict, list)):
            vs = json.dumps(val, separators=(",", ":"))
        else:
            vs = str(val)

        resolved = resolve_env_phase(ks, phase=phase_map.get(ks))
        if resolved == "build":
            build_args[ks] = vs
        else:
            runtime_env[ks] = vs

    return build_args, runtime_env
