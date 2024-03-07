import requests
import shared
import logging

class Post:
    def __init__(self, source):
        self.source = source
        self.comments = None
        self.sale = None
        self.uuid = None

    def make(self):
        user = shared.GLOBAL_DATA[self.source['author']]
        user.login()

        post = requests.post(
            shared.CAPTAIN_URL + '/posts',
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

    def update(self, source):
        user = shared.GLOBAL_DATA[source['author']]
        user.login()

        post = requests.patch(
            shared.CAPTAIN_URL + '/posts/' + self.uuid,
            headers={'Authorization': 'Bearer ' + user.access_token},
            json={
                'title': source['title'],
                'images': source['images'],
                'content': source['content'],
                'price': source['price'],
                'currency': source['currency'],
                'country': source['country'],
                'latitude': source['latitude'],
                'longitude': source['longitude'],
                'draft': source['draft']
            }
        )

        if post.status_code != 200:
            logging.debug('Failed to update post: ' + str(post.status_code))
            return False

        self.source = source
        return True

    def draft(self):
        source = self.source
        source['draft'] = True
        return self.update(source)

    def publish(self):
        source = self.source
        source['draft'] = False
        return self.update(source)

    def soft_delete(self):
        user = shared.GLOBAL_DATA[self.source['author']]
        user.login()

        post = requests.delete(
            shared.CAPTAIN_URL + '/posts/' + self.uuid,
            headers={'Authorization': 'Bearer ' + user.access_token},
        )

        if post.status_code != 204:
            logging.debug('Failed to soft delete post: ' + str(post.status_code))
            return False

        return True

    def hard_delete(self, super_user):
        super_user.login()

        post = requests.delete(
            shared.CAPTAIN_URL + '/admin/posts/' + self.uuid,
            headers={'Authorization': 'Bearer ' + super_user.access_token},
        )

        if post.status_code != 200:
            logging.debug('Failed to hard delete post: ' + str(post.status_code))
            return False

        return True

    def find(self):
        results = requests.post(
            shared.SEARCH_URL + '/search/posts',
            json={
                'full': True,
                'offset': 0,
                'limit': 2,
                'sort_by': 0,
                'term': self.source['title'],
                'countries': [self.source['country']],
                'latitude': self.source['latitude'],
                'longitude': self.source['longitude'],
                'radius': 1.0,
                'no_price': {
                    'only': False,
                    'exclude': False
                },
                'price_range': {
                    'valid': False,
                    'min': 0.0,
                    'max': 0.0
                }
            }
        )

        if results.status_code != 200:
            logging.debug('Failed to search post: ' + str(results.status_code))
            return False

        data = results.json()
        if len(data) > 1:
            logging.debug('Find Post is insufficiently selective, found ', len(data))
            return False
        elif len(data) < 1:
            logging.debug('Unable to find post')
            return False

        self.uuid = data[0]['uuid']
        return False