import stripe

from app.services import payment_service


def auth(client, email):
    client.post("/api/v1/auth/register", json={"full_name": "Test", "email": email, "password": "password123"})
    token = client.post("/api/v1/auth/login", json={"email": email, "password": "password123"}).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_auth_rules(client):
    assert client.post("/api/v1/auth/register", json={"full_name": "A", "email": "bad", "password": "password123"}).status_code == 422
    assert client.post("/api/v1/auth/register", json={"full_name": "A", "email": "a@x.com", "password": "short"}).status_code == 422
    assert client.post("/api/v1/auth/login", json={"email": "nobody@x.com", "password": "password123"}).status_code == 401
    assert client.get("/api/v1/cart").status_code == 401
    assert client.get("/api/v1/orders").status_code == 401
    h = auth(client, "me@example.com")
    me = client.get("/api/v1/users/me", headers=h)
    assert me.status_code == 200 and me.json()["email"] == "me@example.com"
    assert client.post("/api/v1/auth/register", json={"full_name": "A", "email": "ME@example.com", "password": "password123"}).status_code == 409


def test_products(client):
    items = client.get("/api/v1/products").json()
    assert items and client.get(f"/api/v1/products/{items[0]['id']}").status_code == 200
    assert client.get("/api/v1/products/99999").status_code == 404


def test_cart_isolated_and_validated(client):
    a, b = auth(client, "a@example.com"), auth(client, "b@example.com")
    r = client.post("/api/v1/cart/items", json={"product_id": 1, "quantity": 2}, headers=a)
    assert r.status_code == 201
    item_id = r.json()["id"]
    assert client.post("/api/v1/cart/items", json={"product_id": 1, "quantity": 0}, headers=a).status_code == 422
    assert client.patch(f"/api/v1/cart/items/{item_id}", json={"quantity": 3}, headers=b).status_code == 400
    cart = client.get("/api/v1/cart", headers=a).json()
    price = client.get("/api/v1/products/1").json()["price"]
    assert cart["subtotal"] == price * 2
    assert client.get("/api/v1/cart", headers=b).json()["items"] == []
    assert client.patch(f"/api/v1/cart/items/{item_id}", json={"quantity": 3}, headers=a).status_code == 200
    assert client.delete(f"/api/v1/cart/items/{item_id}", headers=a).status_code == 204


def test_checkout_and_payment_flow(client, monkeypatch):
    h = auth(client, "pay@example.com")
    assert client.post("/api/v1/checkout", headers=h).status_code == 400

    state = {"status": "requires_payment_method"}
    monkeypatch.setattr(payment_service.stripe.PaymentIntent, "create", lambda **kw: {"id": "pi_test_1", "client_secret": "pi_test_1_secret"})
    monkeypatch.setattr(payment_service.stripe.PaymentIntent, "retrieve", lambda _id: {"id": _id, **state})
    monkeypatch.setattr(payment_service.stripe.PaymentIntent, "cancel", lambda _id: {})

    client.post("/api/v1/cart/items", json={"product_id": 1, "quantity": 1}, headers=h)
    stock_before = client.get("/api/v1/products/1").json()["stock_quantity"]
    co = client.post("/api/v1/checkout", headers=h).json()
    assert co["payment_intent_id"] == "pi_test_1" and co["client_secret"]

    s = client.get("/api/v1/payments/pi_test_1/status", headers=h).json()
    assert s["payment_status"] == "pending"
    other = auth(client, "other@example.com")
    assert client.get("/api/v1/payments/pi_test_1/status", headers=other).status_code == 404

    state["status"] = "succeeded"
    s = client.get("/api/v1/payments/pi_test_1/status", headers=h).json()
    assert s["payment_status"] == "succeeded" and s["status"] == "paid"
    assert client.get("/api/v1/cart", headers=h).json()["items"] == []
    assert client.get("/api/v1/products/1").json()["stock_quantity"] == stock_before - 1

    orders = client.get("/api/v1/orders", headers=h)
    assert orders.status_code == 200 and orders.json()[0]["status"] == "paid"
    assert client.get(f"/api/v1/orders/{co['order_id']}", headers=other).status_code == 404


def test_failed_payment_and_webhook(client, monkeypatch):
    h = auth(client, "fail@example.com")
    monkeypatch.setattr(payment_service.stripe.PaymentIntent, "create", lambda **kw: {"id": "pi_test_2", "client_secret": "s"})
    monkeypatch.setattr(
        payment_service.stripe.PaymentIntent,
        "retrieve",
        lambda _id: {"id": _id, "status": "requires_payment_method", "last_payment_error": {"message": "declined"}},
    )
    client.post("/api/v1/cart/items", json={"product_id": 2, "quantity": 1}, headers=h)
    client.post("/api/v1/checkout", headers=h)
    s = client.get("/api/v1/payments/pi_test_2/status", headers=h).json()
    assert s["payment_status"] == "failed"
    assert client.get("/api/v1/cart", headers=h).json()["items"]

    assert client.post("/api/v1/payments/webhook", content=b"{}", headers={"stripe-signature": "bad"}).status_code == 400


def test_stripe_error_is_handled(client, monkeypatch):
    h = auth(client, "err@example.com")

    def boom(**kw):
        raise stripe.APIConnectionError("down")

    monkeypatch.setattr(payment_service.stripe.PaymentIntent, "create", boom)
    client.post("/api/v1/cart/items", json={"product_id": 3, "quantity": 1}, headers=h)
    assert client.post("/api/v1/checkout", headers=h).status_code == 502
