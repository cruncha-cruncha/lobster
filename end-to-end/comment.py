import requests
import shared
import logging

class Comment:
    def __init__(self, source):
        self.source = source
        self.replies = None
        self.uuid = None

    def make(self):
        user = shared.GLOBAL_DATA[self.source['author']]
        user.login()

        comment = requests.post(
            shared.CAPTAIN_URL + '/comments',
            headers={'Authorization': 'Bearer ' + user.access_token},
            json={
                'post_uuid': self.source['post_uuid'],
                'content': self.source['content']
            }
        )

        if comment.status_code != 200:
            logging.debug('Failed to create comment: ' + str(comment.status_code))
            return False

        self.uuid = comment.json()['uuid']

        # add comment to parent post if it exists
        if self.source['post_uuid'] in shared.GLOBAL_DATA:
            parent = shared.GLOBAL_DATA[self.source['post_uuid']]
            if parent.comments is None:
                parent.comments = []
            parent.comments.append(self.uuid)

        return True

    def update(self, source):
        if not source['post_uuid'] == self.source['post_uuid']:
            logging.debug("Bad comment update: different post")
            return False
        
        user = shared.GLOBAL_DATA[source['author']]
        user.login()

        comment = requests.patch(
            shared.CAPTAIN_URL + '/comments/' + self.uuid,
            headers={'Authorization': 'Bearer ' + user.access_token},
            json={
                'content': source['content']
            }
        )

        if comment.status_code != 200:
            logging.debug('Failed to update comment: ' + str(comment.status_code))
            return False

        self.source = source
        return True

    def soft_delete(self):
        user = shared.GLOBAL_DATA[self.source['author']]
        user.login()

        comment = requests.delete(
            shared.CAPTAIN_URL + '/comments/' + self.uuid,
            headers={'Authorization': 'Bearer ' + user.access_token},
        )

        if comment.status_code != 204:
            logging.debug('Failed to soft delete comment: ' + str(comment.status_code))
            return False

        # remove comment from parent post if it exists
        if self.source['post_uuid'] in shared.GLOBAL_DATA:
            parent = shared.GLOBAL_DATA[self.source['post_uuid']]
            if parent.comments is not None:
                parent.comments = [uuid for uuid in parent.comments if not uuid == self.uuid]

        return True

    def hard_delete(self, admin_user):
        admin_user.login()

        comment = requests.delete(
            shared.CAPTAIN_URL + '/admin/comments/' + self.uuid,
            headers={'Authorization': 'Bearer ' + admin_user.access_token},
        )

        if comment.status_code != 200:
            logging.debug('Failed to hard delete comment: ' + str(comment.status_code))
            return False

        # remove comment from parent post if it exists
        if self.source['post_uuid'] in shared.GLOBAL_DATA:
            parent = shared.GLOBAL_DATA[self.source['post_uuid']]
            if parent.comments is not None:
                parent.comments = [uuid for uuid in parent.comments if not uuid == self.uuid]

        return True
