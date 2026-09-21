import unittest

from app import app, db, seed_data, socketio


class ChatApiTests(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.client = app.test_client()

        with app.app_context():
            db.drop_all()
            db.create_all()
            seed_data()

    def test_chat_api_post_returns_reply(self):
        response = self.client.post(
            '/api/chat',
            json={'message': 'Show me the USB activity evidence', 'case_id': 'CV-014'}
        )

        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['case_id'], 'CV-014')
        self.assertIn('USB', data['reply'])
        self.assertIn('chain-of-custody', data['reply'])

    def test_multiplayer_health_route(self):
        response = self.client.get('/api/multiplayer/health')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['status'], 'ok')
        self.assertIn('players', data)

    def test_multiplayer_socket_join_room(self):
        client = socketio.test_client(app, flask_test_client=self.client)
        client.emit('join_room', {'room': 'case-014', 'player_name': 'Agent Delta'})
        received = client.get_received()
        self.assertTrue(any(event['name'] == 'room_state' for event in received))

    def test_ai_course_plan_endpoint(self):
        response = self.client.post(
            '/api/ai-course-plan',
            json={'goal': 'forensic investigation', 'level': 'beginner', 'learner': 'Alex'}
        )

        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn('recommendations', data)
        self.assertIn('instructions', data)
        self.assertIn('daily_streak', data)
        self.assertIn('progress_summary', data)

    def test_learner_profile_and_streak_history(self):
        response = self.client.post(
            '/api/learner-profile',
            json={'learner': 'Alex', 'level': 'intermediate'}
        )

        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['learner'], 'Alex')
        self.assertIn('streak_history', data)
        self.assertIn('daily_challenge', data)
        self.assertIn('badges', data)
        self.assertIn('progress_summary', data)

    def test_game_dashboard_and_forensic_ai(self):
        page = self.client.get('/game')
        self.assertEqual(page.status_code, 200)

        ai_response = self.client.post(
            '/api/forensic-ai',
            json={'question': 'Why is the moon blue in my toaster?'}
        )

        self.assertEqual(ai_response.status_code, 200)
        data = ai_response.get_json()
        self.assertIn('answer', data)
        self.assertTrue(len(data['answer']) > 20)

    def test_site_walkthrough_endpoint(self):
        response = self.client.post(
            '/api/site-walkthrough',
            json={'audience': 'new learner', 'goal': 'intro'}
        )

        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn('steps', data)
        self.assertIn('overview', data)


if __name__ == '__main__':
    unittest.main()
