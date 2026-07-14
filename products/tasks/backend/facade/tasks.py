"""
Celery-task wiring for the tasks product.

Re-exports the beat-scheduled loop retention sweep that core's scheduler registers.
"""

from products.tasks.backend.loop_retention import sweep_loop_task_retention_task

__all__ = ["sweep_loop_task_retention_task"]
