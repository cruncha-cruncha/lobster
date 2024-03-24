import requests
import logging
import json
import time
import jwt

import shared

class User:
    def __init__(self, source):
        self.source = source
        self.user_id = None
        self.claims_level = None
        self.access_token = None
        self.refresh_token = None
    
    def login(self):
        if self.access_token is not None:
            decoded_access = jwt.decode(self.access_token, options={"verify_signature": False})
            if decoded_access['exp'] - 60 > int(time.time()):
                return True
        
        if self.refresh_token is not None:
            decoded_refresh = jwt.decode(self.refresh_token, options={"verify_signature": False})
            if decoded_refresh['exp'] - 60 > int(time.time()):
                refresh = requests.post(
                    shared.CAPTAIN_URL + '/tokens',
                    headers={'Authorization': 'Bearer ' + self.refresh_token},
                )

                if refresh.status_code != 200:
                    logging.debug('Failed to refresh token: ' + str(refresh.status_code))
                else:
                    response_data = refresh.json()
                    self.user_id = response_data['user_id']
                    self.claims_level = response_data['claims_level']
                    self.access_token = response_data['access_token']
                    self.refresh_token = response_data['refresh_token']
                    return True

        login = requests.post(
            shared.CAPTAIN_URL + '/users',
            json={
                'email': self.source['email'],
                'password': self.source['password']
            }
        )

        if login.status_code != 200:
            logging.debug('Failed to login: ' + str(login.status_code))
            return False

        response_data = login.json()
        self.user_id = response_data['user_id']
        self.claims_level = response_data['claims_level']
        self.access_token = response_data['access_token']
        self.refresh_token = response_data['refresh_token']

        return True

    def create(self, super_user):
        create_invitation = requests.post(
            shared.CAPTAIN_URL + '/invitations',
            json={'email': self.source['email']}
        )

        if create_invitation.status_code != 200:
            logging.debug('Failed to create invitation: ' + str(create_invitation.status_code))
            return False

        if not super_user.login():
            return False

        invitation = requests.post(
            shared.CAPTAIN_URL + '/admin/invitation',
            headers={'Authorization': 'Bearer ' + super_user.access_token},
            json={'email': self.source['email']}
        )

        if invitation.status_code != 200:
            logging.debug('Failed to read invitation: ' + str(invitation.status_code))
            return False

        invitation_code = invitation.text

        accept_invitation = requests.post(
            shared.CAPTAIN_URL + '/invitations/' + invitation_code,
            json={
                'name': self.source['name'],
                'email': self.source['email'],
                'password': self.source['password'],
                'language': self.source['language'],
                'country': self.source['country']
            }
        )

        if accept_invitation.status_code != 200:
            logging.debug('Failed to accept invitation: ' + str(accept_invitation.status_code))
            return False

        return True

    def hard_delete(self, super_user):
        if not self.login():
            return False

        if not super_user.login():
            return False

        delete_user = requests.delete(
            shared.CAPTAIN_URL + '/admin/users/' + str(self.user_id),
            headers={'Authorization': 'Bearer ' + super_user.access_token}
        )

        if delete_user.status_code != 200:
            logging.debug('Failed to hard delete user: ' + str(delete_user.status_code))
            return False

        return True


