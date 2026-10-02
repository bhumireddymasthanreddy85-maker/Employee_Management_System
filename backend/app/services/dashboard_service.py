from app.db.mongo import db_manager


def get_dashboard_stats() -> dict[str, int]:
    return db_manager.get_dashboard_stats()