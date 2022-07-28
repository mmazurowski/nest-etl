# Hello there 👋🏻

My name is Marcin, very nice to meet you. In the following repository you can find implementation of the task.

### How to run

In root directory of the project execute `docker compose up --build`. All required `.env` files are already defined
in `docker-compose`

TL;DR:

1. Initial import can take some time but after that only new orders will be processed.
2. Due to time limitation docker compose does not use tools like `wait_for.sh` so in case databases are not ready it
   might require starting docker compose again.
3. REST API is exposed under `localhost:3008`