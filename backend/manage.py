#!/usr/bin/env python
"""Django administrative utility for the SmartAI CRM backend."""
import os
import sys


def main() -> None:
    """Run administrative tasks."""
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Make sure dependencies are installed and "
            "the virtual environment is activated."
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
