import requests
import shared
import logging

class Reply:
    def __init__(self, source):
        self.source = source
        self.uuid = None

    def make(self):
        user = shared.GLOBAL_DATA[self.source['author']]
        user.login()

        reply = requests.post(
            shared.CAPTAIN_URL + '/replies',
            headers={'Authorization': 'Bearer ' + user.access_token},
            json={
                'comment_uuid': self.source['comment_uuid'],
                'content': self.source['content']
            }
        )

        if reply.status_code != 200:
            logging.debug('Failed to create reply: ' + str(reply.status_code))
            return False

        self.uuid = reply.json()['uuid']

        # add reply to parent comment if it exists
        if self.source['comment_uuid'] in shared.GLOBAL_DATA:
            parent = shared.GLOBAL_DATA[self.source['comment_uuid']]
            if parent.replies is None:
                parent.replies = []
            parent.replies.append(self.uuid)

        return True

    def update(self, source):
        if not source['comment_uuid'] == self.source['comment_uuid']:
            logging.debug("Bad reply update: different comment")
            return False
        
        user = shared.GLOBAL_DATA[source['author']]
        user.login()

        reply = requests.post(
            shared.CAPTAIN_URL + '/replies/' + self.uuid,
            headers={'Authorization': 'Bearer ' + user.access_token},
            json={
                'content': source['content']
            }
        )

        if reply.status_code != 200:
            logging.debug('Failed to update reply: ' + str(reply.status_code))
            return False
        
        self.source = source
        return True

    def soft_delete(self):
        user = shared.GLOBAL_DATA[self.source['author']]
        user.login()

        reply = requests.delete(
            shared.CAPTAIN_URL + '/replies/' + self.uuid,
            headers={'Authorization': 'Bearer ' + user.access_token},
        )

        if reply.status_code != 204:
            logging.debug('Failed to soft delete reply: ' + str(reply.status_code))
            return False

        # remove reply from parent comment if it exists
        if self.source['comment_uuid'] in shared.GLOBAL_DATA:
            parent = shared.GLOBAL_DATA[self.source['comment_uuid']]
            if parent.replies is not None:
                parent.replies = [uuid for uuid in parent.replies if not uuid == self.uuid]

        return True

    def hard_delete(self, admin_user):
        admin_user.login()

        reply = requests.delete(
            shared.CAPTAIN_URL + '/admin/replies/' + self.uuid,
            headers={'Authorization': 'Bearer ' + admin_user.access_token},
        )

        if reply.status_code != 200:
            logging.debug('Failed to hard delete reply: ' + str(reply.status_code))
            return False

        # remove reply from parent comment if it exists
        if self.source['comment_uuid'] in shared.GLOBAL_DATA:
            parent = shared.GLOBAL_DATA[self.source['comment_uuid']]
            if parent.replies is not None:
                parent.replies = [uuid for uuid in parent.replies if not uuid == self.uuid]

        return True
