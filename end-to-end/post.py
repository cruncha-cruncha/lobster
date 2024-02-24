class Post:
    def __init__(self, source):
        self.source = source
        self.uuid = None

    def make(self):
        user = GLOBAL_DATA[self.source['author']]
        user.login()

        post = requests.post(
            constants.CAPTAIN_URL + 'posts',
            headers={'Authorization': 'Bearer ' + user.access_token},
            json={
                'title': self.source['title'],
                'images': self.source['images'],
                'content': self.source['content'],
                'price': self.source['price'],
                'currency': self.source['currency'],
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

    def delete(self):
        return False