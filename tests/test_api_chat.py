import unittest

from app import app, db, seed_data


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


if __name__ == '__main__':
    unittest.main()
