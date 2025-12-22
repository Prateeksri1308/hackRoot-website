from locust import HttpUser, task, between

class TestUser(HttpUser):
    wait_time = between(1, 2)

    @task
    def submit_form(self):
        self.client.post(
            "/submit",
            data={
                "name": "Test User",
                "email": "test@example.com",
                "phone": "9876543210",
                "github": "",
                "message": "Load test message"
            }
        )
