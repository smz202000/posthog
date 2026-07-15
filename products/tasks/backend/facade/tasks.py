"""
Celery-task wiring for the tasks product.

Re-exports the beat-scheduled loop sweeps that core's scheduler registers.
"""

from products.tasks.backend.loop_reconciliation import reconcile_loop_trigger_schedules_task
from products.tasks.backend.loop_retention import sweep_loop_task_retention_task

__all__ = ["reconcile_loop_trigger_schedules_task", "sweep_loop_task_retention_task"]
