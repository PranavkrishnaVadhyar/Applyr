"""Compatibility import; bearer validation is defined in one place."""
from core.security import get_current_user

__all__ = ["get_current_user"]
