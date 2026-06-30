"""Seed de datos de prueba para Cosmos DB."""
import asyncio
import os
import uuid
from datetime import datetime, timezone

from azure.cosmos.aio import CosmosClient

COSMOS_ENDPOINT = os.environ["COSMOS_ENDPOINT"]
COSMOS_KEY = os.environ["COSMOS_KEY"]
DB_NAME = "waxvault"


def now():
    return datetime.now(timezone.utc).isoformat()


VINYLS = [
    {
        "id": "seed-vinyl-001",
        "title": "The Dark Side of the Moon",
        "artist": "Pink Floyd",
        "label": "Harvest Records",
        "year": 1973,
        "genre": ["Rock"],
        "style": ["Psychedelic Rock", "Prog Rock"],
        "country": "UK",
        "format": "LP",
        "discogs_id": 9287809,
        "cover_image_url": "https://upload.wikimedia.org/wikipedia/en/3/3b/Dark_Side_of_the_Moon.png",
        "status": "approved",
        "created_at": "2026-01-01T00:00:00+00:00",
        "updated_at": now(),
    },
    {
        "id": "seed-vinyl-002",
        "title": "Kind of Blue",
        "artist": "Miles Davis",
        "label": "Columbia",
        "year": 1959,
        "genre": ["Jazz"],
        "style": ["Modal"],
        "country": "US",
        "format": "LP",
        "discogs_id": 2772432,
        "cover_image_url": "https://upload.wikimedia.org/wikipedia/en/9/9c/MilesDavisKindofBlue.jpg",
        "status": "approved",
        "created_at": "2026-01-02T00:00:00+00:00",
        "updated_at": now(),
    },
    {
        "id": "seed-vinyl-003",
        "title": "Thriller",
        "artist": "Michael Jackson",
        "label": "Epic",
        "year": 1982,
        "genre": ["Funk / Soul", "Pop"],
        "style": ["Disco", "Pop Rock", "Soul", "Funk"],
        "country": "US",
        "format": "LP",
        "discogs_id": 2911293,
        "cover_image_url": "https://upload.wikimedia.org/wikipedia/en/5/55/Michael_Jackson_-_Thriller.png",
        "status": "approved",
        "created_at": "2026-01-03T00:00:00+00:00",
        "updated_at": now(),
    },
    {
        "id": "seed-vinyl-004",
        "title": "Nevermind",
        "artist": "Nirvana",
        "label": "DGC Records",
        "year": 1991,
        "genre": ["Rock"],
        "style": ["Grunge", "Alternative Rock"],
        "country": "US",
        "format": "LP",
        "discogs_id": 7097051,
        "cover_image_url": "https://upload.wikimedia.org/wikipedia/en/b/b7/NirvanaNevermindalbumcover.jpg",
        "status": "approved",
        "created_at": "2026-01-04T00:00:00+00:00",
        "updated_at": now(),
    },
    {
        "id": "seed-vinyl-005",
        "title": "Abbey Road",
        "artist": "The Beatles",
        "label": "Apple Records",
        "year": 1969,
        "genre": ["Rock"],
        "style": ["Pop Rock", "Psychedelic Rock"],
        "country": "UK",
        "format": "LP",
        "discogs_id": 14186441,
        "cover_image_url": "https://upload.wikimedia.org/wikipedia/en/4/42/Beatles_-_Abbey_Road.jpg",
        "status": "approved",
        "created_at": "2026-01-05T00:00:00+00:00",
        "updated_at": now(),
    },
    {
        "id": "seed-vinyl-006",
        "title": "Discovery",
        "artist": "Daft Punk",
        "label": "Virgin",
        "year": 2001,
        "genre": ["Electronic"],
        "style": ["House", "Electro"],
        "country": "France",
        "format": "2xLP",
        "discogs_id": 2879,
        "cover_image_url": "https://upload.wikimedia.org/wikipedia/en/2/27/Daft_Punk_-_Discovery.png",
        "status": "pending",
        "created_at": "2026-01-06T00:00:00+00:00",
        "updated_at": now(),
    },
]


async def seed():
    async with CosmosClient(COSMOS_ENDPOINT, credential=COSMOS_KEY) as client:
        db = client.get_database_client(DB_NAME)
        container = db.get_container_client("vinyls")

        for vinyl in VINYLS:
            await container.upsert_item(body=vinyl)
            print(f"  Upserted: {vinyl['title']} by {vinyl['artist']} [{vinyl['status']}]")

    print("\nDone! Seeded", len(VINYLS), "vinyls.")


if __name__ == "__main__":
    asyncio.run(seed())
