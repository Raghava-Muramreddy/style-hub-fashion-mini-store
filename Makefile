backend-install:
	python -m venv .venv
	. .venv/Scripts/activate && pip install --upgrade pip && pip install -e ./backend

frontend-install:
	npm install --prefix frontend

backend-run:
	. .venv/Scripts/activate && cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

frontend-run:
	npm --prefix frontend run dev -- --host 0.0.0.0

compose-up:
	docker compose up --build

compose-down:
	docker compose down -v
