import requests
import shared
import logging

class Post:
    def __init__(self, source):
        self.source = source
        self.uuid = None

    def make(self):
        user = shared.GLOBAL_DATA[self.source['author']]
        user.login()

        post = requests.post(
            shared.CAPTAIN_URL + 'posts',
            headers={'Authorization': 'Bearer ' + user.access_token},
            json={
                'title': self.source['title'],
                'images': self.source['images'],
                'content': self.source['content'],
                'price': self.source['price'],
                'currency': self.source['currency'],
                'country': self.source['country'],
                'latitude': self.source['latitude'],
                'longitude': self.source['longitude'],
                'draft': self.source['draft']
            }
        )

        if post.status_code != 200:
            logging.debug('Failed to create post: ' + str(post.status_code))
            return False

        self.uuid = post.json()['uuid']
        return True

    def draft(self):
        return False

    def publish(self):
        return False

    def soft_delete(self):
        user = shared.GLOBAL_DATA[self.source['author']]
        user.login()

        post = requests.delete(
            shared.CAPTAIN_URL + 'posts/' + self.uuid,
            headers={'Authorization': 'Bearer ' + user.access_token},
        )

        if post.status_code != 204:
            logging.debug('Failed to soft delete post: ' + str(post.status_code))
            return False

        return True

    def hard_delete(self, super_user):
        super_user.login()

        post = requests.delete(
            shared.CAPTAIN_URL + 'admin/posts/' + self.uuid,
            headers={'Authorization': 'Bearer ' + super_user.access_token},
        )

        if post.status_code != 200:
            logging.debug('Failed to hard delete post: ' + str(post.status_code))
            return False

        return True