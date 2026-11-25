from motor.motor_asyncio import AsyncIOMotorClient
from .config import settings
client = None
database = None

async def connect_database():
    global client, database
    client = AsyncIOMotorClient(settings.mongodb_url, serverSelectionTimeoutMS=5000)
    await client.admin.command("ping")
    database = client[settings.mongodb_database]
    await database.users.create_index("email", unique=True)
    await database.videos.create_index([("status", 1), ("created_at", -1)])

async def close_database():
    global client, database
    if client:
        client.close()
    client = database = None

def get_database():
    if database is None:
        raise RuntimeError("Database is not connected")
    return database
