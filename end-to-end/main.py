import requests
import logging
import json
import jwt
import sys

import shared
import user
import post

# how to test unhappy paths??
# if they were handled by a different test suite?
# or the first time we come across a step type in this suite, we also test the unhappy paths for it?
# or is this a sign that our steps are too large and need to be more granular/specific?

# no, I don't want more granularity: want to be able to define large steps for ease of testing
# but should have a boolean flag or something in this code that globally enables testing of un-happy paths at every step
# this will naturally result in much slower testing, but that's okay, because it's not the default

def parse_file(path):
    with open(path, 'r') as f:
        data = json.load(f)
        if isinstance(data, dict):
            return [data]
        elif isinstance(data, list):
            data.sort(key=lambda x: x['meta']['timing'])
            return data
        else:
            print('Unable to parse file: ' + path)
            return []

def merge_sorted_lists(listA, listB):
    if len(listA) == 0:
        return listB
    if len(listB) == 0:
        return listA

    indexA = 0
    indexB = 0

    while indexA < len(listA) and indexB < len(listB):
        if listA[indexA]['meta']['timing'] < listB[indexB]['meta']['timing']:
            indexA += 1
        else:
            listA.insert(indexA, listB[indexB])
            indexA += 1
            indexB += 1

    if indexB < len(listB):
        listA.extend(listB[indexB:])
    
    return listA

def handle_step(source, admin_user, moderator_user):
    source_type = source['meta']['type']
    source_id = source['meta']['id']
    logging.debug(source_type + ' : ' + source_id + ' @ ' + str(source['meta']['timing']))
    success = True

    if source_type == 'define_user':
        shared.GLOBAL_DATA[source_id] = user.User(source)
    elif source_type == 'define_post':
        shared.GLOBAL_DATA[source_id] = post.Post(source)
    elif source_type == 'define_comment':
        shared.GLOBAL_DATA[source_id] = comment.Comment(source)
    elif source_type == 'define_reply':
        shared.GLOBAL_DATA[source_id] = reply.Reply(source)
    elif source_type == 'create_user':
        success = shared.GLOBAL_DATA[source['user']].create(moderator_user)
    elif source_type == 'login_user':
        success = shared.GLOBAL_DATA[source['user']].login()
    elif source_type == 'make_post':
        success = shared.GLOBAL_DATA[source['post']].make()
    elif source_type == 'make_comment':
        success = shared.GLOBAL_DATA[source['comment']].make()
    elif source_type == 'make_reply':
        success = shared.GLOBAL_DATA[source['reply']].make()
    elif source_type == 'find_post':
        success = shared.GLOBAL_DATA[source['post']].find()
    elif source_type == 'draft_post':
        success = shared.GLOBAL_DATA[source['post']].draft()
    elif source_type == 'publish_post':
        success = shared.GLOBAL_DATA[source['post']].publish()
    elif source_type == 'edit_post':
        success = shared.GLOBAL_DATA[source['post']].edit(source)
    elif source_type == 'edit_comment':
        success = shared.GLOBAL_DATA[source['comment']].edit(source)
    elif source_type == 'edit_reply':
        success = shared.GLOBAL_DATA[source['reply']].edit(source)
    elif source_type == 'soft_delete_post':
        success = shared.GLOBAL_DATA[source['post']].soft_delete()
    elif source_type == 'soft_delete_comment':
        success = shared.GLOBAL_DATA[source['comment']].soft_delete()
    elif source_type == 'soft_delete_reply':
        success = shared.GLOBAL_DATA[source['reply']].soft_delete()
    elif source_type == 'hard_delete_user':
        success = shared.GLOBAL_DATA[source['user']].hard_delete(admin_user)
    elif source_type == 'hard_delete_post':
        success = shared.GLOBAL_DATA[source['post']].hard_delete(admin_user)
    elif source_type == 'hard_delete_comment':
        success = shared.GLOBAL_DATA[source['comment']].hard_delete(admin_user)
    elif source_type == 'hard_delete_reply':
        success = shared.GLOBAL_DATA[source['reply']].hard_delete(admin_user)
    else:
        print('Unknown step type: ' + source_type)   

    return success

def get_admin_user():
    data = parse_file('./json/admin/user.json')
    return user.User(data[0])

def get_moderator_user():
    data = parse_file('./json/moderator/user.json')
    return user.User(data[0])

def go():
    admin_user = get_admin_user()
    moderator_user = get_moderator_user()

    paths = [
        # './json/alice/user.json',
        # './json/alice/post01.json',
        # './json/bob/user.json',
        # './json/bob/thread01.json',
    ]

    all_steps = []
    for path in paths:
        data = parse_file(path)
        all_steps = merge_sorted_lists(all_steps, data)

    for step in all_steps:
        # if step['meta']['timing'] < 0:
        #     continue
        # if step['meta']['timing'] > 10:
        #     break
        
        success = handle_step(step, admin_user, moderator_user)
        if not success and step['meta']['expect'] == 'success':
            print('unexpected failure')
            break
        elif success and step['meta']['expect'] == 'failure':
            print('unexpected success')
            break

if __name__ == "__main__":
    logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)
    go()

